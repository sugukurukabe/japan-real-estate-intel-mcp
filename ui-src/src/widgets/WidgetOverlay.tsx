import { useRef, useState } from 'react';
import type { App } from '@modelcontextprotocol/ext-apps';
import type { ActiveTool } from '../app/AppShell';
import { getWidgetConfig } from './registry';
import { AutoWidget } from './AutoWidget';
import { exportWidgetCsv, exportWidgetPng } from './export';
import './widgets.css';

type ExportStatus = 'idle' | 'busy' | 'error';

export function WidgetOverlay({
  tool,
  app,
  onDismiss,
}: {
  tool: ActiveTool;
  app: App | null | undefined;
  onDismiss: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const cardRef = useRef<HTMLDivElement>(null);
  const config = getWidgetConfig(tool.name);

  if (!config || !tool.result) return null;

  async function handleExport(kind: 'csv' | 'png') {
    if (exportStatus === 'busy') return;
    setExportStatus('busy');
    try {
      if (kind === 'csv') {
        await exportWidgetCsv(app, config!, tool.result!);
      } else if (cardRef.current) {
        const surface = getComputedStyle(document.documentElement)
          .getPropertyValue('--surface')
          .trim();
        await exportWidgetPng(app, cardRef.current, config!.toolName, surface || '#171d2b');
      }
      setExportStatus('idle');
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  }

  return (
    <div className={`rei-widget-overlay${collapsed ? ' collapsed' : ''}`}>
      <div className="rei-widget-overlay-controls">
        <button
          onClick={() => handleExport('csv')}
          disabled={exportStatus === 'busy'}
          title="CSVでダウンロード"
        >
          {exportStatus === 'error' ? '⚠️' : '⬇️ CSV'}
        </button>
        <button
          onClick={() => handleExport('png')}
          disabled={exportStatus === 'busy'}
          title="画像(PNG)でダウンロード"
        >
          🖼️ PNG
        </button>
        <button onClick={() => setCollapsed((c) => !c)} title={collapsed ? '展開' : '折りたたむ'}>
          {collapsed ? '▲' : '▼'}
        </button>
        <button onClick={onDismiss} title="閉じる">
          ✕
        </button>
      </div>
      {!collapsed && (
        <div ref={cardRef}>
          <AutoWidget config={config} data={tool.result} />
        </div>
      )}
    </div>
  );
}
