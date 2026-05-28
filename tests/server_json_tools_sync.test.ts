import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('server.json tools vs MCP runtime', () => {
  it('server.json tools has no duplicates', () => {
    const root = resolve(import.meta.dirname, '..');
    const raw = readFileSync(resolve(root, 'server.json'), 'utf-8');
    const { tools } = JSON.parse(raw) as { tools: string[] };
    expect(new Set(tools).size).toBe(tools.length);
  });

  it(
    'matches createServer() registered tool names (set equality)',
    { timeout: 15000 },
    async () => {
      const root = resolve(import.meta.dirname, '..');
      const raw = readFileSync(resolve(root, 'server.json'), 'utf-8');
      const { tools: listed } = JSON.parse(raw) as { tools: string[] };

      const { createServer } = await import('../src/server.js');
      const server = createServer();
      const reg = (server as unknown as { _registeredTools?: Record<string, unknown> })
        ._registeredTools;
      expect(reg).toBeDefined();
      expect(typeof reg).toBe('object');
      const registered = Object.keys(reg!).sort((a, b) => a.localeCompare(b));
      const fromJson = [...listed].sort((a, b) => a.localeCompare(b));
      expect(registered).toEqual(fromJson);
    },
  );
});
