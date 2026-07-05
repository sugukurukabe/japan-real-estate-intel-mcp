import type { App } from '@modelcontextprotocol/ext-apps';

/**
 * 既存のダッシュボードロジック(dashboard-core.ts)が参照する `window.__mcpBridge` 互換レイヤー。
 * 実体は公式SDK(`@modelcontextprotocol/ext-apps`)の`App`インスタンスであり、
 * 自作のpostMessage実装は撤去済み。
 *
 * Compatibility layer for `window.__mcpBridge`, still referenced by the legacy
 * dashboard logic (dashboard-core.ts). The actual wire protocol is now the
 * official `@modelcontextprotocol/ext-apps` `App` class — the hand-rolled
 * postMessage implementation has been removed.
 *
 * Lapisan kompatibilitas untuk `window.__mcpBridge` yang masih dipakai oleh
 * logika dashboard lama. Protokol sebenarnya kini memakai App class resmi
 * dari `@modelcontextprotocol/ext-apps`; implementasi postMessage buatan sendiri
 * sudah dihapus.
 */
export interface LegacyMcpBridge {
  callServerTool: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  updateContext: (data: Record<string, unknown>) => Promise<unknown>;
  sendMessage: (text: string) => Promise<unknown>;
  readonly connected: boolean;
  readonly hostCapabilities: unknown;
}

declare global {
  interface Window {
    __mcpBridge?: LegacyMcpBridge;
  }
}

function readActiveLicenseKey(): string | undefined {
  try {
    return localStorage.getItem('rei-active-key') ?? undefined;
  } catch {
    return undefined;
  }
}

let sharedConnectedFlag = { value: false };

export function installLegacyBridgeShim(app: App): void {
  sharedConnectedFlag = { value: false };
  const connectedRef = sharedConnectedFlag;

  const shim: LegacyMcpBridge = {
    async callServerTool(name, args) {
      const payloadArgs: Record<string, unknown> = { ...(args ?? {}) };
      const key = readActiveLicenseKey();
      if (key) payloadArgs._licenseKey = key;
      const result = await app.callServerTool({ name, arguments: payloadArgs });
      return result;
    },
    async updateContext(data) {
      if (!app.getHostCapabilities()) {
        return { ok: false, reason: 'host not yet connected' };
      }
      const contextData: Record<string, unknown> = { ...(data ?? {}) };
      const key = readActiveLicenseKey();
      if (key) contextData._licenseKey = key;
      try {
        await app.updateModelContext({
          content: [{ type: 'text', text: JSON.stringify(contextData) }],
        });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'update-model-context rejected' };
      }
    },
    async sendMessage(text) {
      try {
        const result = await app.sendMessage({ role: 'user', content: [{ type: 'text', text }] });
        return result;
      } catch {
        return { ok: false, reason: 'ui/message rejected' };
      }
    },
    get connected() {
      return connectedRef.value;
    },
    get hostCapabilities() {
      return app.getHostCapabilities();
    },
  };

  window.__mcpBridge = shim;
}

/** AppShell が `useApp` の `isConnected` 遷移をこの関数経由でシムに反映する。 */
export function setLegacyBridgeConnected(value: boolean): void {
  sharedConnectedFlag.value = value;
}
