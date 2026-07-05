import type { WidgetConfig } from '../types';

export const leveragedCashflowWidget: WidgetConfig = {
  toolName: 'simulate_leveraged_cashflow',
  title: 'レバレッジキャッシュフロー分析',
  icon: '💰',
  summaryPath: 'summary',
  kpis: [
    { label: '自己資金', path: 'summaryKpis.initialEquity', format: 'currency-jpy' },
    { label: 'LTV', path: 'summaryKpis.ltvPct', format: 'percent' },
    { label: '1年目DSCR', path: 'summaryKpis.year1Dscr', format: 'number' },
    { label: '1年目CoC利回り', path: 'summaryKpis.year1CashOnCashPct', format: 'percent', tone: 'good-high' },
    { label: '10年IRR', path: 'summaryKpis.tenYearIrrPct', format: 'percent', tone: 'good-high' },
    { label: 'エクイティ倍率', path: 'summaryKpis.equityMultiple', format: 'number', tone: 'good-high' },
  ],
};
