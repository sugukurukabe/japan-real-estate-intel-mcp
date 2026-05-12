#!/usr/bin/env tsx
/**
 * e-Stat 住宅・土地統計調査から空き家率データを取得し vacancy.csv を生成。
 * ESTAT_APP_ID が未設定の場合はサンプルデータで生成する。
 *
 * 使い方:
 *   npx tsx scripts/fetch-vacancy-data.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_ROOT = resolve(ROOT, 'data');

const envPath = resolve(ROOT, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const ESTAT_ID = process.env['ESTAT_APP_ID'];

const PREFECTURES: Record<string, string> = Object.fromEntries(
  listAvailable().map(k => [k, getLoader(k).displayName]),
);

const CSV_HEADER = 'city,total_housing,total_vacant,vacancy_rate,for_rent,for_sale,other_vacant';

interface VacancyRow {
  city: string;
  total_housing: number;
  total_vacant: number;
  vacancy_rate: number;
  for_rent: number;
  for_sale: number;
  other_vacant: number;
}

function generateSampleData(pref: string, prefName: string): VacancyRow[] {
  const populationPath = resolve(DATA_ROOT, pref, 'population.csv');
  const cities: string[] = [];

  if (existsSync(populationPath)) {
    const raw = readFileSync(populationPath, 'utf-8').replace(/^\uFEFF/, '');
    for (const line of raw.split('\n').slice(1)) {
      const city = line.split(',')[0]?.replace(/"/g, '').trim();
      if (city && city !== prefName) cities.push(city);
    }
  }

  if (cities.length === 0) {
    cities.push(`${prefName}市`);
  }

  const seed = pref.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rng = (i: number) => {
    const x = Math.sin(seed * 1000 + i * 137.5) * 10000;
    return x - Math.floor(x);
  };

  return cities.map((city, i) => {
    const totalHousing = Math.round(30000 + rng(i) * 200000);
    const vacancyRate = Math.round((8 + rng(i + 100) * 18) * 10) / 10;
    const totalVacant = Math.round(totalHousing * vacancyRate / 100);
    const forRentRatio = 0.3 + rng(i + 200) * 0.3;
    const forSaleRatio = 0.05 + rng(i + 300) * 0.1;
    const forRent = Math.round(totalVacant * forRentRatio);
    const forSale = Math.round(totalVacant * forSaleRatio);
    const other = totalVacant - forRent - forSale;
    return { city, total_housing: totalHousing, total_vacant: totalVacant, vacancy_rate: vacancyRate, for_rent: forRent, for_sale: forSale, other_vacant: Math.max(0, other) };
  });
}

async function fetchFromEstat(pref: string): Promise<VacancyRow[]> {
  const { EstatClient } = await import('../src/api-client/estat.js');
  const client = new EstatClient(ESTAT_ID!);
  const rows = await client.fetchVacancyStats(pref);
  return rows.map(r => {
    const totalHousing = Math.round(r.totalVacant / 0.135);
    const vacancyRate = Math.round((r.totalVacant / totalHousing) * 1000) / 10;
    return {
      city: r.city,
      total_housing: totalHousing,
      total_vacant: r.totalVacant,
      vacancy_rate: vacancyRate,
      for_rent: r.forRent,
      for_sale: r.forSale,
      other_vacant: r.other,
    };
  });
}

function toCsv(rows: VacancyRow[]): string {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push([
      `"${r.city}"`,
      r.total_housing,
      r.total_vacant,
      r.vacancy_rate,
      r.for_rent,
      r.for_sale,
      r.other_vacant,
    ].join(','));
  }
  return lines.join('\n') + '\n';
}

console.log('Generating vacancy.csv data...');
console.log(`e-Stat API: ${ESTAT_ID ? 'enabled' : 'using sample data'}\n`);

(async () => {
  for (const [pref, prefName] of Object.entries(PREFECTURES)) {
    try {
      let rows: VacancyRow[];
      if (ESTAT_ID) {
        rows = await fetchFromEstat(pref);
        if (rows.length === 0) {
          console.warn(`[WARN] ${pref}: No e-Stat data, falling back to sample`);
          rows = generateSampleData(pref, prefName);
        }
      } else {
        rows = generateSampleData(pref, prefName);
      }

      const outDir = resolve(DATA_ROOT, pref);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const outPath = resolve(outDir, 'vacancy.csv');
      writeFileSync(outPath, toCsv(rows), 'utf-8');
      console.log(`[OK] ${pref}: ${rows.length} rows → ${outPath.replace(ROOT, '.')}`);
    } catch (err) {
      console.error(`[ERR] ${pref}: ${(err as Error).message}, generating sample data`);
      const rows = generateSampleData(pref, prefName);
      const outDir = resolve(DATA_ROOT, pref);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'vacancy.csv'), toCsv(rows), 'utf-8');
    }
  }
  console.log('\nDone.');
})().catch(err => { console.error('[FATAL]', err); process.exit(1); });
