import { type RenovationYieldInput, RenovationYieldInput as Schema } from '../schemas.js';
import { calculateRenovationYield } from '../analysis/renovation_yield.js';

export function analyzeRenovationYieldTool(rawArgs: Record<string, unknown>) {
  const input = Schema.parse(rawArgs);
  const result = calculateRenovationYield({
    ward: input.ward,
    chochou: input.chochou,
    buildingAge: input.buildingAge,
    floorArea: input.floorArea,
    acquisitionPrice: input.acquisitionPrice,
    propertyType: input.propertyType,
  });

  const md = [
    `# リノベ利回り分析: ${result.ward} ${result.chochou}`,
    '',
    `## 投資概要`,
    `| 項目 | 金額 |`,
    `|---|---|`,
    `| 取得価格（推定） | ${(result.estimatedAcquisition / 10000).toFixed(0)} 万円 |`,
    `| リノベ費用（中） | ${(result.renovationCost.mid / 10000).toFixed(0)} 万円 |`,
    `| **総投資額** | **${(result.totalInvestment.mid / 10000).toFixed(0)} 万円** |`,
    '',
    `## 収益性`,
    `| 指標 | 値 |`,
    `|---|---|`,
    `| 月額賃料（推定） | ${result.estimatedRent.monthly.toLocaleString()} 円 |`,
    `| 年間賃料 | ${result.estimatedRent.annual.toLocaleString()} 円 |`,
    `| **表面利回り** | **${result.grossYieldPct}%** |`,
    `| **実質利回り** | **${result.netYieldPct}%** |`,
    `| 推奨戦略 | ${result.exitStrategy === 'rent' ? '賃貸運用' : '転売'} |`,
    `| 信頼度 | ${result.estimatedRent.confidence} |`,
    '',
    `## コスト内訳`,
    `| 経費 | 割合 |`,
    `|---|---|`,
    `| 管理費 | ${result.breakdown.managementFeePct}% |`,
    `| 空室率 | ${result.breakdown.vacancyRatePct}% |`,
    `| 税金 | ${result.breakdown.taxRatePct}% |`,
    '',
    `## リノベ費用レンジ`,
    `- 最小: ${(result.renovationCost.low / 10000).toFixed(0)} 万円`,
    `- 中央: ${(result.renovationCost.mid / 10000).toFixed(0)} 万円`,
    `- 最大: ${(result.renovationCost.high / 10000).toFixed(0)} 万円`,
  ];

  if (result.whatIfBoost.futureProjectName) {
    md.push(
      '',
      `## 未来計画効果`,
      `**${result.whatIfBoost.futureProjectName}** を考慮した場合の表面利回り: **${result.whatIfBoost.withFutureProject}%**`,
    );
  }

  return {
    content: [{ type: 'text' as const, text: md.join('\n') }],
    structuredContent: result,
  };
}
