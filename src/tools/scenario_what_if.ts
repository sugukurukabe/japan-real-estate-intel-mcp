import type { ScenarioWhatIfInput, ScenarioWhatIfOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import { crossAnalyze } from './cross_analyze_real_estate_market.js';

interface ScenarioEffect {
  priceImpactPct: number;
  humanFlowImpactPct: number | null;
  riskImpactPct: number;
  investmentScoreDelta: number;
  label: string;
}

const SCENARIO_EFFECTS: Record<string, Record<string, ScenarioEffect>> = {
  new_commercial_facility: {
    small: {
      priceImpactPct: 2.5,
      humanFlowImpactPct: 8,
      riskImpactPct: 0,
      investmentScoreDelta: 3,
      label: '小規模商業施設の新規開業',
    },
    medium: {
      priceImpactPct: 6.0,
      humanFlowImpactPct: 18,
      riskImpactPct: 0,
      investmentScoreDelta: 7,
      label: '中規模ショッピングセンター開業',
    },
    large: {
      priceImpactPct: 12.0,
      humanFlowImpactPct: 35,
      riskImpactPct: -2,
      investmentScoreDelta: 12,
      label: '大型商業施設（ショッピングモール）開業',
    },
  },
  new_station: {
    small: {
      priceImpactPct: 5.0,
      humanFlowImpactPct: 15,
      riskImpactPct: 0,
      investmentScoreDelta: 5,
      label: '新駅設置（バス停・LRT）',
    },
    medium: {
      priceImpactPct: 10.0,
      humanFlowImpactPct: 25,
      riskImpactPct: 0,
      investmentScoreDelta: 10,
      label: '新駅設置（私鉄）',
    },
    large: {
      priceImpactPct: 18.0,
      humanFlowImpactPct: 40,
      riskImpactPct: -2,
      investmentScoreDelta: 18,
      label: '新駅設置（JR・地下鉄）',
    },
  },
  new_corporate_office: {
    small: {
      priceImpactPct: 2.0,
      humanFlowImpactPct: 5,
      riskImpactPct: 0,
      investmentScoreDelta: 3,
      label: '中小企業オフィス新設',
    },
    medium: {
      priceImpactPct: 4.5,
      humanFlowImpactPct: 10,
      riskImpactPct: 0,
      investmentScoreDelta: 6,
      label: '大企業支社・拠点新設',
    },
    large: {
      priceImpactPct: 9.0,
      humanFlowImpactPct: 22,
      riskImpactPct: -1,
      investmentScoreDelta: 11,
      label: '大規模オフィスビル・本社誘致',
    },
  },
  population_growth: {
    small: {
      priceImpactPct: 1.5,
      humanFlowImpactPct: 3,
      riskImpactPct: 0,
      investmentScoreDelta: 2,
      label: '緩やかな人口増加（+2%）',
    },
    medium: {
      priceImpactPct: 4.0,
      humanFlowImpactPct: 8,
      riskImpactPct: 0,
      investmentScoreDelta: 5,
      label: '堅調な人口増加（+5%）',
    },
    large: {
      priceImpactPct: 8.0,
      humanFlowImpactPct: 15,
      riskImpactPct: -2,
      investmentScoreDelta: 10,
      label: '急成長（+10%・大規模流入）',
    },
  },
  population_decline: {
    small: {
      priceImpactPct: -2.0,
      humanFlowImpactPct: -4,
      riskImpactPct: 3,
      investmentScoreDelta: -3,
      label: '緩やかな人口減少（-2%）',
    },
    medium: {
      priceImpactPct: -5.0,
      humanFlowImpactPct: -10,
      riskImpactPct: 7,
      investmentScoreDelta: -8,
      label: '中程度の人口減少（-5%）',
    },
    large: {
      priceImpactPct: -12.0,
      humanFlowImpactPct: -20,
      riskImpactPct: 15,
      investmentScoreDelta: -18,
      label: '急激な人口流出（-10%以上）',
    },
  },
  disaster_risk_increase: {
    small: {
      priceImpactPct: -3.0,
      humanFlowImpactPct: null,
      riskImpactPct: 10,
      investmentScoreDelta: -5,
      label: '軽微な災害リスク上昇（洪水ハザード見直し）',
    },
    medium: {
      priceImpactPct: -7.0,
      humanFlowImpactPct: null,
      riskImpactPct: 20,
      investmentScoreDelta: -12,
      label: '中程度の災害リスク増大（震度想定見直し）',
    },
    large: {
      priceImpactPct: -15.0,
      humanFlowImpactPct: null,
      riskImpactPct: 35,
      investmentScoreDelta: -25,
      label: '大規模災害リスク（直下型地震想定区域指定）',
    },
  },
  disaster_risk_decrease: {
    small: {
      priceImpactPct: 1.5,
      humanFlowImpactPct: null,
      riskImpactPct: -5,
      investmentScoreDelta: 3,
      label: '軽微なリスク低減（堤防整備）',
    },
    medium: {
      priceImpactPct: 3.5,
      humanFlowImpactPct: null,
      riskImpactPct: -12,
      investmentScoreDelta: 7,
      label: '中程度リスク低減（大規模治水事業）',
    },
    large: {
      priceImpactPct: 8.0,
      humanFlowImpactPct: null,
      riskImpactPct: -25,
      investmentScoreDelta: 15,
      label: '大幅リスク軽減（地区防災計画・耐震化完了）',
    },
  },
};

function horizonMultiplier(horizon: string): number {
  return horizon === '1y' ? 0.4 : horizon === '3y' ? 0.8 : 1.0;
}

export function scenarioWhatIf(input: ScenarioWhatIfInput): ScenarioWhatIfOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const cap = loader.capabilities;

  const baseAnalysis = crossAnalyze({
    prefecture: input.prefecture,
    area: input.city,
    propertyType: 'mixed',
    timeRange: '3y',
    includeRisk: true,
    includeHumanFlow: cap?.humanFlow ?? false,
    includeEducation: false,
    includeCorporate: false,
    output_mode: 'detailed',
    includeTransport: false,
    includeCommercial: false,
    includeMedical: false,
  });

  type SM = {
    pricePerSqm: number | null;
    humanFlowScore: number | null;
    investmentScore: number;
    riskScore: number;
  };
  const baseline: SM = {
    pricePerSqm: baseAnalysis.priceTrend.current,
    humanFlowScore: baseAnalysis.humanFlow
      ? Math.round((baseAnalysis.humanFlow.weekdayAvgFlow / 10000) * 10)
      : null,
    investmentScore: baseAnalysis.investmentScore,
    riskScore: baseAnalysis.riskScore,
  };

  const effect = SCENARIO_EFFECTS[input.scenario]?.[input.scale] ?? {
    priceImpactPct: 0,
    humanFlowImpactPct: null,
    riskImpactPct: 0,
    investmentScoreDelta: 0,
    label: input.scenario,
  };
  const mult = horizonMultiplier(input.horizon);
  const scaledPrice = effect.priceImpactPct * mult;
  const scaledHF = effect.humanFlowImpactPct !== null ? effect.humanFlowImpactPct * mult : null;
  const scaledRisk = effect.riskImpactPct * mult;
  const scaledIS = effect.investmentScoreDelta * mult;

  const projected: SM = {
    pricePerSqm:
      baseline.pricePerSqm !== null
        ? Math.round(baseline.pricePerSqm * (1 + scaledPrice / 100))
        : null,
    humanFlowScore:
      baseline.humanFlowScore !== null && scaledHF !== null
        ? Math.min(100, Math.max(0, Math.round(baseline.humanFlowScore * (1 + scaledHF / 100))))
        : baseline.humanFlowScore,
    investmentScore: Math.min(100, Math.max(0, Math.round(baseline.investmentScore + scaledIS))),
    riskScore: Math.min(100, Math.max(0, Math.round(baseline.riskScore + scaledRisk))),
  };

  const confidence: 'high' | 'medium' | 'low' = effect.priceImpactPct !== 0 ? 'medium' : 'low';

  const opportunities = buildOpportunities(input.scenario, input.scale, scaledPrice);
  const risks = buildRisks(input.scenario, input.scale, scaledPrice);
  const recommendations = buildRecommendations(
    input.scenario,
    scaledPrice,
    baseline.investmentScore,
  );

  let markdownReport: string | undefined;
  if (input.includeMarkdown) {
    markdownReport = buildMarkdown({
      input,
      effect,
      baseline,
      projected,
      scaledPrice,
      scaledRisk,
      scaledHF,
      confidence,
      opportunities,
      risks,
      recommendations,
    });
  }

  return {
    prefecture: input.prefecture,
    city: input.city,
    scenario: effect.label,
    scale: input.scale,
    horizon: input.horizon,
    baseline,
    projected,
    priceImpactPct: Math.round(scaledPrice * 100) / 100,
    humanFlowImpactPct: scaledHF !== null ? Math.round(scaledHF * 100) / 100 : null,
    riskImpactPct: Math.round(scaledRisk * 100) / 100,
    confidence,
    keyOpportunities: opportunities,
    keyRisks: risks,
    recommendations,
    markdownReport,
  };
}

