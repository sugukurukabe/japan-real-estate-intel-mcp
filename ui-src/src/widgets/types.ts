/**
 * ツール結果ウィジェットの型定義。新しい`registerAppTool`ツールを追加する際は、
 * `configs/`に1ファイル追加して`registry.ts`に登録するだけでよい(拡張性の核)。
 *
 * Type definitions for tool-result widgets. To support a new `registerAppTool`
 * tool, add one file under `configs/` and register it in `registry.ts` — this
 * is the extensibility core of the dashboard.
 *
 * Definisi tipe untuk widget hasil tool. Untuk mendukung tool `registerAppTool`
 * baru, cukup tambahkan satu file di `configs/` dan daftarkan di `registry.ts`.
 */

export type FieldFormat = 'number' | 'percent' | 'currency-jpy' | 'score' | 'text';

export interface KpiField {
  label: string;
  path: string;
  format?: FieldFormat;
  /** スコア/比率系の値に対して色分けする閾値(高いほど良い場合は昇順)。 */
  tone?: 'good-high' | 'good-low' | 'neutral';
}

export interface ListField {
  label: string;
  path: string;
  /** 配列の各要素が文字列でない場合、表示用に整形する。 */
  itemFormatter?: (item: unknown) => string;
  limit?: number;
}

export interface WidgetConfig {
  /** MCPツール名 (server.ts の registerAppTool 第2引数と一致させる)。 */
  toolName: string;
  title: string;
  icon: string;
  /** サマリー文字列を保持するフィールドパス(例: 'summary', 'forecastSummaryJa')。 */
  summaryPath?: string;
  /** バッジとして表示する短いフィールド(例: 'tier', 'decisionLabel')。 */
  badgePath?: string;
  kpis: KpiField[];
  lists?: ListField[];
}

export function getByPath(obj: Record<string, unknown> | null | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function formatValue(value: unknown, format: FieldFormat = 'text'): string {
  if (value === null || value === undefined) return '—';
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('ja-JP') : String(value);
    case 'percent':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : String(value);
    case 'currency-jpy':
      return typeof value === 'number' ? `¥${Math.round(value).toLocaleString('ja-JP')}` : String(value);
    case 'score':
      return typeof value === 'number' ? value.toFixed(0) : String(value);
    default:
      return String(value);
  }
}
