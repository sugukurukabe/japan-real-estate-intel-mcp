import type {
  DiscoverOpportunitiesInput,
  DiscoverOpportunitiesOutput,
  OpportunityCard,
  OpportunitySignalType,
  OpportunityUiAction,
  FreshTransactionSignal,
} from '../schemas.js';
import type { OpportunityDataProvider, CityMetrics } from '../analysis/opportunity_provider.js';
import { LocalCsvProvider } from '../analysis/opportunity_provider.js';
import { tryFetchMlitFreshness } from '../analysis/external_freshness.js';
import type { FreshSignalMap } from '../analysis/external_freshness.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { generateNarrativeBatch, isGeminiAvailable } from '../analysis/gemini_narrative.js';
import {
  scoreCity,
  detectSignal,
  buildWhyReasons,
  buildRisks,
  computeRiskComponent,
  computeTransportComponent,
  budgetFilter,
  SIGNAL_TITLES,
  recommendedToolsForGoal,
} from '../analysis/opportunity.js';

export interface DiscoverOpportunitiesDeps {
  provider?: OpportunityDataProvider;
}

function buildUiActions(city: string, goal: string): OpportunityUiAction[] {
  return [
    { label: '深掘り', tool: 'cross_analyze_real_estate_market', args: { area: city } },
    { label: 'What-if', tool: 'scenario_what_if', args: { area: city } },
    { label: 'レポート', tool: 'generate_area_report', args: { area: city } },
    { label: '地図', tool: 'open_dashboard', args: { area: city, mode: 'map' } },
  ];
}

export async function discoverOpportunitiesTool(
  input: DiscoverOpportunitiesInput,
  deps?: DiscoverOpportunitiesDeps,
): Promise<DiscoverOpportunitiesOutput> {
  const provider = deps?.provider ?? new LocalCsvProvider();
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);

  const cities = provider.getCities(prefKey);
  const rawData = provider.getAllRawData(prefKey);

  const allMetrics = cities.map((city) => provider.getCityMetrics(prefKey, city));

  const available: string[] = [];
  const missing: string[] = [];
  for (const [name, data] of Object.entries(rawData)) {
    (Array.isArray(data) && data.length > 0 ? available : missing).push(name);
  }

  let freshSignals: FreshSignalMap | null = null;
  if (input.includeExternalFreshness) {
    const historicalPrices = new Map<string, number>();
    for (const m of allMetrics) {
      if (m.avgPricePerSqm != null) {
        historicalPrices.set(m.city, m.avgPricePerSqm);
      }
    }
    freshSignals = await tryFetchMlitFreshness(prefKey, historicalPrices);

    if (freshSignals) {
      available.push('mlit_fresh');
    } else {
      missing.push('mlit_fresh');
    }
  }

  const filtered = allMetrics.filter((m) => budgetFilter(m, input.budgetLevel));
  const scored = filtered.map((m) => ({
    metrics: m,
    score: scoreCity(m, allMetrics, input.goal),
    signal: detectSignal(m, allMetrics, input.goal),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topN = scored.slice(0, input.limit);

  const cards: OpportunityCard[] = topN.map(({ metrics: m, score, signal }) => {
    const fresh: FreshTransactionSignal | undefined =
      freshSignals && freshSignals[m.city] ? freshSignals[m.city] : undefined;

    return {
      title: `${SIGNAL_TITLES[signal]}：${m.city}`,
      city: m.city,
      score,
      signalType: signal,
      why: buildWhyReasons(m, signal),
      evidence: {
        pricePerSqm: m.avgPricePerSqm != null ? Math.round(m.avgPricePerSqm) : null,
        priceChangeRate: m.avgChangeRate != null ? Math.round(m.avgChangeRate * 10) / 10 : null,
        riskScore: m.earthquake ? Math.round(computeRiskComponent(m)) : null,
        humanFlowWeekday: m.humanFlow ? Math.round(m.humanFlow.weekdayAvg) : null,
        humanFlowTrend: m.humanFlow?.trend ?? null,
        educationScore: m.education ? Math.round(m.education.avgScore) : null,
        corporateCount: m.corporate?.totalEstablishments ?? null,
        transportScore: m.transport ? Math.round(computeTransportComponent(m)) : null,
        commercialFacilities: m.commercial?.count ?? null,
        medicalFacilities: m.medical?.count ?? null,
        population: m.population?.population_2025 ?? null,
        agingRate: m.population?.aging_rate ?? null,
        freshTransactionSignal: fresh ?? null,
      },
      risks: buildRisks(m),
      recommendedTools: recommendedToolsForGoal(input.goal),
      uiActions: buildUiActions(m.city, input.goal),
    };
  });

  // Gemini narrative enrichment (opt-in)
  if (input.useGeminiNarrative && isGeminiAvailable()) {
    const narratives = await generateNarrativeBatch(cards, input.goal, prefDisplay);
    for (const card of cards) {
      const n = narratives.get(card.city);
      if (n) {
        card.creativeAngle = n.creativeAngle;
        card.userQuestionSuggestions = n.userQuestionSuggestions;
      }
    }
  }

  const goalLabel: Record<string, string> = {
    investment: '投資',
    store: '出店',
    family: '居住',
    office: 'オフィス',
    development: '開発',
  };

  const summary = `${prefDisplay}の${cities.length}市区町村を${goalLabel[input.goal] ?? input.goal}目的でスキャンし、上位${cards.length}件の機会を検出しました。`;

  const nextActions = [
    `上位エリアを cross_analyze_real_estate_market で詳細分析`,
    `scenario_what_if でリスクシナリオを試算`,
    `generate_area_report でレポート出力`,
  ];

  let markdownReport: string | undefined;
  if (input.includeMarkdown) {
    const lines = [
      `# Opportunity Radar: ${prefDisplay}`,
      '',
      `**目的**: ${goalLabel[input.goal] ?? input.goal}`,
      `**対象**: ${cities.length}市区町村`,
      '',
      '## 発見された機会',
      '',
    ];
    for (const card of cards) {
      lines.push(`### ${card.title} (スコア: ${card.score}/100)`);
      lines.push('');
      lines.push('**根拠:**');
      for (const w of card.why) lines.push(`- ${w}`);
      if (card.evidence.freshTransactionSignal) {
        const f = card.evidence.freshTransactionSignal;
        lines.push(
          `- 最新MLIT取引: ㎡${f.medianPricePerSqm.toLocaleString()}円 (履歴比 ${f.deltaVsHistorical > 0 ? '+' : ''}${f.deltaVsHistorical}%)`,
        );
      }
      if (card.creativeAngle) {
        lines.push(`> ${card.creativeAngle}`);
        lines.push('');
      }
      lines.push('**リスク:**');
      for (const r of card.risks) lines.push(`- ${r}`);
      if (card.userQuestionSuggestions?.length) {
        lines.push('');
        lines.push('**次の質問:**');
        for (const q of card.userQuestionSuggestions) lines.push(`- ${q}`);
      }
      lines.push('');
    }
    lines.push('## データカバレッジ', '');
    lines.push(`利用可能: ${available.join(', ')}`);
    if (missing.length > 0) lines.push(`未取得: ${missing.join(', ')}`);
    lines.push('', `---`, `出典: ${ATTRIBUTION}`);
    markdownReport = lines.join('\n');
  }

  return {
    summary,
    cards,
    dataCoverage: {
      prefecture: prefDisplay,
      citiesScanned: cities.length,
      availableMetrics: available,
      missingMetrics: missing,
    },
    nextActions,
    attribution: ATTRIBUTION,
    markdownReport,
  };
}
