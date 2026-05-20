import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('cross-file version consistency', () => {
  const root = resolve(import.meta.dirname, '..');

  const pkgJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
  const serverJson = JSON.parse(readFileSync(resolve(root, 'server.json'), 'utf-8'));
  const serverTs = readFileSync(resolve(root, 'src', 'server.ts'), 'utf-8');
  const httpTs = readFileSync(resolve(root, 'src', 'http.ts'), 'utf-8');
  const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf-8');

  const version = pkgJson.version;

  it('package.json version is semver', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('server.json version matches package.json', () => {
    expect(serverJson.version).toBe(version);
  });

  it('server.json npm package version matches', () => {
    const npmPkg = serverJson.packages.find((p: { registryType: string }) => p.registryType === 'npm');
    expect(npmPkg?.version).toBe(version);
  });

  it('src/server.ts version matches package.json', () => {
    expect(serverTs).toContain(`version: '${version}'`);
  });

  it('src/http.ts health version matches package.json', () => {
    expect(httpTs).toContain(`version: '${version}'`);
  });

  it('CHANGELOG.md has entry for current version', () => {
    expect(changelog).toContain(`## [${version}]`);
  });

  it('package.json has mcpName field', () => {
    expect(pkgJson.mcpName).toBeTruthy();
  });

  it('package.json has repository field', () => {
    expect(pkgJson.repository?.url).toBeTruthy();
  });

  it('package.json has homepage field', () => {
    expect(pkgJson.homepage).toMatch(/^https:\/\//);
  });

  it('server.json tools array includes composite_value_score', () => {
    expect(serverJson.tools).toContain('composite_value_score');
  });

  it('server.json tools array includes v6.13.0 tools', () => {
    expect(serverJson.tools).toContain('get_zoning_info');
    expect(serverJson.tools).toContain('get_vacancy_stats');
    expect(serverJson.tools).toContain('get_population_outlook');
  });

  it('server.json tools array includes v6.15.0 detect_arbitrage_signals', () => {
    expect(serverJson.tools).toContain('detect_arbitrage_signals');
  });

  it('server.json tools array includes get_real_estate_macro_snapshot', () => {
    expect(serverJson.tools).toContain('get_real_estate_macro_snapshot');
  });

  it('server.json tools array matches runtime-exposed App / domain tools (33)', () => {
    expect(Array.isArray(serverJson.tools)).toBe(true);
    expect(serverJson.tools).toContain('quick_visual_summary');
    expect(serverJson.tools).toContain('review_purchase_recommendation');
    expect(serverJson.tools).toContain('simulate_leveraged_cashflow');
    expect(serverJson.tools.length).toBe(33);
  });
});
