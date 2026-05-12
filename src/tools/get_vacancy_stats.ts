import { VacancyStatsInput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';

const ATTRIBUTION = '空き家データ: 総務省 住宅・土地統計調査 (e-Stat)';
const NATIONAL_AVG_VACANCY_RATE = 13.6;

export async function getVacancyStatsTool(rawArgs: Record<string, unknown>): Promise<{
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}> {
  const input = VacancyStatsInput.parse(rawArgs);
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);
  const loader = getLoader(prefKey);

  let records = loader.getVacancy();

  if (input.area) {
    records = records.filter(r => r.city.includes(input.area!));
  }

  const totalVacant = records.reduce((s, r) => s + r.total_vacant, 0);
  const totalHousing = records.reduce((s, r) => s + r.total_housing, 0);
  const prefAvgRate = totalHousing > 0
    ? Math.round((totalVacant / totalHousing) * 1000) / 10
    : 0;

  const areaLabel = input.area ?? prefDisplay;
  const summary = records.length > 0
    ? `${areaLabel}: 空き家率 ${prefAvgRate}% (全国平均 ${NATIONAL_AVG_VACANCY_RATE}%)。${records.length}市区町村のデータ。`
    : `${areaLabel}: 空き家データが見つかりませんでした。`;

  const result = {
    area: areaLabel,
    records: records.map(r => ({
      city: r.city,
      total_housing: r.total_housing,
      total_vacant: r.total_vacant,
      vacancy_rate: r.vacancy_rate,
      for_rent: r.for_rent,
      for_sale: r.for_sale,
      other_vacant: r.other_vacant,
    })),
    prefectureAvgRate: prefAvgRate,
    nationalAvgRate: NATIONAL_AVG_VACANCY_RATE,
    summary,
    attribution: ATTRIBUTION,
  };

  const md = [
    `## 空き家率統計 — ${areaLabel} (${prefDisplay})`,
    '',
    `| 市区町村 | 空き家率 | 空き家数 | 賃貸用 | 売却用 | その他 |`,
    `|---------|---------|---------|--------|--------|--------|`,
    ...records.slice(0, 20).map(r =>
      `| ${r.city} | ${r.vacancy_rate}% | ${r.total_vacant.toLocaleString()} | ${r.for_rent.toLocaleString()} | ${r.for_sale.toLocaleString()} | ${r.other_vacant.toLocaleString()} |`,
    ),
    records.length > 20 ? `| ... | (${records.length - 20}件省略) | | | | |` : '',
    '',
    `**都道府県平均**: ${prefAvgRate}% / **全国平均**: ${NATIONAL_AVG_VACANCY_RATE}%`,
    '',
    `> ${ATTRIBUTION}`,
  ].filter(Boolean).join('\n');

  return {
    content: [{ type: 'text' as const, text: md }],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}
