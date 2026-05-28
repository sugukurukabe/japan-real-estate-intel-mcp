/**
 * Policy-relevant short-term rate snapshot via FRED public CSV export.
 *
 * Series IRSTCB01JPM156N: "Immediate Rates: Less than 24 Hours: Central Bank Rates for Japan"
 * (national central bank policy-related rate; FRED sources national data).
 *
 * Not the BOJ Time-Series Search API; avoids API keys. See attribution string returned with data.
 */

const FRED_GRAPH_CSV = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=IRSTCB01JPM156N';

export interface PolicyRateSnapshot {
  seriesId: string;
  latestObservationDate: string;
  latestRatePct: number;
  yearAgoObservationDate: string;
  yearAgoRatePct: number;
  deltaPercentagePoints: number;
  sourceUrl: string;
  attribution: string;
}

function parseFredCsv(text: string): { date: string; value: number }[] {
  const lines = text.trim().split(/\r?\n/).slice(1);
  const out: { date: string; value: number }[] = [];
  for (const line of lines) {
    const i = line.indexOf(',');
    if (i === -1) continue;
    const date = line.slice(0, i).trim();
    const v = parseFloat(line.slice(i + 1).trim());
    if (!date || Number.isNaN(v)) continue;
    out.push({ date, value: v });
  }
  return out;
}

function findObservationNearOrBefore(
  rows: { date: string; value: number }[],
  targetMs: number,
): { date: string; value: number } | null {
  let best: { date: string; value: number } | null = null;
  for (const r of rows) {
    const t = Date.parse(r.date);
    if (Number.isNaN(t) || t > targetMs) continue;
    if (!best || Date.parse(best.date) < t) best = r;
  }
  return best;
}

/**
 * Latest observation and ~12-month prior observation from FRED graph CSV (no API key).
 */
export async function fetchPolicyRateFromFred(
  fetchImpl: typeof fetch = fetch,
): Promise<PolicyRateSnapshot | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetchImpl(FRED_GRAPH_CSV, {
      signal: ac.signal,
      headers: {
        'User-Agent':
          'japan-real-estate-intel-mcp/macro-snapshot (+https://github.com/sugukuru/japan-real-estate-intel-mcp)',
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseFredCsv(text);
    if (rows.length === 0) return null;
    const latest = rows[rows.length - 1]!;
    const latestMs = Date.parse(latest.date);
    if (Number.isNaN(latestMs)) return null;
    const targetMs = latestMs - 365 * 24 * 60 * 60 * 1000;
    const yearAgo = findObservationNearOrBefore(rows, targetMs);
    if (!yearAgo) return null;
    const delta = Math.round((latest.value - yearAgo.value) * 100) / 100;
    const attribution =
      '金利: FRED series IRSTCB01JPM156N (Immediate Rates: Central Bank Rates for Japan) via St. Louis Fed graph CSV export — 日本銀行公表値を再掲した系列のため投資判断は公式情報と照合してください。';
    return {
      seriesId: 'IRSTCB01JPM156N',
      latestObservationDate: latest.date,
      latestRatePct: latest.value,
      yearAgoObservationDate: yearAgo.date,
      yearAgoRatePct: yearAgo.value,
      deltaPercentagePoints: delta,
      sourceUrl: FRED_GRAPH_CSV,
      attribution,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
