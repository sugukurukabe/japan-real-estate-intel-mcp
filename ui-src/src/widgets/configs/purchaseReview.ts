import type { WidgetConfig } from '../types';

export const purchaseReviewWidget: WidgetConfig = {
  toolName: 'review_purchase_recommendation',
  title: '購入判断レビュー',
  icon: '⚖️',
  badgePath: 'decisionLabel',
  kpis: [
    { label: '総合スコア', path: 'overallScore', format: 'score', tone: 'good-high' },
    { label: '価格スコア', path: 'priceScore', format: 'score', tone: 'good-high' },
    { label: '利回りスコア', path: 'yieldScore', format: 'score', tone: 'good-high' },
    { label: 'リスクスコア', path: 'riskScore', format: 'score', tone: 'good-low' },
    { label: '表面利回り', path: 'keyNumbers.grossYield', format: 'percent' },
    { label: '回収年数', path: 'keyNumbers.paybackYears', format: 'number' },
  ],
  lists: [
    { label: 'レッドフラグ', path: 'redFlags', limit: 5 },
    { label: '交渉ポイント', path: 'negotiationPoints', limit: 5 },
  ],
};
