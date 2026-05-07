import SunCalc from 'suncalc';
import type { LandscapeInput, LandscapeOutput } from '../schemas.js';
import type { PlateauBuildingRecord } from '../data-loaders/index.js';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const METERS_PER_DEG_LAT = 111_320;

function metersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos(lat * DEG_TO_RAD);
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getSunPosition(
  date: Date,
  lat: number,
  lng: number,
): { azimuth: number; altitude: number } {
  const pos = SunCalc.getPosition(date, lat, lng);
  // SunCalc azimuth: radians from south, clockwise. Convert to compass bearing (from north).
  const compassAzimuth = pos.azimuth + Math.PI;
  return { azimuth: compassAzimuth, altitude: pos.altitude };
}

export function computeShadowPolygon(
  building: { lat: number; lng: number; height_m: number },
  sunAzimuth: number,
  sunAltitude: number,
): [number, number][] {
  if (sunAltitude <= 0) return [];

  const shadowLength = building.height_m / Math.tan(sunAltitude);
  const halfSide = (Math.sqrt(building.height_m) * 0.5) / 2;

  const dLatPerM = 1 / METERS_PER_DEG_LAT;
  const dLngPerM = 1 / metersPerDegLng(building.lat);

  // Shadow direction is opposite to the sun direction
  const shadowDir = sunAzimuth + Math.PI;
  const sdx = Math.sin(shadowDir);
  const sdy = Math.cos(shadowDir);

  // Perpendicular direction for footprint width
  const px = Math.cos(shadowDir);
  const py = -Math.sin(shadowDir);

  const corners: [number, number][] = [
    [building.lat + (-px * halfSide) * dLatPerM, building.lng + (-py * halfSide) * dLngPerM],
    [building.lat + (px * halfSide) * dLatPerM, building.lng + (py * halfSide) * dLngPerM],
  ];

  const shadowCorners: [number, number][] = corners.map(([lat, lng]) => [
    lat + sdx * shadowLength * dLatPerM,
    lng + sdy * shadowLength * dLngPerM,
  ]);

  return [corners[0], corners[1], shadowCorners[1], shadowCorners[0]];
}

function resolveDateTime(
  dateTime: string | undefined,
  timePreset: 'morning' | 'noon' | 'evening' | undefined,
): Date {
  const base = dateTime ? new Date(dateTime) : new Date();
  if (timePreset) {
    const hours = { morning: 8, noon: 12, evening: 17 }[timePreset];
    base.setHours(hours, 0, 0, 0);
  }
  return base;
}

