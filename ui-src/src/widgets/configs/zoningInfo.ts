import type { WidgetConfig } from '../types';

export const zoningInfoWidget: WidgetConfig = {
  toolName: 'get_zoning_info',
  title: '用途地域情報',
  icon: '🏙️',
  summaryPath: 'summary',
  kpis: [
    { label: '対象地区数', path: 'records.length', format: 'number' },
  ],
  lists: [
    { label: '地区別用途地域', path: 'records', itemFormatter: (item) => {
      const r = item as { city?: string; district?: string; zone_type?: string; coverage_ratio?: number; floor_area_ratio?: number };
      return `${r.city ?? ''} ${r.district ?? ''} — ${r.zone_type ?? ''} (建蔽率${r.coverage_ratio ?? '—'}% / 容積率${r.floor_area_ratio ?? '—'}%)`;
    }, limit: 8 },
  ],
};
