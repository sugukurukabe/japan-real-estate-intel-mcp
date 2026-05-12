import { describe, expect, it } from 'vitest';
import { getRealEstateMacroSnapshotTool } from '../src/tools/get_real_estate_macro_snapshot.js';

describe('get_real_estate_macro_snapshot tool', () => {
  it('returns structuredContent with core keys (no external series)', async () => {
    const { structuredContent } = await getRealEstateMacroSnapshotTool({
      prefecture: '愛知県',
      includeExternalSeries: false,
    });
    expect(structuredContent.prefectureKey).toBe('aichi');
    expect(structuredContent.landPrice).toBeDefined();
    expect(structuredContent.transactions.years.length).toBeGreaterThan(0);
    expect(structuredContent.externalWarnings).toEqual([]);
  });
});
