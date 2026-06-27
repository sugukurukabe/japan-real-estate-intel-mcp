import { describe, expect, it } from 'vitest';
import {
  buildMacroSnapshotCore,
  cityMatches,
  computeLandPriceYoY,
  computePopulationDeclineAvg,
  computeTransactionRecentSummary,
  median,
} from '../src/analysis/macro_snapshot.js';
import { getLoader } from '../src/data-loaders/index.js';

describe('macro_snapshot', () => {
  it('median', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBeNull();
  });

  it('cityMatches', () => {
    expect(cityMatches('名古屋市中区', '名古屋')).toBe(true);
    expect(cityMatches('名古屋市中区', undefined)).toBe(true);
    expect(cityMatches('名古屋市中区', '豊田市')).toBe(false);
  });

  it('buildMacroSnapshotCore for aichi returns plausible land price years', () => {
    const core = buildMacroSnapshotCore(getLoader('aichi'));
    expect(core.landPrice.latestYear).not.toBeNull();
    expect(core.landPrice.rowsLatestYear).toBeGreaterThan(0);
    expect(core.transactions.years.length).toBeGreaterThan(0);
    expect(core.population.municipalityCount).toBeGreaterThan(0);
    expect(core.population.avgDecline2050).not.toBeNull();
  });

  it('city filter narrows transactions', () => {
    const all = computeTransactionRecentSummary(
      getLoader('aichi').getTransactions(),
      undefined,
      10,
    );
    const narrow = computeTransactionRecentSummary(
      getLoader('aichi').getTransactions(),
      '名古屋市中区',
      10,
    );
    const allCount = all.years.reduce((s, y) => s + y.count, 0);
    const narrowCount = narrow.years.reduce((s, y) => s + y.count, 0);
    expect(narrowCount).toBeLessThanOrEqual(allCount);
  });

  it('computeLandPriceYoY for filtered city', () => {
    const lp = computeLandPriceYoY(getLoader('aichi').getLandPrices(), '名古屋市中区');
    expect(lp.latestYear).not.toBeNull();
  });

  it('computePopulationDeclineAvg', () => {
    const p = computePopulationDeclineAvg(getLoader('aichi').getPopulationProjection());
    expect(p.avgDecline2050).not.toBeNull();
  });
});
