#!/usr/bin/env tsx
/**
 * transactions.csv の use / property_type フィールドから
 * エリアごとの推定用途地域データ (zoning.csv) を生成する。
 *
 * MLIT API から直接取得した場合は CityPlanning / CoverageRatio / FloorAreaRatio が使えるが、
 * ローカル CSV にはそれらがないため、エリアの取引特性から推定する。
 *
 * 使い方:
 *   npx tsx scripts/gen-zoning-from-transactions.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { listAvailable } from '../src/data-loaders/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_ROOT = resolve(ROOT, 'data');

const PREFECTURES = listAvailable().sort((a, b) => a.localeCompare(b));

interface TransactionRow {
  city: string;
  district: string;
  property_type: string;
  use: string;
  price_per_sqm: number;
}

/**
 * Map transaction use/type mix to a realistic zoning category.
 */
function inferZoneType(commercialRatio: number, officeRatio: number, residentialRatio: number): string {
  if (commercialRatio > 0.6) return '商業地域';
  if (commercialRatio > 0.3 && officeRatio > 0.2) return '近隣商業地域';
  if (officeRatio > 0.4) return '商業地域';
  if (residentialRatio > 0.8) return '第1種低層住居専用地域';
  if (residentialRatio > 0.6) return '第1種住居地域';
  if (residentialRatio > 0.4 && commercialRatio > 0.1) return '第2種住居地域';
  if (commercialRatio > 0.15) return '準住居地域';
  return '第1種中高層住居専用地域';
}

const ZONE_DEFAULTS: Record<string, { coverage: number; far: number; height: number | null }> = {
  '第1種低層住居専用地域': { coverage: 50, far: 100, height: 10 },
  '第2種低層住居専用地域': { coverage: 50, far: 150, height: 10 },
  '第1種中高層住居専用地域': { coverage: 60, far: 200, height: null },
  '第2種中高層住居専用地域': { coverage: 60, far: 200, height: null },
  '第1種住居地域': { coverage: 60, far: 200, height: null },
  '第2種住居地域': { coverage: 60, far: 200, height: null },
  '準住居地域': { coverage: 60, far: 200, height: null },
  '近隣商業地域': { coverage: 80, far: 300, height: null },
  '商業地域': { coverage: 80, far: 400, height: null },
  '準工業地域': { coverage: 60, far: 200, height: null },
  '工業地域': { coverage: 60, far: 200, height: null },
  '工業専用地域': { coverage: 60, far: 200, height: null },
};

function processPrefecture(pref: string): void {
  const txPath = resolve(DATA_ROOT, pref, 'transactions.csv');
  if (!existsSync(txPath)) {
    console.warn(`[SKIP] ${pref}: transactions.csv not found`);
    return;
  }

  const raw = readFileSync(txPath, 'utf-8').replace(/^\uFEFF/, '');
  const { data } = Papa.parse<TransactionRow>(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });

  const grouped = new Map<string, TransactionRow[]>();
  for (const row of data) {
    if (!row.city || !row.district) continue;
    const key = `${row.city}|${row.district}`;
    const arr = grouped.get(key) ?? [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const csvRows: string[] = ['city,district,zone_type,coverage_ratio,floor_area_ratio,height_limit'];

  for (const [key, rows] of grouped) {
    const [city, district] = key.split('|');
    const total = rows.length;
    if (total === 0) continue;

    const commercial = rows.filter(r =>
      r.property_type === 'commercial' || r.use === '店舗' || r.use === '事務所',
    ).length;
    const office = rows.filter(r => r.use === '事務所').length;
    const residential = rows.filter(r =>
      r.property_type === 'residential' || r.use === '住宅' || r.use === '戸建て' || r.use === 'マンション',
    ).length;

    const zone = inferZoneType(commercial / total, office / total, residential / total);
    const defaults = ZONE_DEFAULTS[zone] ?? ZONE_DEFAULTS['第1種住居地域'];

    csvRows.push([
      `"${city}"`,
      `"${district}"`,
      `"${zone}"`,
      defaults.coverage,
      defaults.far,
      defaults.height ?? '',
    ].join(','));
  }

  const outDir = resolve(DATA_ROOT, pref);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'zoning.csv');
  writeFileSync(outPath, csvRows.join('\n') + '\n', 'utf-8');
  console.log(`[OK] ${pref}: ${csvRows.length - 1} zoning records → ${outPath.replace(ROOT, '.')}`);
}

console.log('Generating zoning.csv from transactions data...\n');
for (const pref of PREFECTURES) {
  processPrefecture(pref);
}
console.log('\nDone.');
