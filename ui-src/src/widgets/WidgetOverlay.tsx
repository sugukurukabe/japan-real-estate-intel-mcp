import { useState } from 'react';
import type { ActiveTool } from '../app/AppShell';
import { getWidgetConfig } from './registry';
import { AutoWidget } from './AutoWidget';
import './widgets.css';

export function WidgetOverlay({ tool, onDismiss }: { tool: ActiveTool; onDismiss: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const config = getWidgetConfig(tool.name);

  if (!config || !tool.result) return null;

  return (
    <div className={`rei-widget-overlay${collapsed ? ' collapsed' : ''}`}>
      <div className="rei-widget-overlay-controls">
        <button onClick={() => setCollapsed((c) => !c)} title={collapsed ? '展開' : '折りたたむ'}>
          {collapsed ? '▲' : '▼'}
        </button>
        <button
          onClick={() => {
            onDismiss();
          }}
          title="閉じる"
        >
          ✕
        </button>
      </div>
      {!collapsed && <AutoWidget config={config} data={tool.result} />}
    </div>
  );
}
