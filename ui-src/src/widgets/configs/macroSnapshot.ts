import type { WidgetConfig } from '../types';

export const macroSnapshotWidget: WidgetConfig = {
  toolName: 'get_real_estate_macro_snapshot',
  title: '不動産マクロスナップショット',
  icon: '📊',
  summaryPath: 'summary',
  kpis: [
    { label: '短期金利(政策金利プロキシ)', path: 'policyRate.latestRatePct', format: 'percent' },
  ],
  lists: [
    { label: '注意点', path: 'externalWarnings', limit: 5 },
  ],
};
