#!/usr/bin/env tsx
/**
 * 路線価データ (rosenka.csv) を生成するスクリプト。
 * 公示地価 (land_price.csv) から市区町村・年別の中央値を集計し、
 * 路線価 ≈ 公示地価 × 0.80 の実務比率でサンプルデータを生成する。
 *
 * 実務では geospatial.jp CKAN の路線価 GIS データや NTA 路線価 PDF を
 * パースして置換すること。
 *
 * 使い方:
 *   npx tsx scripts/fetch-rosenka.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_ROOT = resolve(ROOT, 'data');

const PREFECTURES: Record<string, string> = Object.fromEntries(
  listAvailable().map(k => [k, getLoader(k).displayName]),
);

const CSV_HEADER = 'city,district,year,median_per_sqm,max_per_sqm,min_per_sqm,sample_lines';

interface LandPriceRow {
  year: number;
  city: string;
  district: string;
  price_per_sqm: number;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function generateRosenkaFromLandPrice(prefKey: string): string {
  const landPricePath = resolve(DATA_ROOT, prefKey, 'land_price.csv');
  if (!existsSync(landPricePath)) {
    console.warn(`  [skip] ${prefKey}: land_price.csv not found`);
    return CSV_HEADER + '\n';
  }

  const raw = readFileSync(landPricePath, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = Papa.parse<LandPriceRow>(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Group by city + district + year
  const grouped = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.city || !r.district || !r.year || !r.price_per_sqm) continue;
    const key = `${r.city}||${r.district}||${r.year}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r.price_per_sqm);
  }

  const lines: string[] = [CSV_HEADER];
  for (const [key, prices] of grouped.entries()) {
    const [city, district, yearStr] = key.split('||') as [string, string, string];
    const year = parseInt(yearStr, 10);
    const sorted = [...prices].sort((a, b) => a - b);
    const med = median(prices);
    // 路線価 ≈ 公示地価 × 0.80 (実務上の標準比率)
    const ROSENKA_RATIO = 0.80;
    const medRosenka = Math.round(med * ROSENKA_RATIO);
    const maxRosenka = Math.round(Math.max(...prices) * ROSENKA_RATIO);
    const minRosenka = Math.round(Math.min(...prices) * ROSENKA_RATIO);
    // Add ±10% variance to simulate spread across routes
    const variance = 0.10;
    const maxWithVariance = Math.round(maxRosenka * (1 + variance));
    const minWithVariance = Math.round(minRosenka * (1 - variance));
    lines.push(`${city},${district},${year},${medRosenka},${maxWithVariance},${minWithVariance},${sorted.length}`);
  }

  return lines.join('\n') + '\n';
}

let totalWritten = 0;
for (const [prefKey, prefName] of Object.entries(PREFECTURES)) {
  const dir = resolve(DATA_ROOT, prefKey);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const outputPath = resolve(dir, 'rosenka.csv');
  const csv = generateRosenkaFromLandPrice(prefKey);
  writeFileSync(outputPath, csv, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim()).length - 1;
  console.log(`✓ ${prefName} (${prefKey}): ${lines} rows → ${outputPath}`);
  totalWritten += lines;
}

console.log(`\nDone. Total: ${totalWritten} rosenka rows across ${Object.keys(PREFECTURES).length} prefectures.`);
