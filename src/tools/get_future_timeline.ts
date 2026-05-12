import { FutureTimelineInput } from '../schemas.js';
import { getFutureTimeline } from '../analysis/future_timeline.js';

export function getFutureTimelineTool(rawArgs: Record<string, unknown>) {
  const input = FutureTimelineInput.parse(rawArgs);
  const result = getFutureTimeline(input.ward, input.chochou);

  const md = [
    `# 未来タイムライン: ${result.ward} ${result.chochou || '(区全体)'}`,
    '',
    `| 年 | プロジェクト | 種別 | 価格影響 | 需要影響 |`,
    `|---|---|---|---|---|`,
  ];

  for (const e of result.events) {
    md.push(
      `| ${e.year} | ${e.project} | ${e.type} | ${e.expectedImpact.priceChangePct > 0 ? '+' : ''}${e.expectedImpact.priceChangePct}% | ${e.expectedImpact.demandChangePct > 0 ? '+' : ''}${e.expectedImpact.demandChangePct}% |`,
    );
  }

  md.push(
    '',
    `## サマリー`,
    `- 総イベント数: ${result.summary.totalEvents}`,
    `- 平均価格影響: ${result.summary.avgPriceImpactPct > 0 ? '+' : ''}${result.summary.avgPriceImpactPct}%`,
    `- ベスト年: ${result.summary.bestYear} (${result.summary.bestYearImpact > 0 ? '+' : ''}${result.summary.bestYearImpact}%)`,
  );

  return {
    content: [{ type: 'text' as const, text: md.join('\n') }],
    structuredContent: result,
  };
}
