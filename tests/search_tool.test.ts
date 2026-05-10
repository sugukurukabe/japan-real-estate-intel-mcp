import { describe, it, expect, beforeEach } from 'vitest';
import { mcpSearch } from '../src/tools/search.js';
import { searchCatalog, resetCatalog, catalogSize } from '../src/search/index.js';

describe('search tool', () => {
  beforeEach(() => {
    resetCatalog();
  });

  it('returns results for a Japanese city query', () => {
    const res = mcpSearch({ query: '名古屋' });
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results[0]).toHaveProperty('id');
    expect(res.results[0]).toHaveProperty('title');
    expect(res.results[0]).toHaveProperty('url');
  });

  it('returns results for English tool name', () => {
    const res = mcpSearch({ query: 'portfolio' });
    expect(res.results.length).toBeGreaterThan(0);
    const ids = res.results.map((r) => r.id);
    expect(ids.some((id) => id.includes('portfolio'))).toBe(true);
  });

  it('returns results for risk-related query', () => {
    const res = mcpSearch({ query: 'リスク 地震' });
    expect(res.results.length).toBeGreaterThan(0);
    const ids = res.results.map((r) => r.id);
    expect(ids.some((id) => id.includes('risk') || id.includes('assess'))).toBe(true);
  });

  it('returns results for 投資 (investment) query', () => {
    const res = mcpSearch({ query: '投資' });
    expect(res.results.length).toBeGreaterThan(0);
  });

  it('returns empty results for gibberish query', () => {
    const res = mcpSearch({ query: 'zzzqqqxxx999' });
    expect(res.results).toEqual([]);
  });

  it('respects topK limit', () => {
    const res = searchCatalog('東京', 3);
    expect(res.length).toBeLessThanOrEqual(3);
  });

  it('matches リニア to aichi future tools', () => {
    const res = mcpSearch({ query: 'リニア 新幹線' });
    expect(res.results.length).toBeGreaterThan(0);
    const ids = res.results.map((r) => r.id);
    expect(ids.some((id) => id.includes('aichi') || id.includes('simulate'))).toBe(true);
  });

  it('matches 店舗 to store location tool', () => {
    const res = mcpSearch({ query: '店舗 出店' });
    expect(res.results.length).toBeGreaterThan(0);
    const ids = res.results.map((r) => r.id);
    expect(ids.some((id) => id.includes('store'))).toBe(true);
  });

  it('catalog has a reasonable number of entries', () => {
    expect(catalogSize()).toBeGreaterThan(20);
  });

  it('result URLs are properly formatted', () => {
    const res = mcpSearch({ query: '東京' });
    for (const r of res.results) {
      expect(r.url).toMatch(/^https?:\/\/.+\/r\//);
    }
  });
});
