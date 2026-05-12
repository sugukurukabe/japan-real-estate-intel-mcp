import { describe, it, expect, vi } from 'vitest';
import { discoverOpportunities, scoreOpportunity } from '../src/analysis/opportunity.js';
import { discoverOpportunitiesTool } from '../src/tools/discover_opportunities.js';
import type { OpportunityDataProvider, CityMetrics } from '../src/analysis/opportunity_provider.js';
import {
  DiscoverOpportunitiesInput,
  DiscoverOpportunitiesOutput,
  OpportunityCard,
} from '../src/schemas.js';
import { createServer } from '../src/server.js';

describe('Opportunity Radar', () => {
  describe('scoreOpportunity (exported for testing)', () => {
    it('returns a number between 0 and 100', () => {
      const result = discoverOpportunities(
        DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 3 }),
      );
      for (const card of result.cards) {
        expect(card.score).toBeGreaterThanOrEqual(0);
        expect(card.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('discoverOpportunities', () => {
    it('returns valid output for Aichi investment goal', () => {
      const input = DiscoverOpportunitiesInput.parse({
        prefecture: '愛知県',
        goal: 'investment',
        horizon: '3y',
        riskTolerance: 'medium',
        budgetLevel: 'any',
        limit: 5,
        includeMarkdown: true,
      });
      const result = discoverOpportunities(input);

      expect(result.summary).toContain('愛知県');
      expect(result.cards.length).toBeLessThanOrEqual(5);
      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.dataCoverage.prefecture).toBe('愛知県');
      expect(result.dataCoverage.citiesScanned).toBeGreaterThan(0);
      expect(result.nextActions.length).toBeGreaterThan(0);
      expect(result.markdownReport).toBeDefined();
    });

    it('validates output against Zod schema', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '東京都', goal: 'store', limit: 3 });
      const result = discoverOpportunities(input);
      const parsed = DiscoverOpportunitiesOutput.parse(result);
      expect(parsed.cards.length).toBeLessThanOrEqual(3);
    });

    it('ranks cards by score descending', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 10 });
      const result = discoverOpportunities(input);
      for (let i = 1; i < result.cards.length; i++) {
        expect(result.cards[i - 1].score).toBeGreaterThanOrEqual(result.cards[i].score);
      }
    });

    it('every card has required fields', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '大阪府', goal: 'family', limit: 5 });
      const result = discoverOpportunities(input);
      for (const card of result.cards) {
        expect(card.title).toBeTruthy();
        expect(card.city).toBeTruthy();
        expect(card.why.length).toBeGreaterThan(0);
        expect(card.risks.length).toBeGreaterThan(0);
        expect(card.recommendedTools.length).toBeGreaterThan(0);
        expect(card.signalType).toBeTruthy();
        OpportunityCard.parse(card);
      }
    });

    it('respects budgetLevel filter', () => {
      const input = DiscoverOpportunitiesInput.parse({
        prefecture: '愛知県',
        goal: 'investment',
        budgetLevel: 'low',
        limit: 10,
      });
      const result = discoverOpportunities(input);
      for (const card of result.cards) {
        if (card.evidence.pricePerSqm != null) {
          expect(card.evidence.pricePerSqm).toBeLessThan(150000);
        }
      }
    });

    it('reports missing data in dataCoverage', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '北海道', goal: 'office', limit: 3 });
      const result = discoverOpportunities(input);
      expect(result.dataCoverage.availableMetrics.length + result.dataCoverage.missingMetrics.length).toBeGreaterThan(0);
    });

    it('different goals produce different recommended tools', () => {
      const inv = discoverOpportunities(
        DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 1 }),
      );
      const store = discoverOpportunities(
        DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'store', limit: 1 }),
      );
      if (inv.cards.length > 0 && store.cards.length > 0) {
        expect(inv.cards[0].recommendedTools).not.toEqual(store.cards[0].recommendedTools);
      }
    });

    it('omits markdownReport when includeMarkdown is false', () => {
      const input = DiscoverOpportunitiesInput.parse({
        prefecture: '愛知県',
        goal: 'investment',
        limit: 3,
        includeMarkdown: false,
      });
      const result = discoverOpportunities(input);
      expect(result.markdownReport).toBeUndefined();
    });
  });

  describe('uiActions (v6.5.1)', () => {
    it('every card has uiActions with 4 elements', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 3 });
      const result = discoverOpportunities(input);
      for (const card of result.cards) {
        expect(card.uiActions).toHaveLength(4);
        for (const action of card.uiActions) {
          expect(action.label).toBeTruthy();
          expect(action.tool).toBeTruthy();
          expect(action.args).toBeDefined();
        }
      }
    });

    it('uiActions reference valid tool names', () => {
      const validTools = [
        'cross_analyze_real_estate_market', 'scenario_what_if',
        'generate_area_report', 'open_dashboard',
      ];
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'store', limit: 1 });
      const result = discoverOpportunities(input);
      for (const card of result.cards) {
        for (const action of card.uiActions) {
          expect(validTools).toContain(action.tool);
        }
      }
    });
  });

  describe('attribution (v6.5.1)', () => {
    it('output includes attribution string', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 1 });
      const result = discoverOpportunities(input);
      expect(result.attribution).toBeTruthy();
      expect(result.attribution).toContain('国土交通省');
    });

    it('DiscoverOpportunitiesOutput Zod parse passes with attribution', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 1 });
      const result = discoverOpportunities(input);
      expect(() => DiscoverOpportunitiesOutput.parse(result)).not.toThrow();
    });
  });

  describe('freshTransactionSignal (v6.5.1)', () => {
    it('freshTransactionSignal is null when includeExternalFreshness is false (default)', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '愛知県', goal: 'investment', limit: 3 });
      const result = discoverOpportunities(input);
      for (const card of result.cards) {
        expect(card.evidence.freshTransactionSignal).toBeNull();
      }
    });

    it('null freshTransactionSignal passes Zod parse', () => {
      const input = DiscoverOpportunitiesInput.parse({ prefecture: '東京都', goal: 'store', limit: 2 });
      const result = discoverOpportunities(input);
      const parsed = DiscoverOpportunitiesOutput.parse(result);
      for (const card of parsed.cards) {
        expect(card.evidence.freshTransactionSignal === null || card.evidence.freshTransactionSignal === undefined).toBe(true);
      }
    });

    it('includeExternalFreshness=false does not trigger external fetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const input = DiscoverOpportunitiesInput.parse({
        prefecture: '愛知県',
        goal: 'investment',
        limit: 1,
        includeExternalFreshness: false,
      });
      await discoverOpportunitiesTool(input);
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('OpportunityDataProvider injection (v6.5.1)', () => {
    it('accepts a mock provider and uses its data', async () => {
      const mockProvider: OpportunityDataProvider = {
        sourceLabel: 'MockProvider',
        getCities: () => ['テスト市', 'サンプル区'],
        getAllRawData: () => ({
          landPrices: [
            { year: 2025, city: 'テスト市', district: '中央', address: '中央1', land_use: '住宅地', price_per_sqm: 200000, change_rate: 3.5, lat: 35, lng: 137 },
            { year: 2025, city: 'サンプル区', district: '北部', address: '北部1', land_use: '商業地', price_per_sqm: 350000, change_rate: -1.2, lat: 35.1, lng: 137.1 },
          ],
          population: [
            { city: 'テスト市', population_2020: 100000, population_2025: 105000, households_2020: 40000, households_2025: 42000, density_per_sqkm: 5000, aging_rate: 22 },
            { city: 'サンプル区', population_2020: 50000, population_2025: 48000, households_2020: 20000, households_2025: 19000, density_per_sqkm: 3000, aging_rate: 32 },
          ],
          humanFlow: [], education: [], corporate: [], transport: [],
          commercial: [], medical: [], crime: [], earthquake: [],
        }),
        getCityMetrics: (_prefKey: string, city: string) => ({
          city,
          avgPricePerSqm: city === 'テスト市' ? 200000 : 350000,
          avgChangeRate: city === 'テスト市' ? 3.5 : -1.2,
          population: city === 'テスト市'
            ? { city: 'テスト市', population_2020: 100000, population_2025: 105000, households_2020: 40000, households_2025: 42000, density_per_sqkm: 5000, aging_rate: 22 }
            : { city: 'サンプル区', population_2020: 50000, population_2025: 48000, households_2020: 20000, households_2025: 19000, density_per_sqkm: 3000, aging_rate: 32 },
          humanFlow: null, education: null, corporate: null,
          transport: null, commercial: null, medical: null,
          crime: null, earthquake: null,
        }),
      };

      const input = DiscoverOpportunitiesInput.parse({
        prefecture: '愛知県',
        goal: 'investment',
        limit: 5,
      });
      const result = await discoverOpportunitiesTool(input, { provider: mockProvider });

      expect(result.cards.length).toBeLessThanOrEqual(2);
      const cities = result.cards.map(c => c.city);
      expect(cities).toContain('テスト市');
      expect(result.dataCoverage.citiesScanned).toBe(2);
      expect(() => DiscoverOpportunitiesOutput.parse(result)).not.toThrow();
    });
  });

  describe('MCP tool registration', () => {
    it('discover_opportunities tool is registered', () => {
      const server = createServer();
      const tools = (server as unknown as {
        _registeredTools: Map<string, unknown> | Record<string, unknown>;
      })._registeredTools;

      if (tools instanceof Map) {
        expect(tools.has('discover_opportunities')).toBe(true);
      } else if (tools && typeof tools === 'object') {
        expect(Object.prototype.hasOwnProperty.call(tools, 'discover_opportunities')).toBe(true);
      }
    });

    it('opportunity_radar prompt is registered', () => {
      const server = createServer();
      const prompts = (server as unknown as {
        _registeredPrompts: Map<string, unknown> | Record<string, unknown>;
      })._registeredPrompts;

      if (prompts instanceof Map) {
        expect(prompts.has('opportunity_radar')).toBe(true);
      } else if (prompts && typeof prompts === 'object') {
        expect(Object.prototype.hasOwnProperty.call(prompts, 'opportunity_radar')).toBe(true);
      }
    });
  });

  describe('UI integration', () => {
    it('dashboard HTML contains analysis buttons', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const html = readFileSync(resolve(import.meta.dirname ?? '.', '..', 'ui', 'dashboard.html'), 'utf-8');
      expect(html).toContain('btn-analyze');
      expect(html).toContain('btn-generate-report');
      expect(html).toContain('scenario-panel');
    });

    it('dashboard HTML contains radar chart infrastructure', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const html = readFileSync(resolve(import.meta.dirname ?? '.', '..', 'ui', 'dashboard.html'), 'utf-8');
      expect(html).toContain('comparison-section');
      expect(html).toContain('pref-a');
    });

    it('dashboard HTML contains price triangulation panel (v6.15.0)', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const html = readFileSync(resolve(import.meta.dirname ?? '.', '..', 'ui', 'dashboard.html'), 'utf-8');
      expect(html).toContain('price-triangle-panel');
    });
  });

  describe('discount_arbitrage signal (v6.15.0)', () => {
    it('OpportunitySignalType includes discount_arbitrage', async () => {
      const { OpportunitySignalType } = await import('../src/schemas.js');
      expect(OpportunitySignalType.options).toContain('discount_arbitrage');
    });

    it('SIGNAL_TITLES has discount_arbitrage label', async () => {
      const { SIGNAL_TITLES } = await import('../src/analysis/opportunity.js');
      expect(SIGNAL_TITLES['discount_arbitrage']).toBeTruthy();
    });
  });
});
