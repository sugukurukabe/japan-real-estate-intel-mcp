import { describe, expect, it } from 'vitest';
import { fetchPolicyRateFromFred } from '../src/api-client/fred_policy_rate.js';

describe('fred_policy_rate (FRED CSV proxy)', () => {
  it('parses graph CSV and returns latest vs year-ago', async () => {
    const csv = [
      'observation_date,IRSTCB01JPM156N',
      '2023-06-01,-0.1',
      '2024-06-01,0.1',
      '2025-06-01,0.5',
    ].join('\n');

    const fetchImpl = async () =>
      new Response(csv, { status: 200, headers: { 'content-type': 'text/csv' } });

    const r = await fetchPolicyRateFromFred(fetchImpl as unknown as typeof fetch);
    expect(r).not.toBeNull();
    expect(r!.latestRatePct).toBe(0.5);
    expect(r!.latestObservationDate).toBe('2025-06-01');
    expect(r!.yearAgoObservationDate).toBeTruthy();
    expect(r!.attribution).toContain('FRED');
  });

  it('returns null on empty body', async () => {
    const fetchImpl = async () => new Response('', { status: 200 });
    const r = await fetchPolicyRateFromFred(fetchImpl as unknown as typeof fetch);
    expect(r).toBeNull();
  });
});
