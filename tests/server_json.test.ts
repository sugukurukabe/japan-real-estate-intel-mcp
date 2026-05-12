import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('server.json schema validity', () => {
  const raw = readFileSync(resolve(import.meta.dirname, '..', 'server.json'), 'utf-8');
  const json = JSON.parse(raw);

  it('parses as valid JSON', () => {
    expect(json).toBeDefined();
  });

  it('has required name field in reverse-DNS format', () => {
    expect(json.name).toMatch(/^[a-z]+\.[a-z-]+\/[a-z-]+$/);
  });

  it('has description', () => {
    expect(typeof json.description).toBe('string');
    expect(json.description.length).toBeGreaterThan(20);
  });

  it('has version_detail.version matching semver', () => {
    expect(json.version_detail?.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('has at least one package', () => {
    expect(Array.isArray(json.packages)).toBe(true);
    expect(json.packages.length).toBeGreaterThanOrEqual(1);
    expect(json.packages[0].registry_name).toBe('npm');
    expect(json.packages[0].name).toBeTruthy();
  });

  it('has at least one remote', () => {
    expect(Array.isArray(json.remotes)).toBe(true);
    expect(json.remotes.length).toBeGreaterThanOrEqual(1);
    expect(json.remotes[0].transport_type).toBe('streamable-http');
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
