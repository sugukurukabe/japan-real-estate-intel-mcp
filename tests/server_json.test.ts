import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('server.json schema validity', () => {
  const raw = readFileSync(resolve(import.meta.dirname, '..', 'server.json'), 'utf-8');
  const json = JSON.parse(raw) as {
    name: string;
    description: string;
    version: string;
    packages: Array<{
      registryType: string;
      identifier: string;
      version: string;
      transport: { type: string };
    }>;
    remotes: Array<{ type: string; url: string }>;
    tools: string[];
    repository?: { url: string };
  };

  it('parses as valid JSON', () => {
    expect(json).toBeDefined();
  });

  it('has required name field (Registry 2025-12-11)', () => {
    expect(json.name).toMatch(/^io\.github\.[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  it('has description', () => {
    expect(typeof json.description).toBe('string');
    expect(json.description.length).toBeGreaterThan(20);
    expect(json.description.length).toBeLessThanOrEqual(100);
  });

  it('has top-level version matching semver', () => {
    expect(json.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('has at least one package', () => {
    expect(Array.isArray(json.packages)).toBe(true);
    expect(json.packages.length).toBeGreaterThanOrEqual(1);
    expect(json.packages[0].registryType).toBe('npm');
    expect(json.packages[0].identifier).toBe('@sugukuru/japan-real-estate-intel-mcp');
    expect(json.packages[0].transport.type).toBe('stdio');
  });

  it('has at least one remote', () => {
    expect(Array.isArray(json.remotes)).toBe(true);
    expect(json.remotes.length).toBeGreaterThanOrEqual(1);
    expect(json.remotes[0].type).toBe('streamable-http');
    expect(json.remotes[0].url).toMatch(/^https:\/\//);
  });

  it('tools array lists known tools', () => {
    expect(Array.isArray(json.tools)).toBe(true);
    expect(json.tools.length).toBeGreaterThanOrEqual(16);
    expect(json.tools).toContain('cross_analyze_real_estate_market');
    expect(json.tools).toContain('search');
    expect(json.tools).toContain('fetch');
  });

  it('has repository field', () => {
    expect(json.repository?.url).toMatch(/github\.com/);
  });
});
