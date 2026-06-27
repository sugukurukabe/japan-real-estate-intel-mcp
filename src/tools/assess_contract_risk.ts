import { AssessContractRiskInput, AssessContractRiskOutput } from '../schemas.js';
import { getFutureTimeline } from '../analysis/future_timeline.js';
import { getLandPricesForCity } from '../data/loader.js';

export function assessContractRiskTool(rawArgs: Record<string, unknown>): {
  content: { type: 'text'; text: string }[];
  structuredContent: AssessContractRiskOutput;
} {
  const input = AssessContractRiskInput.parse(rawArgs);

  const cityKey = `名古屋市${input.ward}`;
  const landPrices = getLandPricesForCity(cityKey, 'aichi');
  const avgPrice =
    landPrices.length > 0
      ? Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length)
      : 250_000;

  const timeline = getFutureTimeline(input.ward, input.chochou);

  const terms = input.proposedTerms as Record<string, unknown>;

  const clauseRisks: AssessContractRiskOutput['clauseRisks'] = [];

  // Financing contingency
  const financingDays = Number(terms.financingDays ?? 14);
  const financingRisk = financingDays > 10 ? 'medium' : financingDays > 7 ? 'low' : 'high';
  clauseRisks.push({
    clause: '融資特約期間',
    riskScore: financingDays > 10 ? 45 : financingDays > 7 ? 25 : 70,
    level: financingRisk,
    explanation: `融資特約が${financingDays}日。銀行審査平均は7〜10日。`,
    suggestedFix: financingDays > 10 ? '7日以内に短縮を推奨' : undefined,
  });

  // Inspection clause
  const hasInspection = Boolean(terms.buildingInspection ?? false);
  clauseRisks.push({
    clause: '建物状況調査',
    riskScore: hasInspection ? 20 : 65,
    level: hasInspection ? 'low' : 'high',
    explanation: hasInspection
      ? '第三者インスペクション実施済み'
      : '築年数が高いため検査未実施はリスク大',
    suggestedFix: hasInspection ? undefined : '売主負担でのインスペクションを必須化',
  });

  // Price escalation / future uplift
  const uplift = timeline.summary.avgPriceImpactPct;
  clauseRisks.push({
    clause: '将来価値条項',
    riskScore: uplift > 15 ? 15 : uplift > 8 ? 35 : 55,
    level: uplift > 15 ? 'low' : uplift > 8 ? 'medium' : 'high',
    explanation: `エリア平均上昇期待 ${uplift}%`,
    suggestedFix: uplift < 8 ? '価格上昇条項（エスクロー）の追加を検討' : undefined,
  });

  // Overall score (weighted average)
  const overall = Math.round(
    clauseRisks.reduce((sum, c) => sum + c.riskScore, 0) / clauseRisks.length,
  );

  const dealBreakers = clauseRisks.filter((c) => c.level === 'high').map((c) => c.clause);

  const summary =
    `全体リスクスコア ${overall} / 100。` +
    (dealBreakers.length > 0
      ? ` ディールブレーカー: ${dealBreakers.join(', ')}`
      : ' 重大リスクなし。');

  const markdown = [
    `# 契約リスク評価`,
    `**対象**: 名古屋市${input.ward}${input.chochou ? ' ' + input.chochou : ''}`,
    `**全体スコア**: ${overall}`,
    '',
    ...clauseRisks.map(
      (c) =>
        `- **${c.clause}** (${c.level})\n  - スコア: ${c.riskScore}\n  - ${c.explanation}` +
        (c.suggestedFix ? `\n  - 推奨: ${c.suggestedFix}` : ''),
    ),
    '',
    dealBreakers.length > 0 ? `> ⚠️ ディールブレーカー: ${dealBreakers.join(', ')}` : '',
  ].join('\n');

  return {
    content: [{ type: 'text' as const, text: markdown }],
    structuredContent: {
      overallRiskScore: overall,
      clauseRisks,
      dealBreakerFlags: dealBreakers,
      summary,
    },
  };
}
