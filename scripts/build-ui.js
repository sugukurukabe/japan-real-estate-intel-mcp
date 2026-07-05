import { build } from 'vite';
import { mkdirSync, renameSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const UI_SRC = resolve(ROOT, 'ui-src');
const UI_OUT = resolve(ROOT, 'ui');

function generatePrefectureData() {
  const require = createRequire(import.meta.url);
  const tsxPkgDir = dirname(require.resolve('tsx/package.json'));
  const tsxCli = resolve(tsxPkgDir, 'dist', 'cli.mjs');
  execFileSync(process.execPath, [tsxCli, 'scripts/generate-ui-prefecture-data.ts'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

/**
 * MCP Appsダッシュボード(2D地図・3D PLATEAUビュー・ツールウィジェットを統合した
 * 単一Reactアプリ)をViteでビルドし、`ui/dashboard.html`として出力する。
 * JS/CSSは`vite-plugin-singlefile`により単一HTMLにインライン化されるため、
 * MCP Appsリソースとしてそのまま配信できる(外部CDN依存なし)。
 *
 * Builds the MCP Apps dashboard (a single React app unifying the 2D map,
 * the 3D PLATEAU view, and tool-result widgets) with Vite and emits it as
 * `ui/dashboard.html`. JS/CSS are inlined into a single HTML file via
 * `vite-plugin-singlefile`, so it can be served directly as an MCP Apps
 * resource with no external CDN dependency.
 */
async function main() {
  mkdirSync(UI_OUT, { recursive: true });

  generatePrefectureData();

  await build({ configFile: resolve(UI_SRC, 'vite.config.ts') });

  // vite-plugin-singlefile inlines JS/CSS but still emits the built HTML as
  // `index.html` (matching the `input` entry name) — rename to the URI the
  // MCP resource handlers expect.
  const builtIndex = resolve(UI_OUT, 'index.html');
  const dashboardHtml = resolve(UI_OUT, 'dashboard.html');
  if (existsSync(builtIndex)) {
    renameSync(builtIndex, dashboardHtml);
  }
  // vite-plugin-singlefile inlines all assets; the now-empty assets directory
  // (and any stray chunk files) can be removed.
  const assetsDir = resolve(UI_OUT, 'dashboard-assets');
  if (existsSync(assetsDir)) {
    rmSync(assetsDir, { recursive: true, force: true });
  }

  console.log('UI built → ui/dashboard.html (2D + 3D + widgets, single MCP Apps bundle)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
