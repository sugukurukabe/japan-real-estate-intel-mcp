/**
 * Excel export utilities using the xlsx library.
 * Converts compare_prefectures and drill_down results to Excel workbooks
 * and returns them as Base64-encoded strings.
 */
import * as XLSX from 'xlsx';
import type { ComparePrefecturesOutput } from '../schemas.js';
import type { DrillDownOutput } from '../schemas.js';

/** Convert compare_prefectures output to a Base64-encoded xlsx string. */
export function comparePrefecturesToXlsxBase64(result: ComparePrefecturesOutput): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ranking summary
  const rankingRows = result.ranking.map((r) => ({
    順位: r.rank,
    都道府県: r.prefecture,
    投資スコア: r.score,
  }));
  const wsRanking = XLSX.utils.json_to_sheet(rankingRows);
  XLSX.utils.book_append_sheet(wb, wsRanking, 'ランキング');

  // Sheet 2: Detailed metrics per prefecture
  const metricsRows = result.scores.map((s) => ({
    都道府県: s.prefecture,
    エリア: s.area,
    '地価（万円/㎡）': s.metrics.price ?? '-',
    '地価変化率（%）': s.metrics.priceChangeRate ?? '-',
    リスクスコア: s.metrics.riskScore ?? '-',
    人流スコア: s.metrics.humanFlowScore ?? '-',
    教育スコア: s.metrics.educationScore ?? '-',
    企業スコア: s.metrics.corporateScore ?? '-',
    交通スコア: s.metrics.transportScore ?? '-',
    商業スコア: s.metrics.commercialScore ?? '-',
    医療スコア: s.metrics.medicalScore ?? '-',
    総合投資スコア: s.metrics.investmentScore,
  }));
  const wsMetrics = XLSX.utils.json_to_sheet(metricsRows);
  XLSX.utils.book_append_sheet(wb, wsMetrics, '詳細指標');

  // Sheet 3: Diff highlights
  if (result.diffs.length > 0) {
    const diffRows = result.diffs.map((d) => ({
      指標: d.metric,
      基準: d.base,
      比較: d.target,
      差分: d.delta,
      方向: d.direction,
    }));
    const wsDiff = XLSX.utils.json_to_sheet(diffRows);
    XLSX.utils.book_append_sheet(wb, wsDiff, '差分ハイライト');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buf.toString('base64');
}

/** Convert drill_down output to a Base64-encoded xlsx string. */
export function drillDownToXlsxBase64(result: DrillDownOutput): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = [
    { 項目: '都道府県', 値: result.scope.prefecture },
    { 項目: '市区町村', 値: result.scope.city },
    { 項目: '町丁目', 値: result.scope.neighborhood ?? '-' },
    { 項目: '分析粒度', 値: result.granularity },
    { 項目: '地価（万円/㎡）', 値: result.pricePerSqm ?? '-' },
    { 項目: '地価変化率（%）', 値: result.priceChangeRate ?? '-' },
    { 項目: 'リスクスコア', 値: result.riskScore ?? '-' },
    { 項目: '浸水リスク', 値: result.floodLevel ?? '-' },
    { 項目: '人流スコア', 値: result.humanFlowScore ?? '-' },
    { 項目: '交通スコア', 値: result.transportScore ?? '-' },
    { 項目: '商業施設密度', 値: result.commercialDensity ?? '-' },
    { 項目: '医療施設密度', 値: result.medicalDensity ?? '-' },
    { 項目: '競合密度', 値: result.competitorDensity },
  ];
  if (result.population) {
    summaryRows.push(
      { 項目: '総人口', 値: String(result.population.total) },
      { 項目: '世帯数', 値: String(result.population.households) },
      { 項目: '高齢化率（%）', 値: String(result.population.aging) },
    );
  }
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'サマリー');

  // Sheet 2: Key insights
  const insightRows = result.keyInsights.map((insight, i) => ({
    '#': i + 1,
    インサイト: insight,
  }));
  const wsInsights = XLSX.utils.json_to_sheet(insightRows);
  XLSX.utils.book_append_sheet(wb, wsInsights, 'キーインサイト');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buf.toString('base64');
}
