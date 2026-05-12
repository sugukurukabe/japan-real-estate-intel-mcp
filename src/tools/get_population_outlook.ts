import { PopulationOutlookInput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';

const ATTRIBUTION = '将来人口推計: 国立社会保障・人口問題研究所 (NIPSSR) ベース推計値';

export async function getPopulationOutlookTool(rawArgs: Record<string, unknown>): Promise<{
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}> {
  const input = PopulationOutlookInput.parse(rawArgs);
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);
  const loader = getLoader(prefKey);

  let records = loader.getPopulationProjection();

  if (input.area) {
    records = records.filter(r => r.city.includes(input.area!));
  }

  const avgDecline = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.decline_rate_2050, 0) / records.length * 10) / 10
    : 0;

  const areaLabel = input.area ?? prefDisplay;
  const worstCity = records.length > 0
    ? records.reduce((max, r) => r.decline_rate_2050 > max.decline_rate_2050 ? r : max, records[0])
    : null;
  const bestCity = records.length > 0
    ? records.reduce((min, r) => r.decline_rate_2050 < min.decline_rate_2050 ? r : min, records[0])
    : null;

  const summary = records.length > 0
    ? `${areaLabel}: 2050年平均人口減少率 ${avgDecline}%。最大減少: ${worstCity?.city} (${worstCity?.decline_rate_2050}%)、最小減少: ${bestCity?.city} (${bestCity?.decline_rate_2050}%)。`
    : `${areaLabel}: 将来人口推計データが見つかりませんでした。`;

  const result = {
    area: areaLabel,
    records: records.map(r => ({
      city: r.city,
      pop_2020: r.pop_2020,
      pop_2030: r.pop_2030,
      pop_2040: r.pop_2040,
      pop_2050: r.pop_2050,
      decline_rate_2050: r.decline_rate_2050,
    })),
    prefectureAvgDecline: avgDecline,
    summary,
    attribution: ATTRIBUTION,
  };

  const md = [
    `## 将来人口推計 — ${areaLabel} (${prefDisplay})`,
    '',
    `| 市区町村 | 2020年 | 2030年 | 2040年 | 2050年 | 減少率 |`,
    `|---------|--------|--------|--------|--------|--------|`,
    ...records.slice(0, 20).map(r =>
      `| ${r.city} | ${r.pop_2020.toLocaleString()} | ${r.pop_2030.toLocaleString()} | ${r.pop_2040.toLocaleString()} | ${r.pop_2050.toLocaleString()} | ${r.decline_rate_2050}% |`,
    ),
    records.length > 20 ? `| ... | (${records.length - 20}件省略) | | | | |` : '',
    '',
    `**都道府県平均減少率**: ${avgDecline}%`,
    '',
    `> ${ATTRIBUTION}`,
  ].filter(Boolean).join('\n');

  return {
    content: [{ type: 'text' as const, text: md }],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}
