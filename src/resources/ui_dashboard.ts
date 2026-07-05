import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedHtml: string | null = null;

/**
 * ビルド済みの統合ダッシュボード(2D+3D+ウィジェット、Vite単一HTML出力)を読み込む。
 * 公式`@modelcontextprotocol/ext-apps`のAppクラスはバンドルに含まれているため、
 * ここでの独自ブリッジ注入は不要(v7以降撤去)。
 *
 * Loads the built unified dashboard (2D + 3D + widgets, single Vite HTML
 * output). The official `@modelcontextprotocol/ext-apps` `App` class is
 * already part of the bundle, so no custom bridge injection is needed here
 * (removed as of v7).
 *
 * Memuat dashboard terpadu hasil build (2D + 3D + widget, output HTML
 * tunggal dari Vite). Class `App` resmi dari `@modelcontextprotocol/ext-apps`
 * sudah termasuk dalam bundle, sehingga injeksi bridge kustom di sini tidak
 * diperlukan lagi (dihapus sejak v7).
 */
export function getDashboardHtml(): string {
  if (cachedHtml) return cachedHtml;
  try {
    const htmlPath = resolve(__dirname, '..', '..', 'ui', 'dashboard.html');
    cachedHtml = readFileSync(htmlPath, 'utf-8');
    return cachedHtml;
  } catch {
    return '<html><body><h1>Dashboard not built. Run: npm run build:ui</h1></body></html>';
  }
}
