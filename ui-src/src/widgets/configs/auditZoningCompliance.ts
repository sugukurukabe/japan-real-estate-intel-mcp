import type { WidgetConfig } from '../types';

export const auditZoningComplianceWidget: WidgetConfig = {
  toolName: 'audit_zoning_compliance',
  title: '用途地域適合監査',
  icon: '📐',
  summaryPath: 'complianceSummaryJa',
  kpis: [
    { label: '用途地域', path: 'zoningType', format: 'text' },
    { label: '計画建蔽率', path: 'proposedCoverageRatio', format: 'percent' },
    { label: '法定上限建蔽率', path: 'legalMaxCoverageRatio', format: 'percent' },
    { label: '計画容積率', path: 'proposedFloorAreaRatio', format: 'percent' },
    { label: '法定上限容積率', path: 'legalMaxFloorAreaRatio', format: 'percent' },
  ],
  lists: [
    { label: '最適化アドバイス', path: 'optimizationTipsJa', limit: 5 },
  ],
};