export function simulateLandscapeImpact(input: LandscapeInput): LandscapeOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const buildings = loader.getPlateauBuildings();

  const { lat, lng, radiusM, includeMarkdown } = input;
  const dt = resolveDateTime(input.dateTime, input.timePreset);

  const nearbyBuildings = buildings.filter(
    (b) => haversineM(lat, lng, b.lat, b.lng) <= radiusM,
  );

  const sun = getSunPosition(dt, lat, lng);
  const azimuthDeg = sun.azimuth * RAD_TO_DEG;
  const altitudeDeg = sun.altitude * RAD_TO_DEG;

  const shadowPolygons: LandscapeOutput['shadowPolygons'] = [];
  let totalShadowArea = 0;

  for (const b of nearbyBuildings) {
    const poly = computeShadowPolygon(
      { lat: b.lat, lng: b.lng, height_m: b.height_m },
      sun.azimuth,
      sun.altitude,
    );
    const footprintWidth = Math.sqrt(b.height_m) * 0.5;
    const shadowLen = sun.altitude > 0 ? b.height_m / Math.tan(sun.altitude) : 0;
    const approxArea = shadowLen * footprintWidth;
    totalShadowArea += approxArea;

    shadowPolygons.push({
      buildingName: b.building_name,
      height: b.height_m,
      shadowLengthM: Math.round(shadowLen * 10) / 10,
      polygon: poly,
    });
  }

  const heights = nearbyBuildings.map((b) => b.height_m);
  const maxHeight = heights.length > 0 ? Math.max(...heights) : 0;
  const avgHeight = heights.length > 0
    ? Math.round((heights.reduce((s, h) => s + h, 0) / heights.length) * 10) / 10
    : 0;

  // Sunlight hours estimate: check 8, 10, 12, 14, 16 o'clock
  const checkHours = [8, 10, 12, 14, 16];
  let sunlitCount = 0;
  for (const h of checkHours) {
    const checkDate = new Date(dt);
    checkDate.setHours(h, 0, 0, 0);
    const sp = getSunPosition(checkDate, lat, lng);
    if (sp.altitude * RAD_TO_DEG <= 10) continue;

    let inShadow = false;
    for (const b of nearbyBuildings) {
      const poly = computeShadowPolygon(
        { lat: b.lat, lng: b.lng, height_m: b.height_m },
        sp.azimuth,
        sp.altitude,
      );
      if (poly.length >= 3 && pointInPolygon(lat, lng, poly)) {
        inShadow = true;
        break;
      }
    }
    if (!inShadow) sunlitCount++;
  }
  const sunlightHoursEstimate = Math.round((sunlitCount / checkHours.length) * 10 * 10) / 10;

  const highImpactBuildings = nearbyBuildings
    .filter((b) => b.shadow_impact === 'high')
    .map((b) => ({
      name: b.building_name,
      height: b.height_m,
      distance: Math.round(haversineM(lat, lng, b.lat, b.lng)),
    }));

  const keyInsights: string[] = [];
  if (nearbyBuildings.length === 0) {
    keyInsights.push(`半径${radiusM}m以内にPLATEAU建物データがありません。`);
  } else {
    keyInsights.push(
      `半径${radiusM}m内に${nearbyBuildings.length}棟の建物が存在（最大${maxHeight}m、平均${avgHeight}m）。`,
    );
  }
  if (altitudeDeg <= 0) {
    keyInsights.push('太陽が地平線以下のため、影シミュレーションは実行されませんでした。');
  } else {
    keyInsights.push(
      `太陽高度${Math.round(altitudeDeg)}°、方位角${Math.round(azimuthDeg)}°。推定日照時間: ${sunlightHoursEstimate}時間/日。`,
    );
  }
  if (highImpactBuildings.length > 0) {
    keyInsights.push(
      `影響度「高」の建物が${highImpactBuildings.length}棟あります。日照に大きな影響を与える可能性があります。`,
    );
  }
  if (totalShadowArea > 10_000) {
    keyInsights.push('周辺の影面積が大きいため、日照条件の詳細な現地調査を推奨します。');
  }

  let markdownReport: string | undefined;
  if (includeMarkdown) {
    const now = new Date().toISOString().split('T')[0];
    markdownReport = [
      `# 日照・影シミュレーションレポート`,
      ``,
      `生成日: ${now}  `,
      `対象地点: ${lat}, ${lng}  `,
      `シミュレーション日時: ${dt.toISOString()}  `,
      `検索半径: ${radiusM}m`,
      ``,
      `## サマリー`,
      ``,
      `| 指標 | 値 |`,
      `|---|---|`,
      `| 周辺建物数 | ${nearbyBuildings.length} |`,
      `| 最大高さ | ${maxHeight}m |`,
      `| 平均高さ | ${avgHeight}m |`,
      `| 推定影面積合計 | ${Math.round(totalShadowArea)}㎡ |`,
      `| 推定日照時間 | ${sunlightHoursEstimate}時間/日 |`,
      ``,
      `## 太陽位置`,
      ``,
      `- 方位角: ${Math.round(azimuthDeg)}°（北基準・時計回り）`,
      `- 高度: ${Math.round(altitudeDeg * 10) / 10}°`,
      `- 日時: ${dt.toISOString()}`,
      ``,
      `## 影分析`,
      ``,
      shadowPolygons.length > 0
        ? [
            `| 建物名 | 高さ(m) | 影長(m) |`,
            `|---|---|---|`,
            ...shadowPolygons
              .sort((a, b) => b.shadowLengthM - a.shadowLengthM)
              .slice(0, 20)
              .map((s) => `| ${s.buildingName} | ${s.height} | ${s.shadowLengthM} |`),
          ].join('\n')
        : '太陽が地平線以下のため影は生成されませんでした。',
      ``,
      `## 影響度の高い建物`,
      ``,
      highImpactBuildings.length > 0
        ? [
            `| 建物名 | 高さ(m) | 距離(m) |`,
            `|---|---|---|`,
            ...highImpactBuildings.map((b) => `| ${b.name} | ${b.height} | ${b.distance} |`),
          ].join('\n')
        : '影響度「高」の建物はありません。',
      ``,
      `## 推奨事項`,
      ``,
      sunlightHoursEstimate >= 6
        ? '- 日照条件は良好です。住宅用途に適しています。'
        : sunlightHoursEstimate >= 3
          ? '- 日照はやや制限されています。高層建物の影響を考慮してください。'
          : '- 日照時間が短いエリアです。採光設計に特別な配慮が必要です。',
      highImpactBuildings.length > 0
        ? '- 高影響建物が近接しています。季節による影の変動も確認してください。'
        : '',
      '- 本シミュレーションはヒューリスティックです。正確な日影図は建築CADでの検証を推奨します。',
      ``,
      `---`,
      ATTRIBUTION,
    ].join('\n');
  }

  return {
    sunPosition: {
      azimuthDeg: Math.round(azimuthDeg * 10) / 10,
      altitudeDeg: Math.round(altitudeDeg * 10) / 10,
      dateTime: dt.toISOString(),
    },
    nearbyBuildingCount: nearbyBuildings.length,
    maxHeight,
    avgHeight,
    totalShadowAreaSqm: Math.round(totalShadowArea),
    sunlightHoursEstimate,
    shadowPolygons,
    highImpactBuildings,
    keyInsights,
    markdownReport,
  };
}

function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0], xi = polygon[i][1];
    const yj = polygon[j][0], xj = polygon[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
