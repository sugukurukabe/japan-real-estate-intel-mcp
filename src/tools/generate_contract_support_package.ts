import { ContractSupportInput, ContractSupportOutput } from '../schemas.js';
import { getLandPricesForCity, getPopulationForCity } from '../data/loader.js';
import { getFutureTimeline } from '../analysis/future_timeline.js';
import { calculateRenovationYield } from '../analysis/renovation_yield.js';
import { getPlansForChochou } from '../api-client/nagoya.js';

export function generateContractSupportPackageTool(rawArgs: Record<string, unknown>): {
  content: { type: 'text'; text: string }[];
  structuredContent: ContractSupportOutput;
} {
  const input = ContractSupportInput.parse(rawArgs);

  const cityKey = `名古屋市${input.ward}`;
  const landPrices = getLandPricesForCity(cityKey, 'aichi');
  const avgPricePerSqm =
    landPrices.length > 0
      ? Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length)
      : 250_000;

  const pop = getPopulationForCity(cityKey, 'aichi');
  const timeline = getFutureTimeline(input.ward, input.chochou);
  const plans = getPlansForChochou(input.ward, input.chochou);

  // Basic risk matrix derived from existing data
  const riskMatrix = [
    {
      clause: '洪水保険加入義務',
      riskLevel:
        landPrices.some((p) => p.land_use.includes('浸水')) || false ? 'high' : ('medium' as const),
      reason: '名古屋市中区・中村区の一部で洪水リスクあり',
      mitigation: '売主負担で洪水保険加入を特約化、または価格交渉で保険料相当を値引き',
    },
    {
      clause: '将来計画による価格上昇条項',
      riskLevel: timeline.summary.avgPriceImpactPct > 10 ? 'low' : ('medium' as const),
      reason: `${timeline.summary.bestYear}年に最大 ${timeline.summary.bestYearImpact}% の上昇見込み`,
      mitigation: '価格上昇条項（エスクロー）または買戻しオプションを検討',
    },
    {
      clause: 'リノベ費用超過リスク',
      riskLevel: input.buildingAge > 30 ? 'high' : ('medium' as const),
      reason: `築${input.buildingAge}年でリノベ費用中央値 ${((input.floorArea * 130000) / 10000).toFixed(0)} 万円`,
      mitigation: '上限金額条項 + 超過分売主負担特約',
    },
  ];

  // Negotiation anchors
  const negotiationAnchors = [
    {
      topic: '現時点の成約価格水準',
      currentPriceImpact: `${avgPricePerSqm.toLocaleString()} 円/㎡`,
      futureUplift: `${timeline.summary.avgPriceImpactPct > 0 ? '+' : ''}${timeline.summary.avgPriceImpactPct}%`,
      recommendation:
        timeline.summary.avgPriceImpactPct > 8
          ? '今すぐ契約推奨（上昇局面）'
          : '様子見または価格交渉余地あり',
    },
    {
      topic: '進行中計画の影響',
      currentPriceImpact: plans.length > 0 ? `${plans.length} 件の再開発` : 'なし',
      futureUplift: plans.length > 0 ? '+15〜25%' : '—',
      recommendation:
        plans.length > 0 ? `${plans[0].project} の恩恵を価格に反映` : '将来計画なしのため慎重に',
    },
  ];

  // Recommended clauses
  const recommendedClauses = [
    {
      clause: '融資特約（7日以内）',
      rationale: '銀行審査期間を考慮し、7日以内の解除権を確保',
      priority: 'must' as const,
    },
    {
      clause: '建物状況調査（インスペクション）',
      rationale: '築年数が高いため、構造・雨漏り・設備の第三者調査を必須化',
      priority: input.buildingAge > 25 ? ('must' as const) : ('recommended' as const),
    },
    {
      clause: '価格上昇条項（エスクロー）',
      rationale: 'リニア開業等の将来価値を売主と共有',
      priority:
        timeline.summary.avgPriceImpactPct > 10 ? ('recommended' as const) : ('optional' as const),
    },
    {
      clause: 'リノベ費用超過上限',
      rationale: 'リノベ費用が想定の 120% を超えた場合の価格調整',
      priority: input.buildingAge > 30 ? ('must' as const) : ('recommended' as const),
    },
  ];

  const summary =
    `名古屋市${input.ward}${input.chochou ? ' ' + input.chochou : ''} の売買契約支援レポートです。` +
    `成約相場 ${avgPricePerSqm.toLocaleString()} 円/㎡、将来上昇期待 ${timeline.summary.avgPriceImpactPct}%、` +
    `推奨特約 ${recommendedClauses.length} 件。`;

  const markdown = [
    `# 売買契約支援パッケージ`,
    `**対象**: 名古屋市${input.ward}${input.chochou ? ' ' + input.chochou : ''}`,
    `**価格**: ${(input.price / 10000).toFixed(0)} 万円 / ${input.floorArea}㎡`,
    '',
    '## リスクマトリックス',
    ...riskMatrix.map(
      (r) => `- **${r.clause}** (${r.riskLevel})\n  - 理由: ${r.reason}\n  - 対策: ${r.mitigation}`,
    ),
    '',
    '## 価格交渉アンカー',
    ...negotiationAnchors.map(
      (a) =>
        `- ${a.topic}\n  - 現在: ${a.currentPriceImpact}\n  - 将来: ${a.futureUplift}\n  - 判断: ${a.recommendation}`,
    ),
    '',
    '## 推奨特約',
    ...recommendedClauses.map(
      (c) => `- **[${c.priority.toUpperCase()}] ${c.clause}**\n  - ${c.rationale}`,
    ),
    '',
    '---',
    '> 本レポートは既存公開データに基づく参考値です。最終判断は専門家にご相談ください。',
  ].join('\n');

  return {
    content: [{ type: 'text' as const, text: markdown }],
    structuredContent: {
      summary,
      riskMatrix: riskMatrix as any,
      negotiationAnchors,
      recommendedClauses: recommendedClauses as any,
      markdown,
    },
  };
}
