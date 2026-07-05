import { useEffect, useRef, useState } from 'react';
import { PlateauScene, type BuildingRecord, type PlateauStats, type SunPresetKey } from '../core/plateau-scene';
import '../styles/plateau.css';

const USE_LABELS: Record<string, string> = { office: 'オフィス', commercial: '商業', residential: '住居' };
const SHADOW_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };
const TIME_BUTTONS: { key: SunPresetKey; label: string }[] = [
  { key: 'morning', label: '朝 8:00' },
  { key: 'noon', label: '正午 12:00' },
  { key: 'evening', label: '夕方 17:00' },
];

/**
 * PLATEAU 3Dビュー(統合ダッシュボード内のビュー)。
 * PLATEAU 3D view, now embedded as a view inside the unified dashboard app
 * (formerly a standalone `dashboard-3d.html` page/MCP resource).
 * Tampilan PLATEAU 3D, kini menjadi view di dalam aplikasi dashboard terpadu.
 */
export function PlateauView({ hidden, onExit }: { hidden: boolean; onExit: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlateauScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<SunPresetKey>('noon');
  const [stats, setStats] = useState<PlateauStats | null>(null);
  const [selected, setSelected] = useState<BuildingRecord | null>(null);
  const [hover, setHover] = useState<{ building: BuildingRecord; x: number; y: number } | null>(null);

  useEffect(() => {
    if (hidden || !containerRef.current || sceneRef.current) return;
    const scene = new PlateauScene(containerRef.current, {
      onLoaded: () => setLoading(false),
      onStatsUpdate: setStats,
      onBuildingSelect: setSelected,
      onHover: (building, x, y) => setHover(building ? { building, x, y } : null),
    });
    scene.init();
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div id="plateau-view" ref={containerRef}>
      <div id="overlay">
        <div id="title-bar">
          <h1>PLATEAU 3D ビューア</h1>
          <span className="subtitle">名古屋駅周辺 — 建物影シミュレーション</span>
          <button id="back-link" onClick={onExit}>← 2D ダッシュボードへ</button>
        </div>

        <div id="time-controls">
          <label>影シミュレーション</label>
          {TIME_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              className={`time-btn${preset === btn.key ? ' active' : ''}`}
              onClick={() => {
                setPreset(btn.key);
                sceneRef.current?.setTimePreset(btn.key);
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div id="legend">
          <div className="legend-title">用途別カラー</div>
          <div className="legend-item"><div className="legend-swatch" style={{ background: '#6366f1' }} />オフィス</div>
          <div className="legend-item"><div className="legend-swatch" style={{ background: '#f59e0b' }} />商業</div>
          <div className="legend-item"><div className="legend-swatch" style={{ background: '#10b981' }} />住居</div>
          <div className="legend-item"><div className="legend-swatch" style={{ background: '#94a3b8' }} />その他</div>
        </div>

        {selected && (
          <div id="info-panel" style={{ display: 'block' }}>
            <div className="info-title">{selected.name}</div>
            <div id="info-body">
              <div className="info-row"><span>用途</span><span className={`use-badge use-${selected.use}`}>{USE_LABELS[selected.use] ?? selected.use}</span></div>
              <div className="info-row"><span>高さ</span><span>{selected.height}m</span></div>
              <div className="info-row"><span>階数</span><span>{selected.floors}F</span></div>
              <div className="info-row"><span>地区</span><span>{selected.city} {selected.district}</span></div>
              <div className="info-row"><span>竣工年</span><span>{selected.built}年</span></div>
              <div className="info-row">
                <span>影響度</span>
                <span style={{ color: selected.shadow === 'high' ? 'var(--danger)' : selected.shadow === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                  {SHADOW_LABELS[selected.shadow]}
                </span>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div id="stats-panel">
            <div className="stat-title">統計</div>
            <div className="stat-row"><span>建物数</span><span className="stat-val">{stats.count}棟</span></div>
            <div className="stat-row"><span>最高高度</span><span className="stat-val">{stats.maxHeight}m</span></div>
            <div className="stat-row"><span>平均高度</span><span className="stat-val">{stats.avgHeight}m</span></div>
            <div className="stat-row"><span>影響度</span><span className="stat-val">高影響 {stats.highShadowCount}棟 / 平均影長 {stats.avgShadowLength}m</span></div>
          </div>
        )}

        {loading && <div id="loading">読み込み中…</div>}
      </div>

      {hover && (
        <div id="tooltip" style={{ display: 'block', left: hover.x + 14, top: hover.y - 10 }}>
          {hover.building.name} ({hover.building.height}m / {hover.building.floors}F)
        </div>
      )}
    </div>
  );
}
