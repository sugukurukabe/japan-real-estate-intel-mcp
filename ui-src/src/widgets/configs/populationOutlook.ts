import type { WidgetConfig } from '../types';

export const populationOutlookWidget: WidgetConfig = {
  toolName: 'get_population_outlook',
  title: '将来人口推計',
  icon: '📉',
  summaryPath: 'summary',
  kpis: [
    { label: '都道府県平均減少率(2050)', path: 'prefectureAvgDecline', format: 'percent', tone: 'good-low' },
  ],
  lists: [
    { label: '市区町村別推計', path: 'records', itemFormatter: (item) => {
      const r = item as { city?: string; pop_2050?: number; decline_rate_2050?: number };
      return `${r.city ?? ''} — 2050年 ${r.pop_2050?.toLocaleString('ja-JP') ?? '—'}人 (減少率 ${r.decline_rate_2050 ?? '—'}%)`;
    }, limit: 8 },
  ],
};
