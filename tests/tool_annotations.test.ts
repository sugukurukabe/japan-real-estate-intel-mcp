import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgVersion: string = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
).version;

type RegisteredTool = {
  title?: string;
  annotations?: Record<string, unknown>;
  description?: string;
};

// Tools that legitimately cross the trust boundary to third-party/government
// services (Google Maps, Gemini, MLIT, e-Stat, FRED) and must therefore
// declare openWorldHint: true. Every other tool operates only on the bundled
// local dataset and must declare openWorldHint: false.
const OPEN_WORLD_TOOLS = new Set([
  'assess_exterior_visuals',
  'analyze_commute_accessibility',
  'discover_opportunities',
  'composite_value_score',
  'get_real_estate_macro_snapshot',
  'detect_arbitrage_signals',
]);

// Tools that persist a generated file via saveArtifactAndLink() (src/artifacts.ts)
// mint a fresh artifact ID/resource_link on every call, even with identical
// arguments — so idempotentHint must be false rather than the default true.
const NON_IDEMPOTENT_ARTIFACT_TOOLS = new Set([
  'generate_area_report',
  'compare_prefectures',
  'portfolio_optimizer',
  'generate_contract_support_package',
  'assess_contract_risk',
]);

function registeredToolEntries(
  reg: Map<string, RegisteredTool> | Record<string, RegisteredTool>,
): [string, RegisteredTool][] {
  return reg instanceof Map ? [...reg.entries()] : Object.entries(reg);
}

describe('tool annotations', () => {
  it('all tools have readOnlyHint: true', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    const entries = registeredToolEntries(listResult);
    expect(entries.length).toBeGreaterThanOrEqual(16);
    for (const [name, tool] of entries) {
      expect(tool.annotations, `Tool "${name}" should have annotations`).toBeDefined();
      expect(
        (tool.annotations as Record<string, unknown>)?.readOnlyHint,
        `Tool "${name}" should have readOnlyHint: true`,
      ).toBe(true);
    }
  });

  it('all tools have destructiveHint: false', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      expect(
        (tool.annotations as Record<string, unknown>)?.destructiveHint,
        `Tool "${name}" should have destructiveHint: false`,
      ).toBe(false);
    }
  });

  it('openWorldHint is true only for tools that call third-party/government APIs', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      const expected = OPEN_WORLD_TOOLS.has(name);
      expect(
        (tool.annotations as Record<string, unknown>)?.openWorldHint,
        `Tool "${name}" should have openWorldHint: ${expected}`,
      ).toBe(expected);
    }
  });

  it('idempotentHint is false only for tools that persist a new artifact on every call', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      const expected = !NON_IDEMPOTENT_ARTIFACT_TOOLS.has(name);
      expect(
        (tool.annotations as Record<string, unknown>)?.idempotentHint,
        `Tool "${name}" should have idempotentHint: ${expected}`,
      ).toBe(expected);
    }
  });

  it('every tool has a human-readable title (required for the Claude directory)', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    const entries = registeredToolEntries(listResult);
    expect(entries.length).toBeGreaterThanOrEqual(16);
    for (const [name, tool] of entries) {
      expect(typeof tool.title, `Tool "${name}" should have a string title`).toBe('string');
      expect(tool.title!.length, `Tool "${name}" title should be non-empty`).toBeGreaterThan(0);
    }
  });

  it(`server version matches package.json (${pkgVersion})`, () => {
    const server = createServer();
    const info = (server as unknown as { _serverInfo?: { version: string } })._serverInfo;
    if (info) {
      expect(info.version).toBe(pkgVersion);
    }
  });

  it('search and fetch tools are registered', async () => {
    const server = createServer();
    const tools = (
      server as unknown as {
        _registeredTools: Map<string, unknown> | Record<string, unknown>;
      }
    )._registeredTools;

    const keys = tools instanceof Map ? [...tools.keys()] : Object.keys(tools);
    expect(keys).toContain('search');
    expect(keys).toContain('fetch');
  });

  it('tool descriptions are bilingual (EN | JP)', async () => {
    const server = createServer();

    const listResult = (
      server as unknown as {
        _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
      }
    )._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      if (tool.description) {
        expect(
          tool.description.includes(' | '),
          `Tool "${name}" description should be bilingual (EN | JP): "${tool.description.slice(0, 60)}..."`,
        ).toBe(true);
      }
    }
  });
});
