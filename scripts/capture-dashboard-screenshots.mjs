#!/usr/bin/env node
/**
 * Capture dashboard screenshots for README and directory listings.
 * Requires: pnpm exec playwright install chromium (one-time)
 * Usage: pnpm run build:ui && node scripts/capture-dashboard-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../docs/screenshots');
const UI_ROOT = resolve(__dirname, '../ui');
const PORT = Number(process.env.SCREENSHOT_PORT ?? 3847);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

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

async function dismissQuickstart(page) {
  const close = page.locator('#quickstart-close, button:has-text("閉じる")').first();
  if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
    await close.click();
  }
}

async function capture(page, file, url, setup) {
  console.log(`Capturing ${file} ← ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);
  await dismissQuickstart(page);
  if (setup) await setup(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT, file), fullPage: false });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startStaticServer(UI_ROOT);
  const base = `http://127.0.0.1:${PORT}/dashboard.html`;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  try {
    await capture(page, 'dashboard-overview.png', `${base}?prefecture=aichi`);

    await capture(page, 'comparison-mode.png', `${base}?prefecture=aichi`, async (p) => {
      await p.click('#comparison-toggle');
      await p.waitForTimeout(800);
      const sel = p.locator('#comparison-pref-select');
      if (await sel.count()) {
        await sel.selectOption('tokyo');
      }
    });

    await capture(page, 'renovation-mode.png', `${base}?prefecture=aichi&mode=investment`, async (p) => {
      await p.locator('#area-search').selectOption({ label: '名古屋市中村区' }).catch(() => {});
    });

    await capture(page, 'contract-mode.png', `${base}?prefecture=aichi`, async (p) => {
      await p.click('button[data-mode="cashflow"]');
      await p.locator('#area-search').selectOption({ label: '名古屋市中村区' }).catch(() => {});
    });

    // v7.0.0〜: 3Dビューは統合ダッシュボード内の切替ボタン(#btn-switch-3d)から表示する
    // (旧: 別ページ dashboard-3d.html への遷移)。
    const page3d = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page3d.goto(`${base}?prefecture=aichi`, { waitUntil: 'networkidle', timeout: 90000 });
    await page3d.waitForTimeout(1500);
    await dismissQuickstart(page3d);
    await page3d.click('#btn-switch-3d');
    await page3d.waitForTimeout(4000);
    await page3d.screenshot({ path: resolve(OUT, '3d-view.png'), fullPage: false });
    await page3d.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`Done. Files written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
