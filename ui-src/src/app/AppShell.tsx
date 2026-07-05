import { useCallback, useEffect, useState } from 'react';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { installLegacyBridgeShim, setLegacyBridgeConnected } from '../bridge/legacyBridgeShim';
import { mergeToolResult } from '../bridge/toolResult';
import { MapView } from '../views/MapView';
import { PlateauView } from '../views/PlateauView';
import { WidgetOverlay } from '../widgets/WidgetOverlay';

const APP_INFO = { name: 'japan-real-estate-intel', version: '7.0.0' };

export interface ActiveTool {
  name: string | undefined;
  result: Record<string, unknown> | null;
}

/**
 * ダッシュボードのルートコンポーネント。公式MCP Apps SDK(`App`/`useApp`)で
 * ホストと接続し、2D地図(MapView)・3Dビュー(PlateauView)・ツール結果ウィジェット
 * (WidgetOverlay)を切り替えるビュールーターとして機能する。
 *
 * Root component of the dashboard. Connects to the host via the official
 * MCP Apps SDK (`App`/`useApp`) and acts as a view router switching between
 * the 2D map (MapView), the 3D view (PlateauView), and tool-result widgets
 * (WidgetOverlay).
 *
 * Komponen root dashboard. Terhubung ke host melalui MCP Apps SDK resmi
 * (`App`/`useApp`) dan berfungsi sebagai router tampilan yang beralih antara
 * peta 2D (MapView), tampilan 3D (PlateauView), dan widget hasil tool
 * (WidgetOverlay).
 */
export function AppShell() {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [activeTool, setActiveTool] = useState<ActiveTool>({ name: undefined, result: null });

  const handleToolPayload = useCallback((payload: Record<string, unknown> | null) => {
    if (!payload) return;
    if (payload.mode === '3d') setMode('3d');
    window.dispatchEvent(new CustomEvent('mcp-tool-data', { detail: payload }));
  }, []);

  const { app, isConnected } = useApp({
    appInfo: APP_INFO,
    capabilities: {},
    onAppCreated: (createdApp) => {
      installLegacyBridgeShim(createdApp);

      createdApp.ontoolinput = (params) => {
        const args = params.arguments ?? {};
        if (args.mode === '3d') setMode('3d');
        window.dispatchEvent(new CustomEvent('mcp-tool-input', { detail: args }));
      };

      createdApp.ontoolresult = (params) => {
        const toolName = createdApp.getHostContext()?.toolInfo?.tool?.name;
        const merged = mergeToolResult(params);
        setActiveTool({ name: toolName, result: merged });
        handleToolPayload(merged);
      };

      createdApp.onhostcontextchanged = (ctx) => {
        const toolName = ctx.toolInfo?.tool?.name;
        if (toolName) setActiveTool((prev) => ({ ...prev, name: toolName }));
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  useEffect(() => {
    setLegacyBridgeConnected(isConnected);
    if (isConnected) {
      window.dispatchEvent(
        new CustomEvent('mcp-connected', {
          detail: { hostInfo: app?.getHostVersion(), capabilities: app?.getHostCapabilities() },
        }),
      );
      const initialToolName = app?.getHostContext()?.toolInfo?.tool?.name;
      if (initialToolName) setActiveTool((prev) => ({ ...prev, name: initialToolName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <>
      <MapView hidden={mode === '3d'} onSwitchTo3d={() => setMode('3d')} />
      <PlateauView hidden={mode !== '3d'} onExit={() => setMode('2d')} />
      <WidgetOverlay tool={activeTool} onDismiss={() => setActiveTool((prev) => ({ ...prev, result: null }))} />
    </>
  );
}
