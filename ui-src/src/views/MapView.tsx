import { useEffect, useRef } from 'react';
import { initDashboardCore } from '../core/dashboard-core';

/**
 * 2Dダッシュボード(Leaflet)を描画するビュー。
 * 既存の命令的ロジック(dashboard-core.ts、旧main.ts)をReactコンポーネント内で
 * 一度だけ初期化する「imperative core + Reactシェル」構成。
 *
 * Renders the 2D dashboard (Leaflet). Initializes the existing imperative
 * logic (dashboard-core.ts, formerly main.ts) once inside a React component —
 * an "imperative core + React shell" architecture.
 *
 * Merender dashboard 2D (Leaflet). Menginisialisasi logika imperatif yang
 * sudah ada (dashboard-core.ts, dulunya main.ts) satu kali di dalam komponen
 * React — arsitektur "inti imperatif + shell React".
 */
export function MapView({ hidden, onSwitchTo3d }: { hidden: boolean; onSwitchTo3d: () => void }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initDashboardCore();
  }, []);

  return (
    <div id="app" style={hidden ? { display: 'none' } : undefined}>
      <header id="header">
        <h1>日本不動産インテリジェンス</h1>
        <span className="subtitle">地価・取引・災害リスク クロス分析ダッシュボード</span>
        <div id="offline-indicator" className="offline-indicator" style={{ display: 'none' }}>
          <span className="offline-dot" />
          <span className="offline-text">現地オフラインモード</span>
        </div>
        <div className="header-right-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button id="btn-switch-3d" className="mode-toggle-btn" onClick={onSwitchTo3d} title="PLATEAU 3Dビューに切替">
            🏙️ 3Dビュー
          </button>
          <span id="header-tier-indicator" className="header-tier-tag free-tag">FREE プラン</span>
          <button id="btn-header-upgrade" className="header-upgrade-btn">⚡ Proにアップグレード</button>
        </div>
      </header>
      <div id="main">
        <div id="mobile-backdrop" />
        <aside id="search-panel" />
        <div id="map-wrapper">
          <button id="mobile-filter-toggle" className="mobile-toggle-btn">🔍 フィルター</button>
          <button id="mobile-insight-toggle" className="mobile-toggle-btn">📊 インサイト</button>
          <div id="map-container" />
        </div>
        <aside id="insight-panel" />
      </div>
    </div>
  );
}
