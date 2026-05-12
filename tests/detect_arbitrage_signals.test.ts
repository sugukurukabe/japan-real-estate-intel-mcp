import { describe, it, expect } from 'vitest';
import { detectArbitrageSignals } from '../src/tools/detect_arbitrage_signals.js';
import { ArbitrageScanInput } from '../src/schemas.js';

describe('detect_arbitrage_signals tool (v6.15.0)', () => {
  it('ArbitrageScanInput schema parses with defaults', () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'aichi' });
    expect(input.prefecture).toBe('aichi');
    expect(input.limit).toBe(10);
    expect(input.includeLive).toBe(false);
    expect(input.output_mode).toBe('compact');
    expect(input.signalType).toBeUndefined();
  });

  it('ArbitrageScanInput validates signal type enum', () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'tokyo', signalType: 'discount' });
    expect(input.signalType).toBe('discount');
  });

  it('detectArbitrageSignals returns valid output structure', async () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'aichi', limit: 5 });
    const output = await detectArbitrageSignals(input);

    expect(output.prefecture).toContain('愛知');
    expect(typeof output.scannedCities).toBe('number');
    expect(output.scannedCities).toBeGreaterThan(0);
    expect(Array.isArray(output.items)).toBe(true);
    expect(output.items.length).toBeLessThanOrEqual(5);
    expect(output.liveDataUsed).toBe(false);
    expect(output.attribution).toBeTruthy();
  });

  it('detectArbitrageSignals items have required fields', async () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'aichi', limit: 5 });
    const output = await detectArbitrageSignals(input);

    for (const item of output.items) {
      expect(item.city).toBeTruthy();
      expect(item.rosenka).toBeGreaterThan(0);
      expect(item.koji).toBeGreaterThan(0);
      expect(item.transactionMedian).toBeGreaterThan(0);
      expect(item.rosenkaKojiRatio).toBeGreaterThan(0);
      expect(item.transactionKojiRatio).toBeGreaterThan(0);
      expect(['discount', 'inheritance_edge', 'overheated', 'fair']).toContain(item.signal);
      expect(item.interpretation.length).toBeGreaterThan(0);
    }
  });

  it('detectArbitrageSignals includes benchmark in output', async () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'aichi' });
    const output = await detectArbitrageSignals(input);

    expect(output.benchmark.nationalRosenkaKojiRatio).toBe(0.80);
    expect(output.benchmark.nationalTxKojiRatio).toBe(1.05);
  });

  it('detectArbitrageSignals markdownReport is non-empty', async () => {
    const input = ArbitrageScanInput.parse({ prefecture: 'aichi' });
    const output = await detectArbitrageSignals(input);

    expect(output.markdownReport.length).toBeGreaterThan(100);
    expect(output.markdownReport).toContain('価格トライアングル');
  });

  it('detect_arbitrage_signals tool is registered in server', async () => {
    const { createServer } = await import('../src/server.js');
    const server = createServer();
    const tools = (server as unknown as { _registeredTools: Map<string, unknown> | Record<string, unknown> })
      ._registeredTools;
    if (tools instanceof Map) {
      expect(tools.has('detect_arbitrage_signals')).toBe(true);
    } else {
      expect(tools && typeof tools === 'object' && 'detect_arbitrage_signals' in tools).toBe(true);
    }
  }, 15_000);
});
