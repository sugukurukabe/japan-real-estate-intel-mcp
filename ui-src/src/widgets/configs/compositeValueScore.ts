import type { WidgetConfig } from '../types';

export const compositeValueScoreWidget: WidgetConfig = {
  toolName: 'composite_value_score',
  title: '総合価値スコア',
  icon: '🏆',
  badgePath: 'tier',
  kpis: [
    { label: '総合スコア', path: 'compositeScore', format: 'score', tone: 'good-high' },
  ],
  lists: [
    { label: '評価軸', path: 'axes', itemFormatter: (item) => {
      const a = item as { label?: string; score?: number; rawValue?: string };
      return `${a.label ?? ''}: ${a.score ?? '—'}点 (${a.rawValue ?? ''})`;
    } },
    { label: '周辺都市比較', path: 'peerComparison', itemFormatter: (item) => {
      const p = item as { city?: string; compositeScore?: number; tier?: string };
      return `${p.city ?? ''} — ${p.compositeScore ?? '—'}点 (${p.tier ?? ''})`;
    }, limit: 5 },
  ],
};
