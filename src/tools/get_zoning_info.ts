import { ZoningInfoInput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';

const ATTRIBUTION = '用途地域データ: 国土交通省 不動産取引価格情報ベース推定値';

export async function getZoningInfoTool(rawArgs: Record<string, unknown>): Promise<{
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}> {
  const input = ZoningInfoInput.parse(rawArgs);
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);
  const loader = getLoader(prefKey);

  let records = loader.getZoning();

  if (input.area) {
    records = records.filter((r) => r.city.includes(input.area!));
  }
  if (input.district) {
    records = records.filter((r) => r.district.includes(input.district!));
  }

  const zoneDistribution: Record<string, number> = {};
  for (const r of records) {
    zoneDistribution[r.zone_type] = (zoneDistribution[r.zone_type] ?? 0) + 1;
  }

  const topZone = Object.entries(zoneDistribution).sort(([, a], [, b]) => b - a)[0];
  const areaLabel = input.area ?? prefDisplay;
  const summary =
    records.length > 0
      ? `${areaLabel}: ${records.length}地区の用途地域データ。最多は「${topZone?.[0] ?? '不明'}」(${topZone?.[1] ?? 0}件)。`
      : `${areaLabel}: 用途地域データが見つかりませんでした。`;

  const result = {
    area: areaLabel,
    records: records.map((r) => ({
      city: r.city,
      district: r.district,
      zone_type: r.zone_type,
      coverage_ratio: r.coverage_ratio,
      floor_area_ratio: r.floor_area_ratio,
      height_limit: r.height_limit,
    })),
    zoneDistribution,
    summary,
    attribution: ATTRIBUTION,
  };

  const md = [
    `## 用途地域情報 — ${areaLabel} (${prefDisplay})`,
    '',
    `| 地区 | 用途地域 | 建蔽率 | 容積率 | 高さ制限 |`,
    `|------|---------|--------|--------|---------|`,
    ...records.map(
      (r) =>
        `| ${r.city} ${r.district} | ${r.zone_type} | ${r.coverage_ratio}% | ${r.floor_area_ratio}% | ${r.height_limit ? r.height_limit + 'm' : '−'} |`,
    ),
    '',
    `**分布**: ${Object.entries(zoneDistribution)
      .map(([k, v]) => `${k}: ${v}件`)
      .join(', ')}`,
    '',
    `> ${ATTRIBUTION}`,
  ].join('\n');

  return {
    content: [{ type: 'text' as const, text: md }],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}
