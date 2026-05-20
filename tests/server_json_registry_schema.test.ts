import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('server.json registry constraints', () => {
  it('description is at most 100 characters', () => {
    const root = resolve(import.meta.dirname, '..');
    const raw = readFileSync(resolve(root, 'server.json'), 'utf-8');
    const { description } = JSON.parse(raw) as { description: string };
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(100);
  });

  it('has registry package identifier and version', () => {
    const root = resolve(import.meta.dirname, '..');
    const raw = readFileSync(resolve(root, 'server.json'), 'utf-8');
    const json = JSON.parse(raw) as {
      version: string;
      packages: Array<{ registryType: string; identifier: string; version: string }>;
    };
    expect(json.version).toBeTruthy();
    expect(json.packages[0]?.registryType).toBe('npm');
    expect(json.packages[0]?.identifier).toBe('@sugukuru/japan-real-estate-intel-mcp');
    expect(json.packages[0]?.version).toBe(json.version);
  });
});