function buildOpportunities(scenario: string, scale: string, priceDelta: number): string[] {
  const map: Record<string, string[]> = {
    new_commercial_facility: [
      '来街者増加による小売・飲食需要拡大',
      '周辺地価上昇による資産価値向上',
      '賃貸需要増加（住居・店舗）',
    ],
    new_station: [
      '通勤利便性向上による居住需要増加',
      'バス・タクシー等二次交通の整備促進',
      '駅前開発による商業集積機会',
    ],
    new_corporate_office: [
      'オフィス需要増加',
      '従業員向け住宅・商業需要拡大',
      '法人税収増加による行政サービス向上',
    ],
    population_growth: [
      '住宅・教育施設への旺盛な需要',
      '小売業・飲食業の市場拡大',
      '長期的な地価上昇基調',
    ],
    population_decline: ['底値取得の機会（逆張り投資）', 'リノベーション・コンバージョン需要'],
    disaster_risk_increase: ['防災投資・耐震工事需要', '安全エリアへの移転コンサル需要'],
    disaster_risk_decrease: [
      '保険・融資条件の改善',
      '再開発・土地活用の障壁低減',
      '居住・商業需要の回帰',
    ],
  };
  const list = map[scenario] ?? ['市場環境の変化機会'];
  if (priceDelta > 5) list.push('早期取得による含み益拡大の機会');
  return list.slice(0, 4);
}

