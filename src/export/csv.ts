/**
 * Minimal CSV export utilities (RFC 4180 quoting) for tabular tool results
 * that don't warrant a full XLSX workbook (see src/export/excel.ts for those).
 */
import type { PortfolioOptimizerOutput } from '../schemas.js';

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  // Leading BOM so Excel opens the Japanese headers as UTF-8 rather than
  // mangling them via a Shift-JIS guess.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/** Convert portfolio_optimizer's per-asset allocation table to CSV. */
export function portfolioOptimizerToCsv(result: PortfolioOptimizerOutput): string {
  const headers = [
    '都道府県',
    '市区町村',
    '物件種別',
    '予算(万円)',
    '配分(%)',
    '期待年率リターン(%)',
    'リスクスコア',
    '流動性スコア',
    '現在の㎡単価(円)',
    '強み',
    '弱み',
    '推奨',
  ];
  const rows = result.assets.map((a) => [
    a.prefecture,
    a.city,
    a.propertyType,
    a.budgetManYen,
    a.allocationPct,
    a.expectedAnnualReturnPct,
    a.riskScore,
    a.liquidityScore,
    a.currentPricePerSqm ?? '-',
    a.strengthSummary,
    a.weaknessSummary,
    a.recommendation,
  ]);
  return toCsv(headers, rows);
}
