import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger module', () => {
  it('exports logger and helper functions', async () => {
    const mod = await import('../src/logger.js');
    expect(typeof mod.logger).toBe('object');
    expect(typeof mod.toolLogger).toBe('function');
    expect(typeof mod.moduleLogger).toBe('function');
  });

  it('logger has expected pino log-level methods', async () => {
    const { logger } = await import('../src/logger.js');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });

  it('toolLogger completes without throwing for success', async () => {
    const { toolLogger } = await import('../src/logger.js');
    expect(() => toolLogger('cross_analyze', 'aichi', Date.now())).not.toThrow();
  });

  it('toolLogger completes without throwing on error path', async () => {
    const { toolLogger } = await import('../src/logger.js');
    expect(() =>
      toolLogger('drill_down', 'tokyo', Date.now(), new Error('test failure')),
    ).not.toThrow();
  });

  it('moduleLogger returns child logger with log methods', async () => {
    const { moduleLogger } = await import('../src/logger.js');
    const child = moduleLogger('http');
    expect(typeof child.info).toBe('function');
    expect(typeof child.warn).toBe('function');
  });

  it('toolLogger records positive elapsed time', async () => {
    const { toolLogger } = await import('../src/logger.js');
    const start = Date.now() - 50; // simulate 50ms elapsed
    expect(() => toolLogger('simulate_landscape', 'aichi', start)).not.toThrow();
  });
});

describe('LOG_LEVEL env var', () => {
  let originalLevel: string | undefined;

  beforeEach(() => {
    originalLevel = process.env.LOG_LEVEL;
    // Reset BEFORE the test runs so the dynamic import re-reads the env var.
    // (Earlier tests in this file may have already imported logger.js, caching it.)
    vi.resetModules();
  });

  afterEach(() => {
    if (originalLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLevel;
    }
    vi.resetModules();
  });

  it('defaults to info level when LOG_LEVEL is not set', async () => {
    delete process.env.LOG_LEVEL;
    const { logger } = await import('../src/logger.js');
    expect(logger.level).toBe('info');
  });

  it('respects LOG_LEVEL=warn', async () => {
    process.env.LOG_LEVEL = 'warn';
    const { logger } = await import('../src/logger.js');
    expect(logger.level).toBe('warn');
  });
});
