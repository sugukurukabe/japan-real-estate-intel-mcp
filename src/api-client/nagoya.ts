/**
 * Nagoya city open data client.
 *
 * Loads redevelopment and urban planning data from bundled JSON,
 * with optional future support for live fetching from Nagoya city open data portal.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface NagoyaPlan {
  project: string;
  type:
    | 'redevelopment'
    | 'transport'
    | 'commercial'
    | 'preservation'
    | 'infrastructure'
    | 'mixed_use';
  status: 'planning' | 'approved' | 'under_construction' | 'completed' | 'partial_open';
  ward: string;
  affectedChochou: string[];
  startYear: number;
  completionYear: number;
  expectedPriceImpactPct: number;
  expectedDemandImpactPct: number;
  description: string;
}

export interface ChochouEntry {
  name: string;
  lat: number;
  lng: number;
}

export interface WardEntry {
  ward: string;
  wardCode: string;
  chochou: ChochouEntry[];
}

export interface ChochouData {
  prefecture: string;
  city: string;
  wards: WardEntry[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data/aichi');

let plansCache: NagoyaPlan[] | null = null;
let chochouCache: ChochouData | null = null;

export function loadNagoyaPlans(): NagoyaPlan[] {
  if (plansCache) return plansCache;
  const filePath = resolve(DATA_DIR, 'nagoya-plans.json');
  if (!existsSync(filePath)) return [];
  plansCache = JSON.parse(readFileSync(filePath, 'utf-8')) as NagoyaPlan[];
  return plansCache;
}

export function loadChochouData(): ChochouData | null {
  if (chochouCache) return chochouCache;
  const filePath = resolve(DATA_DIR, 'chochou.json');
  if (!existsSync(filePath)) return null;
  chochouCache = JSON.parse(readFileSync(filePath, 'utf-8')) as ChochouData;
  return chochouCache;
}

export function getPlansForChochou(ward: string, chochou: string): NagoyaPlan[] {
  const plans = loadNagoyaPlans();
  return plans.filter(
    (p) =>
      p.ward === ward ||
      p.affectedChochou.some(
        (c) => c === chochou || chochou.startsWith(c.replace(/[一二三四五六七八九十]丁目$/, '')),
      ),
  );
}

export function getWardChochouList(ward: string): ChochouEntry[] {
  const data = loadChochouData();
  if (!data) return [];
  const w = data.wards.find((w) => w.ward === ward);
  return w?.chochou ?? [];
}

export function getAllWards(): string[] {
  const data = loadChochouData();
  if (!data) return [];
  return data.wards.map((w) => w.ward);
}

export function resetCache(): void {
  plansCache = null;
  chochouCache = null;
}
