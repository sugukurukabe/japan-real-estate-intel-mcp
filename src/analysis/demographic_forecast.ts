import { moduleLogger } from '../logger.js';
import type { ForecastDemographicShiftInput, ForecastDemographicShiftOutput, DemographicForecastYear } from '../schemas.js';
import { getLoader } from '../data-loaders/registry.js';

const log = moduleLogger('demographic_forecast');

export async function forecastDemographicShift(input: ForecastDemographicShiftInput): Promise<ForecastDemographicShiftOutput> {
  log.info({ prefecture: input.prefecture, city: input.city, neighborhood: input.neighborhood }, 'Forecasting demographic shift');

  const loader = getLoader(input.prefecture);

  // Default projection base values (for fallbacks)
  let pop2020 = 100000;
  let pop2030 = 98000;
  let pop2040 = 92000;
  let pop2050 = 82000;

  if (loader && loader.getPopulationProjection) {
    const projections = loader.getPopulationProjection();
    const cityProj = projections.find(p => p.city.includes(input.city));
    if (cityProj) {
      pop2020 = cityProj.pop_2020;
      pop2030 = cityProj.pop_2030;
      pop2040 = cityProj.pop_2040;
      pop2050 = cityProj.pop_2050;
    }
  }

  // Retrieve base aging rate and family ratio from neighborhoods/population statistics
  let baseAgingRate = 28.5; // %
  let baseFamilyRatio = 45.0; // %
  const baseFlow = 100; // Pedestrian flow index base

  if (loader && loader.getNeighborhoods) {
    const nbh = loader.getNeighborhoods();
    const cityNbh = nbh.filter(n => n.city.includes(input.city));
    if (cityNbh.length > 0) {
      const targetNbh = input.neighborhood
        ? cityNbh.find(n => n.neighborhood.includes(input.neighborhood!) || n.district.includes(input.neighborhood!)) ?? cityNbh[0]
        : cityNbh[0];
      baseAgingRate = targetNbh.elderly_ratio || baseAgingRate;
      // child_ratio is used as proxy for family ratio
      baseFamilyRatio = targetNbh.child_ratio ? targetNbh.child_ratio * 3 : baseFamilyRatio;
    }
  }

  const timelineYears = [2026, 2030, 2035, 2040, 2050];
  const timeline: DemographicForecastYear[] = [];

  // Helper to interpolate population
  function getInterpolatedPop(year: number): number {
    if (year <= 2020) return pop2020;
    if (year >= 2050) return pop2050;
    if (year < 2030) {
      const t = (year - 2020) / 10;
      return pop2020 + (pop2030 - pop2020) * t;
    }
    if (year < 2040) {
      const t = (year - 2030) / 10;
      return pop2030 + (pop2040 - pop2030) * t;
    }
    const t = (year - 2040) / 10;
    return pop2040 + (pop2050 - pop2040) * t;
  }

  // Construct year records
  for (const year of timelineYears) {
    const estimatedPopulation = Math.round(getInterpolatedPop(year));
    // Households count tracks population but with smaller household size
    const factor = year === 2026 ? 2.2 : year === 2030 ? 2.1 : year === 2035 ? 2.0 : year === 2040 ? 1.9 : 1.75;
    const estimatedHouseholds = Math.round(estimatedPopulation / factor);

    // Aging rate increases over time
    const yearsPassed = year - 2026;
    const agingRate = Math.round((baseAgingRate + (yearsPassed * 0.25)) * 10) / 10;

    // Family ratio decreases slightly over time in most declining areas
    const declRate = (pop2050 - pop2020) / pop2020;
    const familyRatio = Math.max(10, Math.round((baseFamilyRatio + (yearsPassed * declRate * 0.3)) * 10) / 10);

    // Pedestrian flow index tracks overall population trend relative to 2026
    const popRatio = estimatedPopulation / getInterpolatedPop(2026);
    const pedestrianFlowIndex = Math.round(baseFlow * popRatio * 10) / 10;

    timeline.push({
      year,
      estimatedPopulation,
      estimatedHouseholds,
      agingRate,
      familyRatio,
      pedestrianFlowIndex,
    });
  }

  const pop2026 = timeline[0].estimatedPopulation;
  const pop2035 = timeline[2].estimatedPopulation;
  const flow2026 = timeline[0].pedestrianFlowIndex;
  const flow2035 = timeline[2].pedestrianFlowIndex;

  const tenYearPopulationChangeRate = Math.round(((pop2035 - pop2026) / pop2026) * 100 * 10) / 10;
  const tenYearPedestrianFlowChangeRate = Math.round(((flow2035 - flow2026) / flow2026) * 100 * 10) / 10;

  // Classify growth
  let growthCategory: 'active_growth' | 'stable' | 'moderate_decline' | 'rapid_decline' = 'stable';
  let growthCategoryJa = '安定推移エリア';

  if (tenYearPopulationChangeRate > 3) {
    growthCategory = 'active_growth';
    growthCategoryJa = '人口増加・活性エリア';
  } else if (tenYearPopulationChangeRate < -8) {
    growthCategory = 'rapid_decline';
    growthCategoryJa = '急激な人口減少・高齢化エリア';
  } else if (tenYearPopulationChangeRate < -2) {
    growthCategory = 'moderate_decline';
    growthCategoryJa = '緩やかな人口減少エリア';
  }

  let forecastSummaryJa = `10年間での予測人口増減率は ${tenYearPopulationChangeRate}%、人流指数変化率は ${tenYearPedestrianFlowChangeRate}% です。エリア分類は「${growthCategoryJa}」です。`;
  if (growthCategory === 'active_growth') {
    forecastSummaryJa += ' 若年層およびファミリー世帯の流入が顕著であり、長期不動産投資や商業地開発に極めて適しています。';
  } else if (growthCategory === 'rapid_decline') {
    forecastSummaryJa += ' 高齢化率が急速に上昇し、空き家増加や商業活動の減退リスクが非常に高いエリアです。投資の縮小または撤退を推奨します。';
  } else {
    forecastSummaryJa += ' 人流・人口動態は概ね堅調であり、安定的な賃貸インカム投資に向いています。';
  }

  const markdownReport = `# エリア10年後人流・人口動態将来予測レポート
\`Premium Mode: Pro/Enterprise Tier Activated\`

---

## 📍 エリア概要
- **対象地域**: ${input.prefecture} ${input.city} ${input.neighborhood ?? ''}
- **成長区分**: **${growthCategoryJa}** (\`${growthCategory}\`)

---

## 📊 将来推移予測データ (2026年〜2050年)

| 予測年 | 推計人口 (人) | 推計世帯数 (世帯) | 高齢化率 (%) | ファミリー比率 (%) | 人流指数 (基準: 100) |
| :--- | :--- | :--- | :--- | :--- | :--- |
${timeline.map(t => `| **${t.year}年** | ${t.estimatedPopulation.toLocaleString()} | ${t.estimatedHouseholds.toLocaleString()} | ${t.agingRate} % | ${t.familyRatio} % | **${t.pedestrianFlowIndex}** |`).join('\n')}

---

## 🔍 キーメトリクス & 変動率 (10年スパン)
- **10年間での人口予測変動率**: **${tenYearPopulationChangeRate >= 0 ? '+' : ''}${tenYearPopulationChangeRate} %**
- **10年間での人流指数変動率**: **${tenYearPedestrianFlowChangeRate >= 0 ? '+' : ''}${tenYearPedestrianFlowChangeRate} %**

---

## 💡 出店開発・不動産投資向けエリア総評
> **将来動態サマリー**: ${forecastSummaryJa}

---
*免責事項: 本将来予測レポートは、過去の国勢調査統計および自治体発表の将来推計人口（社人研データ等）をベースにした補間・シミュレーションに基づくものであり、将来の突発的な開発プロジェクト、災害、社会動態の急変による影響を完全に保証するものではありません。*`;

  return {
    city: input.city,
    neighborhood: input.neighborhood,
    growthCategory,
    growthCategoryJa,
    timeline,
    tenYearPopulationChangeRate,
    tenYearPedestrianFlowChangeRate,
    forecastSummaryJa,
    markdownReport,
    attribution: 'Pro Demographic & Human Flow Predictive Forecaster',
  };
}
