import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgVersion: string = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
).version;

type RegisteredTool = { annotations?: Record<string, unknown>; description?: string };

function registeredToolEntries(
  reg: Map<string, RegisteredTool> | Record<string, RegisteredTool>,
): [string, RegisteredTool][] {
  return reg instanceof Map ? [...reg.entries()] : Object.entries(reg);
}

describe('tool annotations', () => {
  it('all tools have readOnlyHint: true', async () => {
    const server = createServer();

    const listResult = (server as unknown as {
      _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
    })._registeredTools;

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

    const listResult = (server as unknown as {
      _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
    })._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      expect(
        (tool.annotations as Record<string, unknown>)?.destructiveHint,
        `Tool "${name}" should have destructiveHint: false`,
      ).toBe(false);
    }
  });

  it('all tools have openWorldHint: false', async () => {
    const server = createServer();

    const listResult = (server as unknown as {
      _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
    })._registeredTools;

    for (const [name, tool] of registeredToolEntries(listResult)) {
      expect(
        (tool.annotations as Record<string, unknown>)?.openWorldHint,
        `Tool "${name}" should have openWorldHint: false`,
      ).toBe(false);
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
    const tools = (server as unknown as {
      _registeredTools: Map<string, unknown> | Record<string, unknown>;
    })._registeredTools;

    const keys = tools instanceof Map ? [...tools.keys()] : Object.keys(tools);
    expect(keys).toContain('search');
    expect(keys).toContain('fetch');
  });

  it('tool descriptions are bilingual (EN | JP)', async () => {
    const server = createServer();

    const listResult = (server as unknown as {
      _registeredTools: Map<string, RegisteredTool> | Record<string, RegisteredTool>;
    })._registeredTools;

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
