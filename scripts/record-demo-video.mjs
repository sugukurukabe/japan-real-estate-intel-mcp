#!/usr/bin/env node
/**
 * Record a short dashboard demo (WebM) for marketing.
 * Usage: pnpm run demo:record
 * Convert to GIF: see docs/demo-video-script.md
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../docs/screenshots');
const URL =
  process.env.DEMO_URL ??
  'https://realestate-mcp.jp/dashboard.html?prefecture=aichi';

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  console.log(`Recording ${URL} (~45s)...`);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);

  // Dismiss quickstart if visible
  const close = page.locator('button:has-text("閉じる")').first();
  if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
    await close.click();
  }

  // Cycle map layers for visual motion
  for (const label of ['災害', '人流', '地価']) {
    await page.getByRole('button', { name: label }).click().catch(() => {});
    await page.waitForTimeout(4000);
  }

  // Comparison mode toggle
  await page.locator('#comparison-toggle').click().catch(() => {});
  await page.waitForTimeout(5000);
  await page.locator('#comparison-toggle').click().catch(() => {});
  await page.waitForTimeout(3000);

  const video = page.video();
  const dest = resolve(OUT_DIR, 'demo-preview.webm');
  await page.close();
  if (video) {
    await video.saveAs(dest);
    console.log(`Saved: ${dest}`);
  } else {
    console.log('No video recorded.');
  }
  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
