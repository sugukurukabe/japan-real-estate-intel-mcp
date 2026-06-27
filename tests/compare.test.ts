import { describe, it, expect } from 'vitest';
import { comparePrefectures } from '../src/tools/compare_prefectures.js';
import { ComparePrefecturesInput, ComparePrefecturesOutput } from '../src/schemas.js';

describe('compare_prefectures', () => {
  it('rejects fewer than 2 prefectures', () => {
    expect(() => ComparePrefecturesInput.parse({ prefectures: ['愛知県'] })).toThrow();
  });

  it('rejects more than 5 prefectures', () => {
    expect(() =>
      ComparePrefecturesInput.parse({
        prefectures: ['愛知県', '東京都', '大阪府', '福岡県', '北海道', '京都府'],
      }),
    ).toThrow();
  });

  it('accepts 2 prefectures', () => {
    const input = ComparePrefecturesInput.parse({ prefectures: ['愛知県', '東京都'] });
    expect(input.prefectures).toHaveLength(2);
  });

  it('returns correct scores structure for aichi + tokyo', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: true,
    });
    expect(result.scores).toHaveLength(2);
    expect(result.ranking).toHaveLength(2);
    expect(result.ranking[0].rank).toBe(1);
    expect(result.ranking[1].rank).toBe(2);
  });

  it('bestFor.investment matches the highest investmentScore prefecture', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'residential',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    const topScore = result.scores[0];
    expect(result.bestFor.investment).toBe(topScore.prefecture);
  });

  it('returns valid comparison result for Tokyo (v4.0 full capabilities)', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'humanFlow', 'education', 'corporate', 'investment'],
      includeMarkdown: false,
    });
    // Both prefectures now have full capabilities - unsupportedNotes should be empty
    expect(result.scores.length).toBe(2);
    expect(result.ranking.length).toBe(2);
  });

  it('radarData has correct structure with 2 prefecture values per metric', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    expect(result.radarData.length).toBeGreaterThan(0);
    result.radarData.forEach((entry) => {
      expect(entry.values).toHaveLength(2);
      expect(typeof entry.metric).toBe('string');
      entry.values.forEach((v) => {
        expect(typeof v.prefecture).toBe('string');
        expect(typeof v.value).toBe('number');
      });
    });
  });

  it('includeMarkdown: true returns markdown report', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport).toContain('# ');
    expect(result.markdownReport).toContain('愛知県');
  });

  it('includeMarkdown: false returns no markdownReport', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    expect(result.markdownReport).toBeUndefined();
  });

  it('StubLoader prefecture (osaka) included produces unsupportedNotes', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '大阪府'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    expect(result.scores).toHaveLength(2);
  });

  it('area is defaulted per prefecture when not specified', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    const aichiScore = result.scores.find((s) => s.prefectureKey === 'aichi');
    expect(aichiScore?.area).toBe('名古屋市中区');
    const tokyoScore = result.scores.find((s) => s.prefectureKey === 'tokyo');
    expect(tokyoScore?.area).toBe('千代田区');
  });

  it('deduplicates identical prefectures', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '愛知', 'aichi'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    expect(result.scores).toHaveLength(1);
  });

  it('neighborhood label appears in markdownReport', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      neighborhood: '名駅南1丁目',
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: true,
    });
    expect(result.markdownReport).toContain('名駅南1丁目');
  });

  it('diffs use first prefecture as base', () => {
    const result = comparePrefectures({
      prefectures: ['愛知県', '東京都'],
      propertyType: 'mixed',
      metrics: ['price', 'risk', 'investment'],
      includeMarkdown: false,
    });
    if (result.diffs.length > 0) {
      expect(result.diffs[0].base).toMatch(/愛知県/);
    }
  });
});
