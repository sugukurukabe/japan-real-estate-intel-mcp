import { describe, it, expect } from 'vitest';
import { isToolAllowed, isResourceAllowed, getTierDisplayInfo, TIER_CONFIG } from '../src/tiers.js';

describe('Tiering', () => {
  describe('isToolAllowed', () => {
    it('free tier allows free tools', () => {
      expect(isToolAllowed('free', 'search')).toBe(true);
      expect(isToolAllowed('free', 'cross_analyze_real_estate_market')).toBe(true);
    });

    it('free tier blocks pro-only tools', () => {
      expect(isToolAllowed('free', 'generate_area_report')).toBe(false);
      expect(isToolAllowed('free', 'analyze_renovation_yield')).toBe(false);
      expect(isToolAllowed('free', 'generate_contract_support_package')).toBe(false);
    });

    it('pro tier allows all listed pro tools', () => {
      expect(isToolAllowed('pro', 'generate_area_report')).toBe(true);
      expect(isToolAllowed('pro', 'analyze_renovation_yield')).toBe(true);
      expect(isToolAllowed('pro', 'generate_contract_support_package')).toBe(true);
      expect(isToolAllowed('pro', 'assess_contract_risk')).toBe(true);
    });

    it('enterprise tier allows everything', () => {
      expect(isToolAllowed('enterprise', 'search')).toBe(true);
      expect(isToolAllowed('enterprise', 'generate_area_report')).toBe(true);
      expect(isToolAllowed('enterprise', 'some_future_tool')).toBe(true);
    });
  });

  describe('isResourceAllowed', () => {
    it('free tier allows free resources', () => {
      expect(isResourceAllowed('free', 'realestate://land-price/aichi/名古屋市中区')).toBe(true);
    });

    it('free tier blocks UI resources', () => {
      expect(isResourceAllowed('free', 'ui://japan-real-estate-intel/dashboard')).toBe(false);
    });

    it('pro tier allows UI resources', () => {
      expect(isResourceAllowed('pro', 'ui://japan-real-estate-intel/dashboard')).toBe(true);
    });
  });

  describe('getTierDisplayInfo', () => {
    it('returns correct names and prices', () => {
      expect(getTierDisplayInfo('free')).toEqual({ name: 'Free', nameJa: '無料', priceJpy: 0 });
      expect(getTierDisplayInfo('pro')).toEqual({ name: 'Pro', nameJa: 'プロ', priceJpy: 5000 });
      expect(getTierDisplayInfo('enterprise')).toEqual({
        name: 'Enterprise',
        nameJa: 'エンタープライズ',
        priceJpy: null,
      });
    });
  });

  describe('TIER_CONFIG consistency', () => {
    it('pro tier includes all free tools', () => {
      for (const tool of TIER_CONFIG.free.tools) {
        expect(TIER_CONFIG.pro.tools).toContain(tool);
      }
    });

    it('enterprise has empty arrays (all-access)', () => {
      expect(TIER_CONFIG.enterprise.tools).toEqual([]);
      expect(TIER_CONFIG.enterprise.resources).toEqual([]);
      expect(TIER_CONFIG.enterprise.prompts).toEqual([]);
    });
  });
});
