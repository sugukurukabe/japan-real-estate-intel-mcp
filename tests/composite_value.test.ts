import { describe, it, expect } from 'vitest';
import { computeCompositeValueScore, generateCompositeMarkdown } from '../src/analysis/composite_value.js';
import { generateCompositeFallbackNarrative } from '../src/analysis/gemini_narrative.js';

describe('composite_value_score', () => {
  it('returns score in 0-100 range for Aichi', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    expect(result.compositeScore).toBeGreaterThanOrEqual(0);
    expect(result.compositeScore).toBeLessThanOrEqual(100);
  });

  it('returns 5 axes', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    expect(result.axes).toHaveLength(5);
    const axisNames = result.axes.map(a => a.axis);
    expect(axisNames).toContain('landPrice');
    expect(axisNames).toContain('education');
    expect(axisNames).toContain('transport');
    expect(axisNames).toContain('futurePlan');
    expect(axisNames).toContain('riskSafety');
  });

  it('all axis scores are 0-100', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    for (const ax of result.axes) {
      expect(ax.score).toBeGreaterThanOrEqual(0);
      expect(ax.score).toBeLessThanOrEqual(100);
    }
  });

  it('custom weights change the result', () => {
    const defaultResult = computeCompositeValueScore('aichi', '名古屋市中区');
    const heavyLandPrice = computeCompositeValueScore('aichi', '名古屋市中区', {
      landPrice: 0.90, education: 0.025, transport: 0.025, futurePlan: 0.025, riskSafety: 0.025,
    });
    expect(heavyLandPrice.compositeScore).not.toBe(defaultResult.compositeScore);
  });

  it('tier boundaries: S >= 80, A >= 65, B >= 50, C < 50', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    const expected = result.compositeScore >= 80 ? 'S'
      : result.compositeScore >= 65 ? 'A'
      : result.compositeScore >= 50 ? 'B' : 'C';
    expect(result.tier).toBe(expected);
  });

  it('peer comparison contains cities from same prefecture', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    expect(result.peerComparison.length).toBeGreaterThan(0);
    for (const peer of result.peerComparison) {
      expect(peer.compositeScore).toBeGreaterThanOrEqual(0);
      expect(peer.compositeScore).toBeLessThanOrEqual(100);
      expect(['S', 'A', 'B', 'C']).toContain(peer.tier);
      expect(typeof peer.zScore).toBe('number');
    }
  });

  it('returns tier C and empty axes for unknown area', () => {
    const result = computeCompositeValueScore('aichi', '存在しない市');
    expect(result.tier).toBe('C');
    expect(result.compositeScore).toBe(0);
    expect(result.axes).toHaveLength(0);
  });

  it('generates markdown report', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    const md = generateCompositeMarkdown('名古屋市中区', '愛知県', result);
    expect(md).toContain('総合価値スコア');
    expect(md).toContain('名古屋市中区');
    expect(md).toContain('Tier');
    expect(md).toContain('5軸レーダー');
  });

  it('fallback narrative works without Gemini', () => {
    const narrative = generateCompositeFallbackNarrative({
      area: '名古屋市中区',
      prefecture: '愛知県',
      compositeScore: 72,
      tier: 'A',
      axes: [
        { label: '地価・成長性', score: 80, rawValue: '¥300,000/㎡' },
        { label: '教育・子育て', score: 70, rawValue: '教育スコア 70/100' },
        { label: '交通利便性', score: 85, rawValue: '12駅' },
        { label: '将来計画', score: 60, rawValue: '+2.1%' },
        { label: 'リスク・安全性', score: 55, rawValue: '地震: 6弱' },
      ],
    });
    expect(narrative).toContain('愛知県');
    expect(narrative).toContain('72/100');
    expect(narrative).toContain('強み');
    expect(narrative).toContain('注意点');
  });

  it('has attribution', () => {
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    expect(result.attribution).toBeTruthy();
    expect(typeof result.attribution).toBe('string');
  });
});
