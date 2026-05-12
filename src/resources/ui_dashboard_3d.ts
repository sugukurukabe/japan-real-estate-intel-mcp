import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedHtml: string | null = null;
let cachedBridge: string | null = null;

function loadBridge(): string {
  if (cachedBridge) return cachedBridge;
  try {
    const bridgePath = resolve(__dirname, '..', '..', 'ui', 'mcp-bridge.js');
    cachedBridge = readFileSync(bridgePath, 'utf-8');
  } catch {
    cachedBridge = '/* MCP bridge not found */';
  }
  return cachedBridge;
}

export function getDashboard3dHtml(): string {
  if (cachedHtml) return cachedHtml;
  try {
    const htmlPath = resolve(__dirname, '..', '..', 'ui', 'dashboard-3d.html');
    let html = readFileSync(htmlPath, 'utf-8');
    const bridge = loadBridge().replace(/<\/script/gi, '<\\/script');
    html = html.replace('</body>', () => `<script>${bridge}</script>\n</body>`);
    cachedHtml = html;
    return cachedHtml;
  } catch {
    return '<html><body><h1>3D Dashboard not built. Run: pnpm build:ui</h1></body></html>';
  }
}
