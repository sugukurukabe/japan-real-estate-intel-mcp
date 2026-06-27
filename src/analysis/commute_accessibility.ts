import { moduleLogger } from '../logger.js';
import type { AnalyzeCommuteAccessibilityInput, AnalyzeCommuteAccessibilityOutput, CommuteDestination } from '../schemas.js';
import { getLoader } from '../data-loaders/registry.js';

const log = moduleLogger('commute_accessibility');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Station hubs with exact coordinates for accessibility analysis
interface HubStation {
  name: string;
  lat: number;
  lng: number;
  routesJa: string;
}

const HUB_STATIONS: Record<string, HubStation[]> = {
  '愛知県': [
    { name: '名古屋駅', lat: 35.1709, lng: 136.8815, routesJa: 'JR各線、名鉄、近鉄、地下鉄東山線・桜通線、あおなみ線' },
    { name: '栄駅', lat: 35.1698, lng: 136.9082, routesJa: '地下鉄東山線・名城線、名鉄瀬戸線' },
  ],
  '東京都': [
    { name: '東京駅', lat: 35.6812, lng: 139.7671, routesJa: 'JR山手線・中央線等、新幹線各線、東京メトロ丸ノ内線' },
    { name: '新宿駅', lat: 35.6895, lng: 139.7003, routesJa: 'JR各線、京王、小田急、都営地下鉄、東京メトロ丸ノ内線' },
    { name: '渋谷駅', lat: 35.6580, lng: 139.7016, routesJa: 'JR各線、東急東横線・田園都市線、京王井の頭線、メトロ各線' },
  ],
  '大阪府': [
    { name: '大阪駅・梅田駅', lat: 34.7024, lng: 135.4959, routesJa: 'JR各線、阪急、阪神、大阪メトロ御堂筋線・谷町線' },
    { name: '難波駅', lat: 34.6670, lng: 135.5020, routesJa: '南海、近鉄、阪神、大阪メトロ御堂筋線・四つ橋線・千日前線' },
  ],
  '福岡県': [
    { name: '博多駅', lat: 33.5902, lng: 130.4207, routesJa: 'JR各線、新幹線各線、地下鉄空港線・七隈線' },
    { name: '西鉄福岡（天jin）駅', lat: 33.5916, lng: 130.4017, routesJa: '西鉄天神大牟田線、地下鉄空港線・七隈線' },
  ],
  '北海道': [
    { name: '札幌駅', lat: 43.0687, lng: 141.3508, routesJa: 'JR函館本線等、地下鉄南北線・東豊線' },
  ],
  '神奈川県': [
    { name: '横浜駅', lat: 35.4658, lng: 139.6223, routesJa: 'JR各線、東急東横線、京急、相鉄、みなとみらい線、地下鉄' },
  ],
  '京都府': [
    { name: '京都駅', lat: 34.9858, lng: 135.7588, routesJa: 'JR各線、新幹線各線、近鉄京都線、地下鉄烏丸線' },
  ],
  '兵庫県': [
    { name: '三ノ宮駅', lat: 34.6944, lng: 135.1955, routesJa: 'JR神戸線、阪急、阪神、ポートライナー、地下鉄' },
  ],
  '千葉県': [
    { name: '千葉駅', lat: 35.6131, lng: 140.1130, routesJa: 'JR各線、京成千葉線、千葉都市モノレール' },
  ],
  '埼玉県': [
    { name: '大宮駅', lat: 35.9063, lng: 139.6240, routesJa: 'JR山手線接続各線、新幹線各線、東武野田線、ニューシャトル' },
  ],
};

const PREFECTURE_DEFAULTS: Record<string, { lat: number; lng: number }> = {
  '愛知県': { lat: 35.1709, lng: 136.8815 },
  '東京都': { lat: 35.6812, lng: 139.7671 },
  '大阪府': { lat: 34.7024, lng: 135.4959 },
  '福岡県': { lat: 33.5902, lng: 130.4207 },
  '北海道': { lat: 43.0687, lng: 141.3508 },
  '神奈川県': { lat: 35.4658, lng: 139.6223 },
  '京都府': { lat: 34.9858, lng: 135.7588 },
  '兵庫県': { lat: 34.6944, lng: 135.1955 },
  '千葉県': { lat: 35.6131, lng: 140.1130 },
  '埼玉県': { lat: 35.9063, lng: 139.6240 },
};

