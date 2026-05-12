import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function generatePrefectureData() {
  const require = createRequire(import.meta.url);
  const tsxPkgDir = dirname(require.resolve('tsx/package.json'));
  const tsxCli = resolve(tsxPkgDir, 'dist', 'cli.mjs');
  execFileSync(process.execPath, [tsxCli, 'scripts/generate-ui-prefecture-data.ts'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

async function main() {
  mkdirSync(resolve(ROOT, 'ui'), { recursive: true });

  generatePrefectureData();

  await build({
    entryPoints: [resolve(ROOT, 'ui-src', 'main.ts')],
    bundle: true,
    minify: true,
    outfile: resolve(ROOT, 'ui', 'dashboard.js'),
    format: 'iife',
    target: 'es2020',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  await build({
    entryPoints: [resolve(ROOT, 'ui-src', 'styles.css')],
    bundle: true,
    minify: true,
    outfile: resolve(ROOT, 'ui', 'dashboard.css'),
  });

  const htmlTemplate = readFileSync(resolve(ROOT, 'ui-src', 'index.html'), 'utf-8');
  /** Break out of HTML script if bundle ever contained this sequence (defense in depth). */
  const js = readFileSync(resolve(ROOT, 'ui', 'dashboard.js'), 'utf-8').replace(/<\/script/gi, '<\\/script');
  const css = readFileSync(resolve(ROOT, 'ui', 'dashboard.css'), 'utf-8');

  // Use replacer functions so minified JS tokens like `$&`, `$'`, `$$` in css/js are not treated as
  // String.replace substitution patterns (would corrupt the bundle inside <script>).
  const inlined = htmlTemplate
    .replace('<!-- CSS_PLACEHOLDER -->', () => `<style>${css}</style>`)
    .replace('<!-- JS_PLACEHOLDER -->', () => `<script>${js}</script>`);

  writeFileSync(resolve(ROOT, 'ui', 'dashboard.html'), inlined, 'utf-8');
  console.log('UI built → ui/dashboard.html');

  const dashboard3dSrc = resolve(ROOT, 'ui-src', 'dashboard-3d.html');
  if (existsSync(dashboard3dSrc)) {
    copyFileSync(dashboard3dSrc, resolve(ROOT, 'ui', 'dashboard-3d.html'));
    console.log('UI copied → ui/dashboard-3d.html (from ui-src)');
  } else {
    console.log('ℹ  ui/dashboard-3d.html already exists (standalone)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
