import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

async function main() {
  mkdirSync(resolve(ROOT, 'ui'), { recursive: true });

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
  const js = readFileSync(resolve(ROOT, 'ui', 'dashboard.js'), 'utf-8');
  const css = readFileSync(resolve(ROOT, 'ui', 'dashboard.css'), 'utf-8');

  const inlined = htmlTemplate
    .replace('<!-- CSS_PLACEHOLDER -->', `<style>${css}</style>`)
    .replace('<!-- JS_PLACEHOLDER -->', `<script>${js}</script>`);

  writeFileSync(resolve(ROOT, 'ui', 'dashboard.html'), inlined, 'utf-8');
  console.log('UI built → ui/dashboard.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