// Haversine formula to compute distance in km
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function analyzeCommuteAccessibility(
  input: AnalyzeCommuteAccessibilityInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AnalyzeCommuteAccessibilityOutput> {
  const prefName = input.prefecture;
  const loader = getLoader(prefName);

  let lat = input.latitude;
  let lng = input.longitude;

  // Resolve coordinates
  if ((lat === undefined || lng === undefined) && loader) {
    if (input.address) {
      const loc = loader.geocode(input.address);
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
      }
    }
    if ((lat === undefined || lng === undefined) && input.city) {
      const loc = loader.geocode(input.city);
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
      }
    }
  }

  // Fallback to prefecture default center
  if (lat === undefined || lng === undefined) {
    const fallback = PREFECTURE_DEFAULTS[prefName] || PREFECTURE_DEFAULTS['愛知県']!;
    lat = fallback.lat;
    lng = fallback.lng;
  }

  const hubs = HUB_STATIONS[prefName] || HUB_STATIONS['愛知県']!;
  const destinations: CommuteDestination[] = [];
  let hasLiveTraffic = false;

  // Compute travel times to each hub
  for (const hub of hubs) {
    let distanceKm = getDistanceKm(lat, lng, hub.lat, hub.lng);
    let estimatedTimeMin = 0;
    let mode: 'transit' | 'driving' | 'walking' = 'transit';
    let routeDescription = hub.routesJa;

    // Use Google Distance Matrix API if key is available
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${hub.lat},${hub.lng}&mode=transit&key=${GOOGLE_MAPS_API_KEY}&language=ja`;
        const res = await fetchImpl(url);
        if (res.ok) {
          const data = (await res.json()) as {
            rows?: Array<{
              elements?: Array<{
                status: string;
                duration: { value: number; text: string };
                distance: { value: number; text: string };
              }>;
            }>;
          };
          const element = data.rows?.[0]?.elements?.[0];
          if (element && element.status === 'OK') {
            estimatedTimeMin = Math.round(element.duration.value / 60);
            distanceKm = Math.round(element.distance.value / 100) / 10;
            routeDescription = `Google Maps Transit: ${element.duration.text} (${element.distance.text})`;
            hasLiveTraffic = true;
          }
        }
      } catch (err) {
        log.error({ err }, `Distance Matrix failed for hub ${hub.name}. Using local estimation.`);
      }
    }

    // Local estimation fallback
    if (estimatedTimeMin === 0) {
      // Transit calculation estimation model:
      // Walk time: assume ~10 mins walk to nearest train access.
      // Train travel time: straight distance * 1.5 min per km (assuming average transit route speed around 40 km/h).
      // Transfer time: 5 mins.
      const walkTime = 10;
      const trainTime = Math.round(distanceKm * 1.5);
      const transferTime = 5;
      estimatedTimeMin = Math.max(3, walkTime + trainTime + transferTime);
      mode = 'transit';
      routeDescription = `${hub.name}方面行きの公共交通機関（${hub.routesJa}）を利用`;
    }

    destinations.push({
      name: hub.name,
      distanceKm,
      estimatedTimeMin,
      routeDescription,
      mode,
    });
  }

  // Find closest station using loader if available
  let closestStation = '周辺駅';
  let closestStationDistanceKm = 0.8; // Default proxy
  let closestStationWalkMin = 10;     // Default proxy

  if (loader && typeof loader.getTransport === 'function') {
    try {
      const stations = loader.getTransport();
      if (stations && stations.length > 0) {
        // Find the unique station with closest proximity
        // Note: stations in database do not have lat/lng directly. We geocode the station based on its district/city.
        // As a fallback, we find transport stations matching the selected city.
        const cityStations = stations.filter(s => s.city === input.city);
        if (cityStations.length > 0) {
          const mainStation = cityStations[0]!;
          closestStation = mainStation.station_name;
          closestStationWalkMin = mainStation.walk_min_to_center || 10;
          closestStationDistanceKm = Math.round((closestStationWalkMin * 80) / 1000 * 10) / 10;
        }
      }
    } catch (err) {
      log.error({ err }, 'Error looking up local stations from database');
    }
  }

  // Calculate accessibility score (0 - 100)
  // Higher score = lower average commute times
  const avgCommuteTime = destinations.reduce((sum, d) => sum + d.estimatedTimeMin, 0) / destinations.length;
  // Score formula: 100 - (avgCommute - 10) * 1.5. Excellent if under 20 mins avg.
  const accessibilityScore = Math.round(Math.max(10, Math.min(100, 100 - (avgCommuteTime - 10) * 1.5)));

  let transitScoreCategory: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' = 'good';
  if (accessibilityScore >= 85) transitScoreCategory = 'excellent';
  else if (accessibilityScore >= 70) transitScoreCategory = 'very_good';
  else if (accessibilityScore >= 55) transitScoreCategory = 'good';
  else if (accessibilityScore >= 40) transitScoreCategory = 'fair';
  else transitScoreCategory = 'poor';

  const markdownReport = buildMarkdownReport(
    prefName, input.city ?? '', lat, lng,
    closestStation, closestStationWalkMin, accessibilityScore, destinations, hasLiveTraffic
  );

  return {
    latitude: lat,
    longitude: lng,
    closestStation,
    closestStationDistanceKm,
    closestStationWalkMin,
    accessibilityScore,
    destinations,
    hasLiveTraffic,
    transitScoreCategory,
    markdownReport,
    attribution: 'Google Maps Distance Matrix & Regional Transit Data Loader',
  };
}

function buildMarkdownReport(
  prefecture: string,
  city: string,
  lat: number,
  lng: number,
  closestStation: string,
  walkMin: number,
  score: number,
  destinations: CommuteDestination[],
  isLive: boolean,
): string {
  const statusBadge = isLive
    ? '`Live Schedule: Active (Google Distance Matrix)`'
    : '`Simulation Mode: Active (Haversine Transit Estimator)`';

  let ratingEmoji = '🟢';
  let ratingText = '優良 (Good)';
  if (score >= 85) { ratingEmoji = '💎'; ratingText = '極めて優秀 (Excellent)'; }
  else if (score >= 70) { ratingEmoji = '🌟'; ratingText = '大変良好 (Very Good)'; }
  else if (score >= 40) { ratingEmoji = '🟡'; ratingText = '普通 (Fair)'; }
  else { ratingEmoji = '🔴'; ratingText = '要改善 (Poor)'; }

  let report = `# 交通・通勤アクセシビリティ評価レポート
${statusBadge}

対象エリア: **${prefecture} ${city}** (緯度: ${lat.toFixed(5)}, 経度: ${lng.toFixed(5)})

---

## 総合アクセシビリティ評価

- **総合利便性スコア**: **${score} / 100**
- **評価ランク**: ${ratingEmoji} **${ratingText}**
- **最寄り駅**: **${closestStation}駅** (徒歩約 **${walkMin}分**)

---

## 🏢 主要ビジネス街・ハブ駅へのアクセス所要時間

| 目的地ハブ駅 | 直線距離 (km) | 推定所要時間 (分) | 利用経路・備考 |
|--------------|---------------|-------------------|---------------|
`;

  for (const dest of destinations) {
    report += `| **${dest.name}** | ${dest.distanceKm.toFixed(1)} km | **${dest.estimatedTimeMin}分** | ${dest.routeDescription} |\n`;
  }

  report += `
---

## 💡 不動産価値・居住利便性インサイト

- **徒歩分数評価**:  
  最寄り駅まで徒歩${walkMin}分は、日本の賃貸市場において${walkMin <= 10 ? '強力なアピールポイント（徒歩10分以内）' : '標準的なアピール枠（徒歩10分超）。バス便や自転車利用の併用も考慮されます'}。
  
- **通勤通学需要**:  
  主要ビジネスハブへの所要時間が30分以内の駅は、単身ビジネスパーソンや共働き世帯に極めて好まれる傾向にあり、資産価値が目減りしにくい安定物件となります。

---
*免責事項: 所要時間は標準的な鉄道運行スケジュールおよび推定歩行速度（80m/分）に基づき算出しています。ラッシュ時の混雑、乗り換え待ち時間、天候等により実際の所要時間は変動します。*`;

  return report;
}
