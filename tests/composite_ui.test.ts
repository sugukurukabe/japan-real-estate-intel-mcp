import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';
import { CompositeValueScoreInput } from '../src/schemas.js';

describe('composite_value_score UI integration', () => {
  it('tool composite_value_score is registered', () => {
    const server = createServer();
    const tools = (
      server as unknown as {
        _registeredTools: Map<string, unknown> | Record<string, unknown>;
      }
    )._registeredTools;

    const keys = tools instanceof Map ? [...tools.keys()] : Object.keys(tools);
    expect(keys).toContain('composite_value_score');
  });

  it('prompt composite_value_report is registered', () => {
    const server = createServer();
    const prompts = (
      server as unknown as {
        _registeredPrompts: Map<string, unknown> | Record<string, unknown>;
      }
    )._registeredPrompts;

    const keys = prompts instanceof Map ? [...prompts.keys()] : Object.keys(prompts ?? {});
    expect(keys).toContain('composite_value_report');
  });

  it('schema accepts valid input', () => {
    const result = CompositeValueScoreInput.safeParse({
      prefecture: '愛知県',
      area: '名古屋市中区',
      horizon: '3y',
      includeNarrative: true,
      includeMarkdown: true,
    });
    expect(result.success).toBe(true);
  });

  it('schema applies defaults', () => {
    const result = CompositeValueScoreInput.parse({
      area: '名古屋市中区',
    });
    expect(result.prefecture).toBe('愛知県');
    expect(result.horizon).toBe('3y');
    expect(result.includeNarrative).toBe(true);
    expect(result.includeMarkdown).toBe(true);
  });

  it('schema rejects invalid horizon', () => {
    const result = CompositeValueScoreInput.safeParse({
      area: '名古屋市中区',
      horizon: '10y',
    });
    expect(result.success).toBe(false);
  });

  it('computeCompositeValueScore includes rosenka citation in axes (v6.15.0)', async () => {
    const { computeCompositeValueScore } = await import('../src/analysis/composite_value.js');
    const result = computeCompositeValueScore('aichi', '名古屋市中区');
    const landAxis = result.axes.find((a) => a.axis === 'landPrice');
    if (landAxis) {
      expect(landAxis.evidence).toContain('路線価');
    }
  });
});
