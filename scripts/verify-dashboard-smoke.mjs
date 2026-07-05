#!/usr/bin/env node
/**
 * ローカルの実ブラウザで統合ダッシュボードを読み込み、React初期化・
 * Leaflet地図描画・3Dビュー切替・コンソールエラー無しを検証するスモークテスト。
 *
 * Smoke-tests the unified dashboard in a real headless browser: verifies
 * React mounts, the Leaflet map renders, the 3D view switch works, and no
 * console/page errors occur.
 *
 * Skrip smoke test dashboard terpadu di browser headless nyata: memverifikasi
 * React ter-mount, peta Leaflet ter-render, tombol beralih ke tampilan 3D
 * berfungsi, dan tidak ada error konsol/halaman.
 *
 * Usage: node scripts/verify-dashboard-smoke.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_ROOT = resolve(__dirname, '../ui');
const PORT = Number(process.env.SMOKE_PORT ?? 3848);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

function startStaticServer(root) {
  return new Promise((resolvePromise) => {
    const server = createServer(async (req, res) => {
      const path = req.url?.split('?')[0] ?? '/';
      const file = join(root, path === '/' ? 'dashboard.html' : path.replace(/^\//, ''));
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(PORT, () => resolvePromise(server));
  });
}

const errors = [];
let ok = true;

function fail(msg) {
  ok = false;
  console.error(`✗ ${msg}`);
}
function pass(msg) {
  console.log(`✓ ${msg}`);
}

async function main() {
  const server = await startStaticServer(UI_ROOT);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));

  try {
    await page.goto(`http://127.0.0.1:${PORT}/dashboard.html?prefecture=aichi`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return !!root && root.children.length > 0;
    });
    rootHasContent ? pass('React mounted content into #root') : fail('React #root is empty');

    const mapReady = await page
      .locator('.leaflet-container')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    mapReady ? pass('Leaflet map container rendered') : fail('Leaflet map container did not render');

    const quickstartClose = page.locator('#close-quickstart-btn, button:has-text("閉じる")').first();
    if (await quickstartClose.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickstartClose.click();
      await page.waitForTimeout(300);
      pass('Dismissed first-run quickstart overlay');
    }

    const switch3dVisible = await page.locator('#btn-switch-3d').isVisible().catch(() => false);
    switch3dVisible ? pass('3D switch button present') : fail('3D switch button missing');

    if (switch3dVisible) {
      await page.click('#btn-switch-3d');
      await page.waitForTimeout(2500);
      const canvasVisible = await page
        .locator('#plateau-view canvas')
        .first()
        .isVisible({ timeout: 10000 })
        .catch(() => false);
      canvasVisible ? pass('PlateauView Three.js canvas rendered after switch') : fail('Three.js canvas did not render');

      const exitVisible = await page.locator('#plateau-view button:has-text("2D")').first().isVisible().catch(() => false);
      exitVisible ? pass('PlateauView exit-to-2D control present') : fail('PlateauView exit-to-2D control missing');
    }

    const bridgeInstalled = await page.evaluate(() => typeof window.__mcpBridge === 'object');
    bridgeInstalled ? pass('window.__mcpBridge legacy shim installed') : fail('window.__mcpBridge shim missing');

    if (errors.length > 0) {
      fail(`${errors.length} console/page error(s) captured:`);
      for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    } else {
      pass('No console/page errors');
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (!ok) {
    console.error('\nSmoke test FAILED');
    process.exit(1);
  }
  console.log('\nSmoke test PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
