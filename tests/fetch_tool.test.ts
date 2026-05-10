import { describe, it, expect } from 'vitest';
import { mcpFetch } from '../src/tools/fetch.js';

describe('fetch tool', () => {
  it('fetches area data for aichi:名古屋市中区', () => {
    const res = mcpFetch({ id: 'area:aichi:名古屋市中区' });
    expect(res.id).toBe('area:aichi:名古屋市中区');
    expect(res.title).toContain('愛知県');
    expect(res.title).toContain('名古屋市中区');
    expect(res.text).toContain('地価');
    expect(res.url).toContain('/r/');
    expect(res.metadata).toHaveProperty('source');
  });

  it('fetches prefecture overview for tokyo', () => {
    const res = mcpFetch({ id: 'pref:tokyo' });
    expect(res.id).toBe('pref:tokyo');
    expect(res.title).toContain('東京都');
    expect(res.text).toContain('地価データ');
    expect(res.metadata.prefecture).toBe('tokyo');
  });

  it('fetches tool info for cross_analyze_real_estate_market', () => {
    const res = mcpFetch({ id: 'tool:cross_analyze_real_estate_market' });
    expect(res.title).toContain('クロス分析');
    expect(res.text).toContain('cross_analyze_real_estate_market');
  });

  it('fetches tool info for portfolio_optimizer', () => {
    const res = mcpFetch({ id: 'tool:portfolio_optimizer' });
    expect(res.title).toContain('ポートフォリオ');
  });

  it('fetches data summary for land_price:aichi', () => {
    const res = mcpFetch({ id: 'data:land_price:aichi' });
    expect(res.title).toContain('愛知県');
    expect(res.title).toContain('地価');
    expect(res.text).toContain('件数');
  });

  it('fetches data summary for population:tokyo', () => {
    const res = mcpFetch({ id: 'data:population:tokyo' });
    expect(res.title).toContain('東京都');
    expect(res.title).toContain('人口');
  });

  it('fetches future simulation for aichi:linear_chuo', () => {
    const res = mcpFetch({ id: 'future:aichi:linear_chuo' });
    expect(res.id).toBe('future:aichi:linear_chuo');
    expect(res.title).toContain('愛知県');
    expect(res.metadata).toHaveProperty('scenario');
  });

  it('returns unknown for non-aichi future', () => {
    const res = mcpFetch({ id: 'future:tokyo:linear_chuo' });
    expect(res.text).toContain('愛知県のみ');
  });

  it('returns unknown for unrecognized ID prefix', () => {
    const res = mcpFetch({ id: 'bogus:xyz' });
    expect(res.title).toBe('Unknown');
    expect(res.text).toContain('not recognized');
  });

  it('returns unknown for nonexistent tool', () => {
    const res = mcpFetch({ id: 'tool:nonexistent' });
    expect(res.text).toContain('not found');
  });

  it('area fetch for tokyo works', () => {
    const res = mcpFetch({ id: 'area:tokyo:新宿区' });
    expect(res.title).toContain('東京都');
    expect(res.text).toContain('地価');
  });

  it('neighborhood fetch for aichi returns data', () => {
    const res = mcpFetch({ id: 'neighborhood:aichi:名古屋市中区:栄' });
    expect(res.id).toBe('neighborhood:aichi:名古屋市中区:栄');
    expect(res.title).toContain('名古屋市中区');
  });
});
