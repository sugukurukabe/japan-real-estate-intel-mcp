import type { WidgetConfig } from '../types';

export const demographicShiftWidget: WidgetConfig = {
  toolName: 'forecast_demographic_shift',
  title: '将来人口動態予測',
  icon: '👥',
  badgePath: 'growthCategoryJa',
  summaryPath: 'forecastSummaryJa',
  kpis: [
    { label: '10年人口増減率', path: 'tenYearPopulationChangeRate', format: 'percent', tone: 'good-high' },
    { label: '10年人流増減率', path: 'tenYearPedestrianFlowChangeRate', format: 'percent', tone: 'good-high' },
  ],
};
