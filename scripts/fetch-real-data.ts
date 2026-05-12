#!/usr/bin/env tsx
/**
 * 実データ取得 CLI スクリプト
 *
 * MLIT 不動産情報ライブラリ API と e-Stat API から実データを取得し、
 * data/{prefecture}/*.csv を更新する。
 *
 * 使い方:
 *   npx tsx scripts/fetch-real-data.ts --prefecture aichi --year 2025
 *   npx tsx scripts/fetch-real-data.ts --prefecture tokyo --year 2025 --quarter 2
 *   npx tsx scripts/fetch-real-data.ts --all --year 2025
 *
 * 環境変数 (.env ファイルから自動読込):
 *   MLIT_API_KEY   不動産情報ライブラリ API キー
 *   ESTAT_APP_ID   e-Stat アプリケーション ID
 *
 * キーが未設定の場合、そのソースはスキップして警告ログを出す。
 * 既存 CSV ファイルはスキップしたソース分は変更されない。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env before anything else
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

import { MlitClient, transactionsToCsv, landPriceToCsv } from '../src/api-client/mlit.js';
import { EstatClient, populationToCsv } from '../src/api-client/estat.js';
import { listAvailable } from '../src/data-loaders/index.js';

// ── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

const ALL = hasFlag('--all');
const prefFlag = getArg('--prefecture');
const yearFlag = getArg('--year');
const quarterFlag = getArg('--quarter');

if (!ALL && !prefFlag) {
  console.error('Error: specify --prefecture <key> or --all');
  console.error('Example: tsx scripts/fetch-real-data.ts --prefecture aichi --year 2025');
  process.exit(1);
}

const YEAR = yearFlag ? parseInt(yearFlag, 10) : new Date().getFullYear();
const QUARTER = quarterFlag ? (parseInt(quarterFlag, 10) as 1 | 2 | 3 | 4) : undefined;

if (isNaN(YEAR) || YEAR < 2005 || YEAR > 2030) {
  console.error(`Error: invalid --year "${yearFlag}"`);
  process.exit(1);
}

const SUPPORTED_PREFECTURES = listAvailable().sort((a, b) => a.localeCompare(b));
const PREFECTURES = ALL ? SUPPORTED_PREFECTURES : [prefFlag!];

for (const p of PREFECTURES) {
  if (!SUPPORTED_PREFECTURES.includes(p)) {
    console.error(`Error: unsupported prefecture "${p}". Supported: ${SUPPORTED_PREFECTURES.join(', ')}`);
    process.exit(1);
  }
}

// ── API key checks ───────────────────────────────────────────────────────────

const MLIT_KEY = process.env['MLIT_API_KEY'];
const ESTAT_ID = process.env['ESTAT_APP_ID'];

if (!MLIT_KEY) {
  console.warn('[WARN] MLIT_API_KEY not set — skipping land price / transaction data');
}
if (!ESTAT_ID) {
  console.warn('[WARN] ESTAT_APP_ID not set — skipping population data');
}

if (!MLIT_KEY && !ESTAT_ID) {
  console.error('[ERROR] No API keys set. Nothing to fetch.');
  console.error('Set MLIT_API_KEY and/or ESTAT_APP_ID in .env');
  process.exit(1);
}

// ── Data directory helper ────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '..');

function dataPath(pref: string, filename: string): string {
  return resolve(ROOT, 'data', pref, filename);
}

function writeCsv(path: string, content: string, label: string): void {
  writeFileSync(path, content, 'utf-8');
  const lines = content.split('\n').length - 1; // exclude header
  console.log(`[OK] ${label}: ${lines} rows → ${path.replace(ROOT, '.')}`);
}

// ── Main fetch loop ──────────────────────────────────────────────────────────

async function fetchForPrefecture(pref: string): Promise<void> {
  console.log(`\n=== ${pref.toUpperCase()} (year=${YEAR}${QUARTER ? ` Q${QUARTER}` : ''}) ===`);

  // 1. MLIT: 取引価格 → transactions.csv + land_price.csv
  if (MLIT_KEY) {
    const mlit = new MlitClient(MLIT_KEY);
    try {
      console.log(`[MLIT] Fetching transactions...`);
      const transactions = await mlit.fetchTransactions(pref, YEAR, QUARTER);
      console.log(`[MLIT] Got ${transactions.length} records`);

      if (transactions.length > 0) {
        // transactions.csv
        const txRows = mlit.toTransactionRows(transactions);
        writeCsv(
          dataPath(pref, 'transactions.csv'),
          transactionsToCsv(txRows),
          'transactions',
        );

        // land_price.csv (aggregate from transactions)
        const lpRows = mlit.toLandPriceRows(transactions, YEAR);
        writeCsv(
          dataPath(pref, 'land_price.csv'),
          landPriceToCsv(lpRows),
          'land_price',
        );
      } else {
        console.warn(`[MLIT] No records returned for ${pref} ${YEAR}. CSV not updated.`);
      }
    } catch (err) {
      console.error(`[MLIT] Error for ${pref}: ${(err as Error).message}`);
      console.error('[MLIT] Existing CSV files are unchanged.');
    }
  }

  // 2. e-Stat: 人口 → population.csv
  if (ESTAT_ID) {
    const estat = new EstatClient(ESTAT_ID);
    try {
      console.log(`[e-Stat] Fetching population (2020 census)...`);
      const response = await estat.fetchPopulation(pref);
      const rows = estat.toPopulationRows(response);
      console.log(`[e-Stat] Got ${rows.length} municipality records`);

      if (rows.length > 0) {
        writeCsv(
          dataPath(pref, 'population.csv'),
          populationToCsv(rows),
          'population',
        );
      } else {
        console.warn(`[e-Stat] No records returned for ${pref}. CSV not updated.`);
      }
    } catch (err) {
      console.error(`[e-Stat] Error for ${pref}: ${(err as Error).message}`);
      console.error('[e-Stat] Existing CSV file is unchanged.');
    }
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

console.log('Japan Real Estate Intel MCP — Real Data Fetcher v6.15.0');
console.log(`Prefectures: ${PREFECTURES.join(', ')}`);
console.log(`Year: ${YEAR}${QUARTER ? `, Quarter: ${QUARTER}` : ''}`);
console.log(`MLIT API: ${MLIT_KEY ? 'enabled' : 'SKIPPED (no key)'}`);
console.log(`e-Stat API: ${ESTAT_ID ? 'enabled' : 'SKIPPED (no key)'}`);

(async () => {
  for (const pref of PREFECTURES) {
    await fetchForPrefecture(pref);
  }
  console.log('\nDone. Run `npm run build` and restart the MCP server to use updated data.');
})().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
