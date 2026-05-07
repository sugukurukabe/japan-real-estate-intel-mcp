#!/usr/bin/env node
/**
 * Download Japanese font for PDF generation.
 * Run once after npm install: node scripts/download-fonts.js
 *
 * Font: IPAex Gothic (IPA License — redistribution allowed)
 * Source: https://moji.or.jp/ipafont/
 */

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(__dirname, '../assets/fonts');
const FONT_PATH = path.join(FONTS_DIR, 'ipaexg.ttf');

const IPA_FONT_URL = 'https://moji.or.jp/wp-content/ipafont/IPAexfont/ipaexg00401.zip';

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.destroy();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

if (fs.existsSync(FONT_PATH)) {
  console.log(`Font already present: ${FONT_PATH}`);
  process.exit(0);
}

fs.mkdirSync(FONTS_DIR, { recursive: true });

console.log('Downloading IPAex Gothic font...');
const zipPath = path.join(FONTS_DIR, 'ipaexg.zip');

try {
  await download(IPA_FONT_URL, zipPath);
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith('.ttf'));
  if (!entry) throw new Error('TTF not found in zip');
  fs.writeFileSync(FONT_PATH, entry.getData());
  fs.unlinkSync(zipPath);
  const size = fs.statSync(FONT_PATH).size;
  console.log(`Font installed: ${FONT_PATH} (${(size / 1024 / 1024).toFixed(1)} MB)`);
} catch (err) {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  console.error('Failed to download font:', err.message);
  console.error('PDF will fall back to Helvetica (no Japanese support).');
  process.exit(0); // Non-fatal — PDF still works, just no JP glyphs
}
