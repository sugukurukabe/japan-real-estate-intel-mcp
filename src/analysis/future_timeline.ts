/**
 * Future timeline engine for Nagoya.
 *
 * Integrates future_infrastructure.json, nagoya-plans.json,
 * and population projection to produce a year-by-year timeline.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadNagoyaPlans, type NagoyaPlan } from '../api-client/nagoya.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface FutureEvent {
  year: number;
  project: string;
  type: string;
  status: string;
  ward: string | null;
  expectedImpact: {
    priceChangePct: number;
    demandChangePct: number;
  };
  description: string;
  source: 'infrastructure' | 'nagoya_plan' | 'population';
}

export interface FutureTimelineResult {
  ward: string;
  chochou: string;
  events: FutureEvent[];
  summary: {
    totalEvents: number;
    avgPriceImpactPct: number;
    bestYear: number;
    bestYearImpact: number;
  };
}

interface InfraProject {
  project: string;
  type: string;
  status: string;
  opening_estimate: string;
  primary_cities: string[];
  impact_cities: string[];
  peak_uplift_pct: number;
  notes: string;
}

function loadInfrastructure(): InfraProject[] {
  const filePath = resolve(__dirname, '../../data/aichi/future_infrastructure.json');
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, 'utf-8')) as InfraProject[];
}

function parseEstimateYear(est: string): number {
  const match = est.match(/(\d{4})/);
  if (match) return parseInt(match[1], 10);
  if (est.includes('2030')) return 2032;
  return 2030;
}

function infraToEvents(projects: InfraProject[], ward: string): FutureEvent[] {
  const events: FutureEvent[] = [];
  const wardCity = `名古屋市${ward}`;
  for (const p of projects) {
    const relevant =
      p.primary_cities.includes(wardCity) || p.impact_cities.includes(wardCity);
    if (!relevant) continue;
    const isPrimary = p.primary_cities.includes(wardCity);
    const impactMult = isPrimary ? 1.0 : 0.5;
    events.push({
      year: parseEstimateYear(p.opening_estimate),
      project: p.project,
      type: p.type,
      status: p.status,
      ward,
      expectedImpact: {
        priceChangePct: Math.round(p.peak_uplift_pct * impactMult * 10) / 10,
        demandChangePct: Math.round(p.peak_uplift_pct * impactMult * 0.8 * 10) / 10,
      },
      description: p.notes,
      source: 'infrastructure',
    });
  }
  return events;
}

function nagoyaPlanToEvents(plans: NagoyaPlan[], ward: string, chochou: string): FutureEvent[] {
  const events: FutureEvent[] = [];
  for (const p of plans) {
    const relevant =
      p.ward === ward ||
      p.affectedChochou.some((c) => c === chochou || chochou.startsWith(c.replace(/[一二三四五六七八九十]丁目$/, '')));
    if (!relevant) continue;
    events.push({
      year: p.completionYear,
      project: p.project,
      type: p.type,
      status: p.status,
      ward: p.ward,
      expectedImpact: {
        priceChangePct: p.expectedPriceImpactPct,
        demandChangePct: p.expectedDemandImpactPct,
      },
      description: p.description,
      source: 'nagoya_plan',
    });
  }
  return events;
}

const NAGOYA_POP_PROJECTION: Record<number, { pop: number; changePct: number }> = {
  2025: { pop: 2_320_000, changePct: -0.5 },
  2030: { pop: 2_280_000, changePct: -1.7 },
  2035: { pop: 2_230_000, changePct: -2.2 },
  2040: { pop: 2_170_000, changePct: -2.7 },
  2045: { pop: 2_100_000, changePct: -3.2 },
  2050: { pop: 2_020_000, changePct: -3.8 },
};

function populationEvents(): FutureEvent[] {
  return Object.entries(NAGOYA_POP_PROJECTION).map(([yearStr, d]) => ({
    year: parseInt(yearStr, 10),
    project: `名古屋市 将来推計人口 ${d.pop.toLocaleString()}人`,
    type: 'population',
    status: 'projection',
    ward: null,
    expectedImpact: {
      priceChangePct: Math.round(d.changePct * 0.4 * 10) / 10,
      demandChangePct: d.changePct,
    },
    description: `社人研推計ベース。2020年比 ${d.changePct}% 変動`,
    source: 'population' as const,
  }));
}

export function getFutureTimeline(ward: string, chochou: string): FutureTimelineResult {
  const infra = loadInfrastructure();
  const plans = loadNagoyaPlans();

  const infraEvents = infraToEvents(infra, ward);
  const planEvents = nagoyaPlanToEvents(plans, ward, chochou);
  const popEvents = populationEvents();

  const allEvents = [...infraEvents, ...planEvents, ...popEvents].sort(
    (a, b) => a.year - b.year,
  );

  const byYear = new Map<number, number>();
  for (const e of allEvents) {
    const cur = byYear.get(e.year) ?? 0;
    byYear.set(e.year, cur + e.expectedImpact.priceChangePct);
  }

  let bestYear = 2025;
  let bestImpact = -Infinity;
  for (const [y, impact] of byYear) {
    if (impact > bestImpact) {
      bestImpact = impact;
      bestYear = y;
    }
  }

  const priceImpacts = allEvents
    .filter((e) => e.source !== 'population')
    .map((e) => e.expectedImpact.priceChangePct);
  const avgPriceImpact =
    priceImpacts.length > 0
      ? Math.round((priceImpacts.reduce((a, b) => a + b, 0) / priceImpacts.length) * 10) / 10
      : 0;

  return {
    ward,
    chochou,
    events: allEvents,
    summary: {
      totalEvents: allEvents.length,
      avgPriceImpactPct: avgPriceImpact,
      bestYear,
      bestYearImpact: Math.round(bestImpact * 10) / 10,
    },
  };
}
