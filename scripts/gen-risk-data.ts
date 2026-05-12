import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { listAvailable } from '../src/data-loaders/index.js';
import { SYNTHETIC_RISK_PROFILES, type PrefRiskProfile } from './risk-profile-config.js';

const DATA_DIR = join(import.meta.dirname ?? '.', '..', 'data');

function pickRisk(bias: number, seed: number): string {
  const v = (Math.sin(seed * 9301 + 49297) % 1 + 1) % 1;
  if (v < bias * 0.3) return 'high';
  if (v < bias * 0.7 + 0.1) return 'medium';
  return 'low';
}

function rInt(base: number, seed: number, spread = 12): number {
  const offset = ((Math.sin(seed * 7919 + 1723) % 1 + 1) % 1 - 0.5) * spread * 2;
  return Math.round(Math.max(40, Math.min(85, base + offset)));
}

function overallScore(intensity: number, liq: string, slope: string): number {
  let s = Math.round((intensity - 50) / 5);
  if (liq === 'high') s += 3;
  else if (liq === 'medium') s += 1;
  if (slope === 'high') s += 2;
  else if (slope === 'medium') s += 1;
  return Math.max(1, Math.min(10, s));
}

function getCities(pref: string): string[] {
  const popPath = join(DATA_DIR, pref, 'population.csv');
  if (!existsSync(popPath)) return [];
  const lines = readFileSync(popPath, 'utf-8').trim().split('\n').slice(1);
  return [...new Set(lines.map(l => l.split(',')[0]).filter(Boolean))];
}

function genEarthquakeCsv(pref: string, profile: PrefRiskProfile): string {
  const cities = getCities(pref);
  const rows = ['city,seismic_intensity_30yr,liquefaction_risk,slope_failure_risk,overall_risk_score,notes'];
  cities.forEach((city, i) => {
    const intensity = rInt(profile.baseIntensity, i + city.charCodeAt(0));
    const liq = pickRisk(profile.liquefactionBias, i * 3 + 1);
    const slope = pickRisk(profile.slopeBias, i * 3 + 2);
    const score = overallScore(intensity, liq, slope);
    rows.push(`${city},${intensity},${liq},${slope},${score},${profile.notes.default}`);
  });
  return rows.join('\n') + '\n';
}

function pickFloodRisk(bias: number, seed: number): string {
  const v = (Math.sin(seed * 4801 + 31337) % 1 + 1) % 1;
  if (v < bias * 0.3) return 'high';
  if (v < bias * 0.7 + 0.1) return 'medium';
  return 'low';
}

function pickHazardZone(riverRisk: string, surgeRisk: string): string {
  if (riverRisk === 'high' || surgeRisk === 'high') return 'danger';
  if (riverRisk === 'medium' || surgeRisk === 'medium') return 'warning';
  return 'caution';
}

function genFloodCsv(pref: string, profile: PrefRiskProfile): string {
  const cities = getCities(pref);
  const rows = ['city,district,river_flood_risk,inland_flood_risk,storm_surge_risk,hazard_zone,notes'];
  cities.forEach((city, i) => {
    const river = pickFloodRisk(profile.floodBias, i * 5 + 1);
    const inland = pickFloodRisk(profile.floodBias * 0.8, i * 5 + 2);
    const surge = pickFloodRisk(profile.surgeBias, i * 5 + 3);
    const zone = pickHazardZone(river, surge);
    const note = surge !== 'low' ? profile.notes.coastal : (river !== 'low' ? profile.notes.river : profile.notes.default);
    rows.push(`${city},${city}中心部,${river},${inland},${surge},${zone},${note}`);
  });
  return rows.join('\n') + '\n';
}

for (const pref of listAvailable().sort((a, b) => a.localeCompare(b))) {
  const profile = SYNTHETIC_RISK_PROFILES[pref];
  if (!profile) {
    console.warn(`[SKIP] No risk profile for "${pref}" — add entry in scripts/risk-profile-config.ts`);
    continue;
  }
  const eqPath = join(DATA_DIR, pref, 'earthquake_risk.csv');
  const flPath = join(DATA_DIR, pref, 'flood_risk.csv');

  if (existsSync(eqPath)) {
    console.log(`SKIP ${eqPath} (already exists)`);
  } else {
    writeFileSync(eqPath, genEarthquakeCsv(pref, profile), 'utf-8');
    console.log(`WROTE ${eqPath}`);
  }

  if (existsSync(flPath)) {
    console.log(`SKIP ${flPath} (already exists)`);
  } else {
    writeFileSync(flPath, genFloodCsv(pref, profile), 'utf-8');
    console.log(`WROTE ${flPath}`);
  }
}

console.log('Done: risk data generation complete.');