function buildRisks(scenario: string, scale: string, priceDelta: number): string[] {
  const map: Record<string, string[]> = {
    new_commercial_facility: ['既存商業地との競合による共倒れリスク', '開業後の集客低迷リスク'],
    new_station: ['工事期間中の騒音・交通規制リスク', '整備後の地価調整（期待先行の反動）'],
    new_corporate_office: ['景気悪化時の撤退・縮小リスク', 'オフィス過剰供給リスク'],
    population_growth: ['インフラ・学校不足リスク', '過熱による投資コスト上昇'],
    population_decline: [
      '空き家増加・街の空洞化',
      '税収減による公共サービス低下',
      '流動性低下による出口戦略の困難化',
    ],
    disaster_risk_increase: [
      '保険料上昇・融資条件悪化',
      '住宅・商業地の長期的価値低下',
      'テナント・居住者の転出',
    ],
    disaster_risk_decrease: ['投資が過熱する可能性（バブル）'],
  };
  const list = map[scenario] ?? ['市場環境変化に伴う不確実性'];
  if (scale === 'large' && priceDelta > 0) list.push('投機的取引の増加による価格変動リスク');
  return list.slice(0, 4);
}

function buildRecommendations(scenario: string, priceDelta: number, baseIS: number): string[] {
  const recs: string[] = [];
  if (priceDelta > 5) recs.push('計画確定前の早期物件取得検討を推奨');
  if (priceDelta < -5) recs.push('取得タイミングを慎重に精査し、底値確認後の投資を検討');
  if (baseIS < 50)
    recs.push('ベーススコアが低いため、シナリオ実現時の追加デューデリジェンスを推奨');
  recs.push('公示地価・路線価の改定タイミングで再評価を推奨');
  recs.push('地域の都市計画・マスタープランを定期的にモニタリング');
  return recs;
}

type SM = {
  pricePerSqm: number | null;
  humanFlowScore: number | null;
  investmentScore: number;
  riskScore: number;
};

function buildMarkdown(opts: {
  input: ScenarioWhatIfInput;
  effect: ScenarioEffect;
  baseline: SM;
  projected: SM;
  scaledPrice: number;
  scaledRisk: number;
  scaledHF: number | null;
  confidence: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}): string {
  const {
    input,
    effect,
    baseline,
    projected,
    scaledPrice,
    scaledRisk,
    scaledHF,
    confidence,
    opportunities,
    risks,
    recommendations,
  } = opts;
  const confLabel = confidence === 'high' ? '高' : confidence === 'medium' ? '中' : '低';
  const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '→');

  const lines = [
    `# What-If シナリオ分析レポート — ${input.city}`,
    '',
    `**都道府県**: ${input.prefecture} | **シナリオ**: ${effect.label} | **規模**: ${input.scale} | **期間**: ${input.horizon}`,
    '',
    `## シナリオ概要`,
    `${effect.label}が実現した場合の ${input.horizon} 後の影響を試算します。`,
    '',
    `## 指標比較（現状 vs シナリオ後）`,
    '| 指標 | 現状 | シナリオ後 | 変化 |',
    '|---|---|---|---|',
    `| 地価（円/㎡） | ${baseline.pricePerSqm?.toLocaleString() ?? 'N/A'} | ${projected.pricePerSqm?.toLocaleString() ?? 'N/A'} | ${arrow(scaledPrice)} ${Math.abs(scaledPrice).toFixed(1)}% |`,
    `| 投資スコア | ${baseline.investmentScore} | ${projected.investmentScore} | ${arrow(projected.investmentScore - baseline.investmentScore)} |`,
    `| リスクスコア | ${baseline.riskScore} | ${projected.riskScore} | ${arrow(scaledRisk)} |`,
    ...(baseline.humanFlowScore !== null && scaledHF !== null
      ? [
          `| 人流スコア | ${baseline.humanFlowScore} | ${projected.humanFlowScore ?? 'N/A'} | ${arrow(scaledHF)} ${Math.abs(scaledHF).toFixed(1)}% |`,
        ]
      : []),
    '',
    `**予測信頼度**: ${confLabel}`,
    '',
    `## 投資機会`,
    ...opportunities.map((o) => `- ${o}`),
    '',
    `## 留意リスク`,
    ...risks.map((r) => `- ${r}`),
    '',
    `## 推奨アクション`,
    ...recommendations.map((r) => `- ${r}`),
    '',
    `> ※本試算は定性的なシナリオモデルに基づく参考値です。実際の影響は地域条件・政策・市場環境により大きく異なる場合があります。`,
  ];
  return lines.join('\n');
}
