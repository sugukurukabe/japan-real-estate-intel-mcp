import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

/**
 * MCP Apps ダッシュボードのビルド設定。
 * Build config for the MCP Apps dashboard.
 * Konfigurasi build untuk dashboard MCP Apps.
 *
 * `text/html;profile=mcp-app` リソースとして配信するため、JS/CSSを単一HTMLに
 * インライン化する(vite-plugin-singlefile)。外部CDNへの依存を排除し、
 * サーバー側のCSP(`_meta.ui.csp`)を最小化できるようにする。
 */
export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: resolve(__dirname, '..', 'ui'),
    emptyOutDir: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'dashboard-assets/[name].js',
        chunkFileNames: 'dashboard-assets/[name].js',
        assetFileNames: 'dashboard-assets/[name].[ext]',
      },
    },
    target: 'es2020',
  },
});
