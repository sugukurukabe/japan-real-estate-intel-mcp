import { ChochouProfileInput } from '../schemas.js';
import { getLandPricesForCity, getPopulationForCity } from '../data/loader.js';
import { getWardChochouList, getPlansForChochou } from '../api-client/nagoya.js';

export function getChochouProfileTool(rawArgs: Record<string, unknown>) {
  const input = ChochouProfileInput.parse(rawArgs);
  const { ward, chochou } = input;

  const cityKey = `名古屋市${ward}`;
  const cityPrices = getLandPricesForCity(cityKey, 'aichi');
  const pop = getPopulationForCity(cityKey, 'aichi');

  const chochouList = getWardChochouList(ward);
  const plans = getPlansForChochou(ward, chochou);

  const avgPrice = cityPrices.length > 0
    ? Math.round(cityPrices.reduce((s, r) => s + r.price_per_sqm, 0) / cityPrices.length)
    : null;
  const avgChange = cityPrices.length > 0
    ? Math.round(cityPrices.reduce((s, r) => s + r.change_rate, 0) / cityPrices.length * 10) / 10
    : 0;

  const profile = {
    ward,
    chochou: chochou || null,
    landPrice: avgPrice != null
      ? { pricePerSqm: avgPrice, changeRate: avgChange }
      : null,
    population: pop
      ? {
          population2020: pop.population_2020,
          households2020: pop.households_2020,
          agingRate: pop.aging_rate,
        }
      : null,
    chochouCount: chochouList.length,
    activePlans: plans.length,
    activePlanNames: plans.map((p) => p.project),
  };

  const md = [
    `# 町丁目プロファイル: ${ward} ${chochou || '(区全体)'}`,
    '',
    `## 地価情報`,
    avgPrice != null
      ? `- 平均坪単価: ${avgPrice.toLocaleString()} 円/㎡\n- 変動率: ${avgChange}%`
      : '- データなし',
    '',
    `## 人口情報`,
    pop
      ? `- 人口(2020): ${pop.population_2020.toLocaleString()}\n- 世帯数: ${pop.households_2020.toLocaleString()}\n- 高齢化率: ${pop.aging_rate}%`
      : '- データなし',
    '',
    `## エリア情報`,
    `- 登録町丁目数: ${chochouList.length}`,
    `- 進行中計画: ${plans.length} 件`,
    ...(plans.length > 0
      ? [`  - ${plans.map((p) => p.project).join('\n  - ')}`]
      : []),
  ];

  return {
    content: [{ type: 'text' as const, text: md.join('\n') }],
    structuredContent: profile,
  };
}
