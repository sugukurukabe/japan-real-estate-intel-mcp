import type { WidgetConfig } from '../types';

export const vacancyStatsWidget: WidgetConfig = {
  toolName: 'get_vacancy_stats',
  title: '空き家率統計',
  icon: '🏚️',
  summaryPath: 'summary',
  kpis: [
    { label: '都道府県平均', path: 'prefectureAvgRate', format: 'percent', tone: 'good-low' },
    { label: '全国平均', path: 'nationalAvgRate', format: 'percent' },
  ],
  lists: [
    { label: '市区町村別空き家率', path: 'records', itemFormatter: (item) => {
      const r = item as { city?: string; vacancy_rate?: number; total_vacant?: number };
      return `${r.city ?? ''} — ${r.vacancy_rate ?? '—'}% (${r.total_vacant ?? '—'}戸)`;
    }, limit: 8 },
  ],
};
