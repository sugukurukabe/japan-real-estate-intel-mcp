import type { WidgetConfig } from '../types';

export const discoverOpportunitiesWidget: WidgetConfig = {
  toolName: 'discover_opportunities',
  title: '投資機会レーダー',
  icon: '🎯',
  summaryPath: 'summary',
  kpis: [
    { label: '検出候補数', path: 'cards.length', format: 'number' },
    { label: '調査都市数', path: 'dataCoverage.citiesScanned', format: 'number' },
  ],
  lists: [
    { label: '候補エリア', path: 'cards', itemFormatter: (item) => {
      const c = item as { title?: string; city?: string; score?: number };
      return `${c.title ?? c.city ?? ''} — スコア ${c.score ?? '—'}`;
    }, limit: 6 },
    { label: '次のアクション', path: 'nextActions', limit: 5 },
  ],
};
