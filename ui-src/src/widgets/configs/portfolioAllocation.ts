import type { WidgetConfig } from '../types';

export const portfolioAllocationWidget: WidgetConfig = {
  toolName: 'optimize_portfolio_allocation',
  title: 'ポートフォリオ最適化',
  icon: '📈',
  summaryPath: 'optimizationStrategyJa',
  kpis: [
    { label: '総資産', path: 'totalAssetsJpy', format: 'currency-jpy' },
    { label: '平均利回り', path: 'overallYield', format: 'percent', tone: 'good-high' },
    { label: 'リスクスコア', path: 'portfolioRiskScore', format: 'score', tone: 'good-low' },
    { label: '分散度スコア', path: 'diversificationScore', format: 'score', tone: 'good-high' },
  ],
  lists: [
    { label: '物件別評価', path: 'items', itemFormatter: (item) => {
      const p = item as { name?: string; currentYield?: number; actionRecommendation?: string };
      return `${p.name ?? ''} — 利回り${p.currentYield ?? '—'}% / ${p.actionRecommendation ?? ''}`;
    }, limit: 6 },
  ],
};
