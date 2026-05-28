import { describe, it, expect } from 'vitest';
import {
  completePrefecture,
  completeArea,
  searchAreaCandidates,
} from '../src/completion/area-completion.js';
import { createServer } from '../src/server.js';
import { isCompletable } from '@modelcontextprotocol/sdk/server/completable.js';

describe('Completion primitive', () => {
  describe('completePrefecture', () => {
    it('returns all prefectures when value is empty', () => {
      const results = completePrefecture('');
      expect(results.length).toBeGreaterThanOrEqual(10);
      expect(results).toContain('愛知県');
      expect(results).toContain('東京都');
    });

    it('filters by prefix', () => {
      const results = completePrefecture('東');
      expect(results).toContain('東京都');
      expect(results).not.toContain('愛知県');
    });

    it('handles undefined value gracefully', () => {
      const results = completePrefecture(undefined);
      expect(results.length).toBeGreaterThanOrEqual(10);
    });

    it('completes the final item in a comma-separated prefecture list', () => {
      const results = completePrefecture('東京都,大');
      expect(results).toContain('大阪府');
    });
  });

  describe('completeArea', () => {
    it('returns Aichi cities by default (no prefecture context)', () => {
      const results = completeArea('');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('名古屋市中区');
    });

    it('filters by prefix within given prefecture', () => {
      const results = completeArea('新宿', { arguments: { prefecture: '東京都' } });
      expect(results).toContain('新宿区');
      expect(results).not.toContain('千代田区');
    });

    it('returns empty for unknown prefecture', () => {
      const results = completeArea('', { arguments: { prefecture: '沖縄県' } });
      expect(results).toEqual([]);
    });

    it('matches known city reading aliases', () => {
      const results = completeArea('なごやしなかむら', { arguments: { prefecture: '愛知県' } });
      expect(results).toContain('名古屋市中村区');
    });
  });

  describe('searchAreaCandidates', () => {
    it('provides tool-call friendly area candidates', () => {
      const result = searchAreaCandidates({ prefecture: '東京都', query: 'しんじゅく' });
      expect(result.prefecture).toBe('東京都');
      expect(result.candidates).toContain('新宿区');
    });
  });

  describe('server prompt integration', () => {
    it('prompt argument schemas are completable', () => {
      const server = createServer();
      const prompts = (
        server as unknown as {
          _registeredPrompts: Record<
            string,
            {
              argsSchema?: { shape?: Record<string, unknown> };
            }
          >;
        }
      )._registeredPrompts;

      const investmentReport = prompts['investment_report'];
      expect(investmentReport).toBeDefined();
      expect(investmentReport.argsSchema).toBeDefined();

      const shape = investmentReport.argsSchema!.shape;
      expect(shape).toBeDefined();

      expect(isCompletable(shape!['prefecture'])).toBe(true);
      expect(isCompletable(shape!['area'])).toBe(true);
    });

    it('completions capability is registered', () => {
      const server = createServer();
      const lowLevel = (
        server as unknown as { server: { getCapabilities?: () => Record<string, unknown> } }
      ).server;
      if (typeof lowLevel?.getCapabilities === 'function') {
        const caps = lowLevel.getCapabilities();
        expect(caps).toHaveProperty('completions');
      }
    });

    it('search_area_candidates tool is registered for direct tool-call discovery', () => {
      const server = createServer();
      const tools = (
        server as unknown as {
          _registeredTools: Map<string, unknown> | Record<string, unknown>;
        }
      )._registeredTools;

      const hasTool =
        tools instanceof Map
          ? tools.has('search_area_candidates')
          : Object.prototype.hasOwnProperty.call(tools, 'search_area_candidates');
      expect(hasTool).toBe(true);
    });
  });
});
