import type { HumanFlowMetrics } from '../schemas.js';
import type { HumanFlowRecord } from '../data-loaders/types.js';

export function computeHumanFlowMetrics(records: HumanFlowRecord[]): HumanFlowMetrics {
  if (records.length === 0) {
    return {
      weekdayAvgFlow: 0,
      weekendAvgFlow: 0,
      avgStayMinutes: 0,
      flowTrend: 'stable',
      peakHour: 'N/A',
    };
  }

  const weekdayAvgFlow = Math.round(
    records.reduce((s, r) => s + r.weekday_avg_flow, 0) / records.length,
  );
  const weekendAvgFlow = Math.round(
    records.reduce((s, r) => s + r.weekend_avg_flow, 0) / records.length,
  );
  const avgStayMinutes = Math.round(
    records.reduce((s, r) => s + r.avg_stay_minutes, 0) / records.length,
  );

  const trendCounts = { increasing: 0, stable: 0, decreasing: 0 };
  for (const r of records) trendCounts[r.flow_trend]++;
  const flowTrend = (
    Object.entries(trendCounts) as [(typeof records)[0]['flow_trend'], number][]
  ).sort((a, b) => b[1] - a[1])[0][0];

  const peakHour = records[0]?.peak_hour ?? '12:00-13:00';

  return { weekdayAvgFlow, weekendAvgFlow, avgStayMinutes, flowTrend, peakHour };
}

export function computeRealDemandScore(flow: HumanFlowMetrics, propertyType: string): number {
  let base = 0;

  if (propertyType === 'commercial' || propertyType === 'office') {
    base = Math.min(50, flow.weekdayAvgFlow / 3000);
    base += Math.min(20, flow.avgStayMinutes / 10);
    if (propertyType === 'commercial') {
      base += Math.min(15, flow.weekendAvgFlow / 5000);
    }
  } else if (propertyType === 'residential') {
    base = Math.min(30, flow.weekendAvgFlow / 2000);
    base += Math.min(20, flow.avgStayMinutes / 15);
    base += flow.flowTrend === 'increasing' ? 15 : flow.flowTrend === 'stable' ? 8 : 0;
  } else {
    base = Math.min(40, (flow.weekdayAvgFlow + flow.weekendAvgFlow) / 8000);
    base += Math.min(15, flow.avgStayMinutes / 12);
  }

  if (flow.flowTrend === 'increasing') base += 10;
  else if (flow.flowTrend === 'decreasing') base -= 10;

  return Math.round(Math.max(0, Math.min(100, base)));
}

export function computeVacancyRiskScore(flow: HumanFlowMetrics, propertyType: string): number {
  if (propertyType === 'residential') {
    if (flow.weekendAvgFlow > 30000) return 15;
    if (flow.weekendAvgFlow > 10000) return 30;
    return 55;
  }

  const avgFlow = (flow.weekdayAvgFlow + flow.weekendAvgFlow) / 2;
  if (avgFlow > 80000) return 10;
  if (avgFlow > 30000) return 25;
  if (avgFlow > 10000) return 45;
  return 70;
}
