import type { WidgetConfig } from '../types';

export const arbitrageSignalsWidget: WidgetConfig = {
  toolName: 'detect_arbitrage_signals',
  title: '価格アービトラージ検出',
  icon: '💹',
  kpis: [
    { label: 'スキャン都市数', path: 'scannedCities', format: 'number' },
    { label: '検出シグナル数', path: 'items.length', format: 'number' },
  ],
  lists: [
    { label: '検出シグナル', path: 'items', itemFormatter: (item) => {
      const s = item as { city?: string; signal?: string; interpretation?: string };
      return `${s.city ?? ''} [${s.signal ?? ''}] ${s.interpretation ?? ''}`;
    }, limit: 8 },
  ],
};
