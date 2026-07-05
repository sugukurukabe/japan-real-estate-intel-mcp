import { formatValue, getByPath, type WidgetConfig } from './types';

function toneClass(tone: WidgetConfig['kpis'][number]['tone'], value: unknown): string {
  if (tone === 'neutral' || tone === undefined || typeof value !== 'number') return '';
  if (tone === 'good-high') return value >= 70 ? 'tone-good' : value >= 40 ? 'tone-mid' : 'tone-bad';
  return value <= 30 ? 'tone-good' : value <= 60 ? 'tone-mid' : 'tone-bad';
}

/**
 * ツール結果を`WidgetConfig`宣言に基づいて汎用的に描画するコンポーネント。
 * 個別ツールごとにチャートコンポーネントを書く代わりに、宣言的な設定
 * (KPIフィールド・リストフィールド)だけで見栄えの良いカードUIを生成する。
 *
 * Generic renderer that draws a tool result according to its `WidgetConfig`
 * declaration. Instead of hand-writing a bespoke chart component per tool,
 * a declarative config (KPI fields, list fields) produces a polished card UI.
 *
 * Perender generik yang menggambar hasil tool berdasarkan deklarasi
 * `WidgetConfig`. Alih-alih menulis komponen chart khusus per tool,
 * konfigurasi deklaratif (field KPI, field daftar) menghasilkan UI kartu.
 */
export function AutoWidget({ config, data }: { config: WidgetConfig; data: Record<string, unknown> }) {
  const summary = config.summaryPath ? (getByPath(data, config.summaryPath) as string | undefined) : undefined;
  const badge = config.badgePath ? (getByPath(data, config.badgePath) as string | undefined) : undefined;

  return (
    <div className="rei-widget">
      <div className="rei-widget-header">
        <span className="rei-widget-icon">{config.icon}</span>
        <h3>{config.title}</h3>
        {badge && <span className="rei-widget-badge">{badge}</span>}
      </div>

      {summary && <p className="rei-widget-summary">{summary}</p>}

      {config.kpis.length > 0 && (
        <div className="rei-widget-kpis">
          {config.kpis.map((kpi) => {
            const value = getByPath(data, kpi.path);
            return (
              <div className="rei-widget-kpi" key={kpi.path}>
                <span className="rei-widget-kpi-label">{kpi.label}</span>
                <span className={`rei-widget-kpi-value ${toneClass(kpi.tone, value)}`}>
                  {formatValue(value, kpi.format)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {config.lists?.map((list) => {
        const raw = getByPath(data, list.path);
        if (!Array.isArray(raw) || raw.length === 0) return null;
        const items = list.limit ? raw.slice(0, list.limit) : raw;
        return (
          <div className="rei-widget-list" key={list.path}>
            <span className="rei-widget-list-label">{list.label}</span>
            <ul>
              {items.map((item, i) => (
                <li key={i}>{list.itemFormatter ? list.itemFormatter(item) : String(item)}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
