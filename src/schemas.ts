import { z } from 'zod';

const prefectureField = z.string().default('愛知県').describe('都道府県名（和名/英名/ISO 3166-2 コード対応）');
const neighborhoodField = z.string().optional().describe("町丁目（例: '名駅南1丁目'）。v2.4 では町丁目レベル実データに対応（対応都道府県のみ）");

/**
 * 共通出力モードフィールド。compact = TL;DR + 主要数値のみ、detailed = 全文Markdown付き
 */
export const outputModeField = z
  .enum(['compact', 'detailed'])
  .optional()
  .default('compact')
  .describe('Output verbosity. compact=TL;DR + key numbers only (default), detailed=full Markdown report | 出力詳細度。compact=主要数値のみ（デフォルト）、detailed=全文レポート付き');

/**
 * ツール結果にTL;DR行を付与するヘルパー。
 * compact モードでは Markdown 本文を短縮し先頭にサマリー行を追加する。
 */
export function withCompactOutput(
  text: string,
  tldr: string,
  mode: 'compact' | 'detailed' = 'compact',
): string {
  if (mode === 'detailed') return text;
  return `**${tldr}**\n\n${text}`;
}

// ── cross_analyze_real_estate_market (v2.0 unified) ──

export const CrossAnalyzeInput = z.object({
  prefecture: prefectureField,
  area: z.string().describe("エリア（例: '名古屋市中村区', '世田谷区'）"),
  neighborhood: neighborhoodField,
  propertyType: z.enum(['residential', 'commercial', 'logistics', 'office', 'mixed']),
  timeRange: z.enum(['1y', '3y', '5y']),
  includeRisk: z.boolean().default(true).describe('災害リスクを考慮するか'),
  includeHumanFlow: z.boolean().default(true).describe('人流データを含むか（対応都道府県のみ）'),
  includeEducation: z.boolean().default(false).describe('教育環境データを含むか（対応都道府県のみ）'),
  includeCorporate: z.boolean().default(false).describe('企業立地データを含むか（対応都道府県のみ）'),
  includeTransport: z.boolean().default(false).describe('交通利便性データを含むか（対応都道府県のみ）'),
  includeCommercial: z.boolean().default(false).describe('商業施設データを含むか（対応都道府県のみ）'),
  includeMedical: z.boolean().default(false).describe('医療・福祉施設データを含むか（対応都道府県のみ）'),
  focusMetrics: z
    .array(z.enum(['price_trend', 'yield', 'demand_supply', 'risk_score']))
    .optional(),
  output_mode: outputModeField,
});
export type CrossAnalyzeInput = z.infer<typeof CrossAnalyzeInput>;

export const PriceTrend = z.object({
  current: z.number().describe('現在の平均価格（万円/㎡）'),
  changeRate: z.number().describe('変化率（%）'),
  forecast: z.string().describe('簡易予測テキスト'),
});
export type PriceTrend = z.infer<typeof PriceTrend>;

export const ChartsData = z.object({
  priceHistory: z.array(z.object({ year: z.number(), price: z.number() })).optional(),
  riskBreakdown: z
    .array(z.object({ category: z.string(), score: z.number() }))
    .optional(),
  demandSupply: z
    .object({ demand: z.number(), supply: z.number() })
    .optional(),
});
export type ChartsData = z.infer<typeof ChartsData>;

export const HumanFlowMetrics = z.object({
  weekdayAvgFlow: z.number().describe('平日平均人流（人/日）'),
  weekendAvgFlow: z.number().describe('休日平均人流（人/日）'),
  avgStayMinutes: z.number().describe('平均滞在時間（分）'),
  flowTrend: z.enum(['increasing', 'stable', 'decreasing']),
  peakHour: z.string().describe('ピーク時間帯'),
});
export type HumanFlowMetrics = z.infer<typeof HumanFlowMetrics>;

export const CrossAnalyzeOutput = z.object({
  summary: z.string(),
  priceTrend: PriceTrend,
  riskScore: z.number().min(0).max(100),
  investmentScore: z.number().min(0).max(100),
  keyInsights: z.array(z.string()),
  charts: ChartsData,
  humanFlow: HumanFlowMetrics.optional(),
  realDemandScore: z.number().min(0).max(100).optional(),
  vacancyRiskScore: z.number().min(0).max(100).optional(),
  educationSummary: z.object({ avgScore: z.number(), topSchool: z.string() }).optional(),
  corporateSummary: z.object({ totalEstablishments: z.number(), majorCount: z.number() }).optional(),
  transportSummary: z.object({ totalDailyPassengers: z.number(), stationCount: z.number(), transportScore: z.number() }).optional(),
  commercialSummary: z.object({ facilityCountByType: z.record(z.number()), totalGFA: z.number() }).optional(),
  medicalSummary: z.object({ facilityCount: z.number(), hospitalCount: z.number(), totalBeds: z.number() }).optional(),
  neighborhoodDetail: z.object({
    neighborhood: z.string(),
    population: z.number(),
    households: z.number(),
    popDensity: z.number(),
    avgAge: z.number(),
    childRatio: z.number(),
    elderlyRatio: z.number(),
    daytimePopRatio: z.number(),
  }).optional(),
});
export type CrossAnalyzeOutput = z.infer<typeof CrossAnalyzeOutput>;

// ── assess_property_risk ──

export const AssessRiskInput = z.object({
  prefecture: prefectureField,
  address: z.string().describe('住所または地番'),
  neighborhood: neighborhoodField,
  latlng: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
  riskTypes: z
    .array(z.enum(['flood', 'landslide', 'earthquake', 'all']))
    .default(['all']),
});
export type AssessRiskInput = z.infer<typeof AssessRiskInput>;

export const FloodRisk = z.object({
  level: z.enum(['low', 'medium', 'high']),
  probability: z.number().min(0).max(1),
  description: z.string(),
});
export type FloodRisk = z.infer<typeof FloodRisk>;

export const AssessRiskOutput = z.object({
  floodRisk: FloodRisk,
  overallRiskScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  adjustedPriceImpact: z.number().describe('リスク考慮後の価格調整率(%)'),
});
export type AssessRiskOutput = z.infer<typeof AssessRiskOutput>;

// ── generate_area_report ──

export const GenerateReportInput = z.object({
  prefecture: prefectureField,
  area: z.string(),
  neighborhood: neighborhoodField,
  purpose: z.enum(['investment', 'development', 'rental', 'management']),
  includeCharts: z.boolean().default(true),
  format: z
    .enum(['markdown', 'pdf'])
    .default('markdown')
    .describe('出力フォーマット。pdf を指定すると pdfBase64 フィールドに Base64 エンコード済み PDF を返す'),
  // ── v6.0 branding & client-ready fields ──
  companyName: z.string().optional().describe('会社名（PDFヘッダーに表示）'),
  agentName: z.string().optional().describe('担当者名（PDFヘッダーに表示）'),
  agentLogoBase64: z.string().optional().describe('会社ロゴ画像（Base64 Data URL）'),
  disclaimer: z.string().optional().describe('免責文言（PDF末尾に追加）'),
  footerContact: z.string().optional().describe('連絡先（PDF末尾フッター）'),
  includeTransactionComparables: z.boolean().default(false).describe('過去取引事例テーブルを含めるか'),
  includeLinearImpact: z.boolean().default(false).describe('リニア中央新幹線の影響試算を含めるか（愛知県のみ）'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInput>;

export const GenerateReportOutput = z.object({
  markdownReport: z.string(),
  chartsData: ChartsData,
  riskHighlights: z.array(z.string()),
  pdfBase64: z.string().optional().describe('format=pdf のとき Base64 エンコードされた PDF バイナリ'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutput>;

// ── assess_family_friendly_score ──

export const FamilyFriendlyInput = z.object({
  prefecture: prefectureField,
  area: z.string().describe('エリア'),
  neighborhood: neighborhoodField,
  address: z.string().optional().describe('具体的な住所（任意）'),
  latlng: z.object({ lat: z.number(), lng: z.number() }).optional(),
  childAge: z.enum(['preschool', 'elementary', 'junior_high', 'high_school', 'all']).default('all'),
});
export type FamilyFriendlyInput = z.infer<typeof FamilyFriendlyInput>;

export const SchoolDistrictInfo = z.object({
  elementarySchool: z.string().describe('学区の小学校名'),
  juniorHighSchool: z.string().describe('学区の中学校名'),
  educationScore: z.number().min(0).max(100).describe('教育環境スコア'),
  universityAdvancementRate: z.number().describe('大学進学率(%)'),
  nearbySchoolCount: z.number().describe('半径2km内の学校数'),
});

export const SafetyInfo = z.object({
  crimeScore: z.number().min(0).max(100).describe('安全性スコア（高い=安全）'),
  crimeRate: z.number().describe('犯罪発生率（件/千人）'),
  dominantCrimeType: z.string().describe('主要犯罪類型'),
});

export const FamilyFriendlyOutput = z.object({
  overallScore: z.number().min(0).max(100).describe('ファミリー適性総合スコア'),
  schoolDistrict: SchoolDistrictInfo,
  safety: SafetyInfo,
  assetValueFactor: z.number().describe('教育環境による資産価値係数(%)'),
  disasterRiskScore: z.number().min(0).max(100),
  pricePerSqm: z.number(),
  keyInsights: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type FamilyFriendlyOutput = z.infer<typeof FamilyFriendlyOutput>;

// ── predict_corporate_demand ──

export const CorporateDemandInput = z.object({
  prefecture: prefectureField,
  area: z.string().describe('エリア'),
  neighborhood: neighborhoodField,
  propertyType: z.enum(['office', 'logistics', 'commercial', 'mixed']).default('office'),
  includeCommuteAnalysis: z.boolean().default(true).describe('通勤時間分析を含むか'),
});
export type CorporateDemandInput = z.infer<typeof CorporateDemandInput>;

export const CorporateMetrics = z.object({
  totalEstablishments: z.number().describe('事業所数'),
  majorCompanyCount: z.number().describe('大企業（従業員300+）数'),
  employeeTotal: z.number().describe('従業者総数'),
  avgCommuteMinutes: z.number().describe('平均通勤時間（分）'),
  industryMix: z.array(z.object({ industry: z.string(), share: z.number() })),
});

export const CorporateDemandOutput = z.object({
  summary: z.string(),
  corporateMetrics: CorporateMetrics,
  demandScore: z.number().min(0).max(100).describe('法人需要スコア'),
  rentabilityScore: z.number().min(0).max(100).describe('賃料収益性スコア'),
  growthPotential: z.enum(['high', 'medium', 'low']),
  humanFlowAlignment: z.number().min(0).max(100).describe('人流との整合性'),
  keyInsights: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type CorporateDemandOutput = z.infer<typeof CorporateDemandOutput>;

// ── open_dashboard ──

export const OpenDashboardInput = z.object({
  prefecture: prefectureField,
  area: z.string().optional().describe('初期表示エリア'),
  neighborhood: neighborhoodField,
  layer: z
    .enum(['land_price', 'transaction', 'flood_risk', 'population', 'human_flow', 'school_district', 'corporate_density', 'plateau_3d'])
    .optional()
    .describe('初期レイヤー'),
  propertyType: z
    .enum(['residential', 'commercial', 'logistics', 'office', 'mixed'])
    .optional(),
  mode: z
    .enum(['2d', '3d'])
    .optional()
    .describe('ダッシュボード表示モード。3dを指定するとPLATEAU 3Dビューアを開く'),
  initialMode: z
    .enum(['investment', 'store'])
    .optional()
    .describe('デュアルモード切替。investment=不動産投資モード（デフォルト）、store=店舗出店戦略モード'),
});
export type OpenDashboardInput = z.infer<typeof OpenDashboardInput>;

export const OpenDashboardOutput = z.object({
  area: z.string(),
  layer: z.string(),
  prefecture: z.string(),
  attribution: z.string(),
  mode: z.enum(['2d', '3d']),
  initialMode: z.enum(['investment', 'store']).optional(),
  dashboardUrl: z.string().optional(),
});
export type OpenDashboardOutput = z.infer<typeof OpenDashboardOutput>;

// ── quick_visual_summary (ChatGPT render tool) ──

export const QuickVisualSummaryInput = z.object({
  prefecture: prefectureField,
  area: z.string().optional().describe("Target area to focus the visual summary on | 表示対象エリア"),
  intent: z
    .enum(['investment', 'arbitrage', 'comparison', 'renovation', 'contract', 'store', 'overview', 'cashflow'])
    .default('overview')
    .describe('User goal for choosing the best visual starting point | 表示目的'),
  mode: z.enum(['2d', '3d']).default('2d').describe('Dashboard mode | ダッシュボード表示モード'),
  compact: z.boolean().default(true).describe('Optimize copy and layout for ChatGPT mobile/compact views'),
});
export type QuickVisualSummaryInput = z.infer<typeof QuickVisualSummaryInput>;

export const VisualNextAction = z.object({
  label: z.string().describe('Button/action label shown to the user'),
  prompt: z.string().describe('Follow-up prompt suitable for sending back to ChatGPT'),
  tool: z.string().optional().describe('Suggested MCP tool for the model to call'),
});
export type VisualNextAction = z.infer<typeof VisualNextAction>;

export const QuickVisualSummaryOutput = z.object({
  title: z.string(),
  summary: z.string(),
  prefecture: z.string(),
  area: z.string(),
  intent: z.enum(['investment', 'arbitrage', 'comparison', 'renovation', 'contract', 'store', 'overview', 'cashflow']),
  dashboardUri: z.string().describe('MCP Apps ui:// resource URI'),
  dashboardUrl: z.string().describe('Browser fallback URL or path'),
  layer: z.string(),
  mode: z.enum(['2d', '3d']),
  nextActions: z.array(VisualNextAction),
  markdownReport: z.string().describe('Compact markdown fallback for non-UI clients'),
  attribution: z.string(),
});
export type QuickVisualSummaryOutput = z.infer<typeof QuickVisualSummaryOutput>;

// ── compare_prefectures (v2.1 new) ──

export const ComparePrefecturesInput = z.object({
  prefectures: z.array(z.string()).min(2).max(5)
    .describe('比較対象都道府県（2-5県）。例: ["愛知県", "東京都"]'),
  area: z.string().optional()
    .describe('各都道府県の代表エリア（省略時は県庁所在地相当。愛知=名古屋市中区、東京=千代田区）'),
  neighborhood: neighborhoodField,
  propertyType: z.enum(['residential', 'commercial', 'logistics', 'office', 'mixed']).default('mixed'),
  metrics: z.array(z.enum(['price', 'risk', 'humanFlow', 'education', 'corporate', 'investment', 'transport', 'commercial', 'medical']))
    .default(['price', 'risk', 'investment']),
  includeMarkdown: z.boolean().default(true),
  exportFormat: z
    .enum(['json', 'markdown', 'xlsx'])
    .default('json')
    .describe('出力フォーマット。xlsx を指定すると xlsxBase64 フィールドに Base64 エンコード済み Excel を返す'),
});
export type ComparePrefecturesInput = z.infer<typeof ComparePrefecturesInput>;

export const PrefectureScore = z.object({
  prefecture: z.string(),
  prefectureKey: z.string(),
  area: z.string(),
  capabilities: z.object({
    humanFlow: z.boolean(), education: z.boolean(),
    corporate: z.boolean(), crime: z.boolean(), plateau: z.boolean(),
    transport: z.boolean(), commercial: z.boolean(), medical: z.boolean(),
  }),
  metrics: z.object({
    price: z.number().nullable(),
    priceChangeRate: z.number().nullable(),
    riskScore: z.number().nullable(),
    humanFlowScore: z.number().nullable(),
    educationScore: z.number().nullable(),
    corporateScore: z.number().nullable(),
    transportScore: z.number().nullable(),
    commercialScore: z.number().nullable(),
    medicalScore: z.number().nullable(),
    investmentScore: z.number(),
  }),
  rank: z.number(),
});
export type PrefectureScore = z.infer<typeof PrefectureScore>;

export const ComparePrefecturesOutput = z.object({
  summary: z.string(),
  scores: z.array(PrefectureScore),
  ranking: z.array(z.object({ rank: z.number(), prefecture: z.string(), score: z.number() })),
  radarData: z.array(z.object({
    metric: z.string(),
    values: z.array(z.object({ prefecture: z.string(), value: z.number() })),
  })),
  diffs: z.array(z.object({
    metric: z.string(),
    base: z.string(),
    target: z.string(),
    delta: z.number(),
    direction: z.enum(['up', 'down', 'flat']),
  })),
  bestFor: z.object({ investment: z.string(), safety: z.string(), growth: z.string() }),
  markdownReport: z.string().optional(),
  unsupportedNotes: z.array(z.string()),
  xlsxBase64: z.string().optional().describe('exportFormat=xlsx のとき Base64 エンコードされた Excel バイナリ'),
});
export type ComparePrefecturesOutput = z.infer<typeof ComparePrefecturesOutput>;

// ── drill_down_local_analysis (v2.1 new) ──

export const DrillDownInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中村区'）"),
  neighborhood: neighborhoodField,
  focus: z.enum(['price', 'risk', 'demand', 'all']).default('all'),
  exportFormat: z
    .enum(['json', 'markdown', 'xlsx'])
    .default('json')
    .describe('出力フォーマット。xlsx を指定すると xlsxBase64 フィールドに Base64 エンコード済み Excel を返す'),
});
export type DrillDownInput = z.infer<typeof DrillDownInput>;

export const DrillDownOutput = z.object({
  scope: z.object({
    prefecture: z.string(),
    city: z.string(),
    neighborhood: z.string().optional(),
  }),
  granularity: z.enum(['city', 'neighborhood']),
  granularityNote: z.string(),
  pricePerSqm: z.number().nullable(),
  priceChangeRate: z.number().nullable(),
  population: z.object({
    total: z.number(),
    households: z.number(),
    aging: z.number(),
  }).nullable(),
  riskScore: z.number().nullable(),
  floodLevel: z.enum(['low', 'medium', 'high']).nullable(),
  humanFlowScore: z.number().nullable(),
  transportScore: z.number().nullable(),
  commercialDensity: z.string().nullable(),
  medicalDensity: z.string().nullable(),
  competitorDensity: z.string(),
  localPitch: z.string(),
  keyInsights: z.array(z.string()),
  markdownReport: z.string(),
  households: z.number().optional(),
  avgAge: z.number().optional(),
  childRatio: z.number().optional(),
  elderlyRatio: z.number().optional(),
  daytimePopRatio: z.number().optional(),
  popDensity: z.number().optional(),
  neighborhoodDataAvailable: z.boolean().optional(),
  xlsxBase64: z.string().optional().describe('exportFormat=xlsx のとき Base64 エンコードされた Excel バイナリ'),
});
export type DrillDownOutput = z.infer<typeof DrillDownOutput>;

// ── evaluate_store_location (v2.2 new) ──

export const StoreLocationInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中村区'）"),
  neighborhood: neighborhoodField,
  storeType: z.enum(['convenience', 'family_restaurant', 'cafe', 'drugstore', 'supermarket'])
    .describe('出店を検討する店舗タイプ'),
  radiusM: z.number().default(500).describe('競合・施設を検索する半径（メートル）'),
  customWeights: z.record(z.string(), z.number()).optional()
    .describe('カスタム重み付け（省略時はタイプ別デフォルト）'),
  includeMarkdown: z.boolean().default(true),
});
export type StoreLocationInput = z.infer<typeof StoreLocationInput>;

export const KeyCompetitor = z.object({
  name: z.string(),
  chainBrand: z.string(),
  distance: z.number().describe('メートル'),
  type: z.string(),
  strength: z.number().min(0).max(100),
  weakness: z.string(),
});
export type KeyCompetitor = z.infer<typeof KeyCompetitor>;

export const StoreLocationOutput = z.object({
  overallScore: z.number().min(0).max(100),
  storeType: z.string(),
  city: z.string(),
  neighborhood: z.string().optional(),
  breakdown: z.object({
    population: z.number(),
    humanFlow: z.number(),
    risk: z.number(),
    competition: z.number(),
    transport: z.number(),
    education: z.number(),
    commercial: z.number(),
    medical: z.number(),
  }),
  keyCompetitors: z.array(KeyCompetitor),
  differentiationSuggestions: z.array(z.string()),
  keyInsights: z.array(z.string()),
  markdownReport: z.string().optional(),
});
export type StoreLocationOutput = z.infer<typeof StoreLocationOutput>;

// ── forecast_land_price_trend (v4.0 new) ──

export const ForecastLandPriceTrendInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中村区', '世田谷区'）"),
  landUse: z.enum(['residential', 'commercial', 'industrial', 'all']).default('all')
    .describe('地目フィルター。all=全地目平均'),
  horizon: z.enum(['1y', '3y', '5y']).default('3y')
    .describe('予測期間'),
  method: z.enum(['linear', 'moving_avg']).default('linear')
    .describe('予測手法。linear=線形回帰、moving_avg=移動平均外挿'),
  includeMarkdown: z.boolean().default(true),
  output_mode: outputModeField,
});
export type ForecastLandPriceTrendInput = z.infer<typeof ForecastLandPriceTrendInput>;

export const LandPriceForecastPoint = z.object({
  year: z.number(),
  price_per_sqm: z.number(),
  isForecast: z.boolean(),
  confidenceInterval: z.object({ low: z.number(), high: z.number() }).optional(),
});
export type LandPriceForecastPoint = z.infer<typeof LandPriceForecastPoint>;

export const ForecastLandPriceTrendOutput = z.object({
  prefecture: z.string(),
  city: z.string(),
  landUse: z.string(),
  latestPricePerSqm: z.number().nullable(),
  cagr: z.number().nullable().describe('年平均成長率（%）'),
  trendDirection: z.enum(['rising', 'stable', 'declining']),
  trendStrength: z.enum(['strong', 'moderate', 'weak']),
  series: z.array(LandPriceForecastPoint).describe('実績 + 予測の時系列データ'),
  keyDrivers: z.array(z.string()),
  riskFactors: z.array(z.string()),
  investmentSignal: z.enum(['buy', 'hold', 'caution']),
  markdownReport: z.string().optional(),
});
export type ForecastLandPriceTrendOutput = z.infer<typeof ForecastLandPriceTrendOutput>;

// ── scenario_what_if (v4.0 new) ──

export const ScenarioWhatIfInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中村区'）"),
  scenario: z.enum([
    'new_commercial_facility',
    'new_station',
    'new_corporate_office',
    'population_growth',
    'population_decline',
    'disaster_risk_increase',
    'disaster_risk_decrease',
  ]).describe('シナリオ種別'),
  scale: z.enum(['small', 'medium', 'large']).default('medium')
    .describe('規模感。large=大型施設・急成長など'),
  horizon: z.enum(['1y', '3y', '5y']).default('3y'),
  includeMarkdown: z.boolean().default(true),
});
export type ScenarioWhatIfInput = z.infer<typeof ScenarioWhatIfInput>;

export const ScenarioMetrics = z.object({
  pricePerSqm: z.number().nullable(),
  humanFlowScore: z.number().nullable(),
  investmentScore: z.number(),
  riskScore: z.number(),
});

export const ScenarioWhatIfOutput = z.object({
  prefecture: z.string(),
  city: z.string(),
  scenario: z.string(),
  scale: z.string(),
  horizon: z.string(),
  baseline: ScenarioMetrics.describe('現状ベースライン'),
  projected: ScenarioMetrics.describe('シナリオ適用後予測'),
  priceImpactPct: z.number().describe('地価への影響（%。正=上昇）'),
  humanFlowImpactPct: z.number().nullable(),
  riskImpactPct: z.number(),
  confidence: z.enum(['high', 'medium', 'low']),
  keyOpportunities: z.array(z.string()),
  keyRisks: z.array(z.string()),
  recommendations: z.array(z.string()),
  markdownReport: z.string().optional(),
});
export type ScenarioWhatIfOutput = z.infer<typeof ScenarioWhatIfOutput>;

// ── portfolio_optimizer (v5.0 new) ──

export const PortfolioOptimizerInput = z.object({
  targets: z.array(z.object({
    prefecture: z.string().describe('都道府県名'),
    city: z.string().describe('市区町村'),
    propertyType: z.enum(['residential', 'commercial', 'office', 'land']).describe('物件種別'),
    budgetManYen: z.number().describe('投資予算（万円）'),
  })).min(2).max(5).describe('比較対象エリア（2〜5件）'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium').describe('リスク許容度'),
  investmentHorizon: z.enum(['3y', '5y', '10y']).default('5y').describe('投資期間'),
  optimizeFor: z.enum(['return', 'risk_adjusted', 'diversification', 'stability'])
    .default('risk_adjusted').describe('最適化目標'),
  includeMarkdown: z.boolean().default(true),
});
export type PortfolioOptimizerInput = z.infer<typeof PortfolioOptimizerInput>;

const PortfolioAsset = z.object({
  prefecture: z.string(),
  city: z.string(),
  propertyType: z.string(),
  budgetManYen: z.number(),
  allocationPct: z.number().describe('推奨配分割合（%）'),
  expectedAnnualReturnPct: z.number().describe('期待年率リターン（%）'),
  riskScore: z.number().min(1).max(10).describe('リスクスコア（低いほど安全）'),
  liquidityScore: z.number().min(1).max(10).describe('流動性スコア（高いほど売却しやすい）'),
  currentPricePerSqm: z.number().nullable(),
  strengthSummary: z.string().describe('このエリアの強み'),
  weaknessSummary: z.string().describe('このエリアの弱み'),
  recommendation: z.enum(['strong_buy', 'buy', 'hold', 'reduce', 'sell']),
});

export const PortfolioOptimizerOutput = z.object({
  optimizeFor: z.string(),
  riskTolerance: z.string(),
  investmentHorizon: z.string(),
  totalBudgetManYen: z.number(),
  assets: z.array(PortfolioAsset),
  portfolioReturnPct: z.number().describe('ポートフォリオ全体の期待年率リターン（%）'),
  portfolioRiskScore: z.number().describe('ポートフォリオ全体のリスクスコア（1-10）'),
  diversificationScore: z.number().min(0).max(100).describe('分散スコア（高いほど分散）'),
  sharpeRatio: z.number().describe('シャープレシオ（リターン/リスク比）'),
  topRecommendation: z.string().describe('最優先推奨エリア'),
  keyInsights: z.array(z.string()),
  markdownReport: z.string().optional(),
});
export type PortfolioOptimizerOutput = z.infer<typeof PortfolioOptimizerOutput>;

// ── simulate_landscape_impact (v2.3 new) ──

export const LandscapeInput = z.object({
  prefecture: prefectureField,
  lat: z.number().describe('対象地点の緯度'),
  lng: z.number().describe('対象地点の経度'),
  dateTime: z.string().optional().describe('シミュレーション日時（ISO 8601形式、省略時は現在時刻）'),
  timePreset: z.enum(['morning', 'noon', 'evening']).optional()
    .describe('時刻プリセット（morning=8:00, noon=12:00, evening=17:00）'),
  radiusM: z.number().default(500).describe('建物検索半径（メートル）'),
  includeMarkdown: z.boolean().default(true),
});
export type LandscapeInput = z.infer<typeof LandscapeInput>;

export const ShadowPolygon = z.object({
  buildingName: z.string(),
  height: z.number(),
  shadowLengthM: z.number(),
  polygon: z.array(z.tuple([z.number(), z.number()])),
});

export const LandscapeOutput = z.object({
  sunPosition: z.object({
    azimuthDeg: z.number(),
    altitudeDeg: z.number(),
    dateTime: z.string(),
  }),
  nearbyBuildingCount: z.number(),
  maxHeight: z.number(),
  avgHeight: z.number(),
  totalShadowAreaSqm: z.number(),
  sunlightHoursEstimate: z.number(),
  shadowPolygons: z.array(ShadowPolygon),
  highImpactBuildings: z.array(z.object({
    name: z.string(),
    height: z.number(),
    distance: z.number(),
  })),
  keyInsights: z.array(z.string()),
  markdownReport: z.string().optional(),
});
export type LandscapeOutput = z.infer<typeof LandscapeOutput>;

// ── discover_opportunities (v6.5.0) ──

export const DiscoverOpportunitiesInput = z.object({
  prefecture: prefectureField,
  goal: z.enum(['investment', 'store', 'family', 'office', 'development']).default('investment')
    .describe('探索目的'),
  horizon: z.enum(['1y', '3y', '5y']).default('3y'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  budgetLevel: z.enum(['low', 'middle', 'high', 'any']).default('any')
    .describe('想定予算帯。low=㎡15万以下, middle=15-50万, high=50万超'),
  limit: z.number().int().min(1).max(10).default(5)
    .describe('返却する候補数'),
  includeMarkdown: z.boolean().default(true),
  includeExternalFreshness: z.boolean().default(false)
    .describe('true かつ MLIT_API_KEY 環境変数があるとき、MLIT API から最新取引を取得しシグナルに反映'),
  useGeminiNarrative: z.boolean().default(false)
    .describe('true かつ GOOGLE_GENAI_API_KEY があるとき、Gemini でカードに creativeAngle と質問候補を追加'),
  output_mode: outputModeField,
});
export type DiscoverOpportunitiesInput = z.infer<typeof DiscoverOpportunitiesInput>;

export const OpportunitySignalType = z.enum([
  'undervalued_growth',
  'high_flow_low_commercial',
  'education_medical_hub',
  'corporate_momentum',
  'low_risk_upside',
  'transit_oriented',
  'population_inflow',
  'declining_area',
  'discount_arbitrage',
]);
export type OpportunitySignalType = z.infer<typeof OpportunitySignalType>;

export const FreshTransactionSignal = z.object({
  sampleCount: z.number(),
  medianPricePerSqm: z.number(),
  deltaVsHistorical: z.number().describe('CSV履歴比の乖離率(%)'),
  fetchedAt: z.string(),
}).nullable();
export type FreshTransactionSignal = z.infer<typeof FreshTransactionSignal>;

export const OpportunityUiAction = z.object({
  label: z.string(),
  tool: z.string(),
  args: z.record(z.unknown()),
});
export type OpportunityUiAction = z.infer<typeof OpportunityUiAction>;

export const OpportunityCard = z.object({
  title: z.string().describe('仮説タイトル'),
  city: z.string(),
  score: z.number().min(0).max(100).describe('機会スコア'),
  signalType: OpportunitySignalType,
  why: z.array(z.string()).describe('この仮説の根拠（3-5点）'),
  evidence: z.object({
    pricePerSqm: z.number().nullable(),
    priceChangeRate: z.number().nullable(),
    riskScore: z.number().nullable(),
    humanFlowWeekday: z.number().nullable(),
    humanFlowTrend: z.string().nullable(),
    educationScore: z.number().nullable(),
    corporateCount: z.number().nullable(),
    transportScore: z.number().nullable(),
    commercialFacilities: z.number().nullable(),
    medicalFacilities: z.number().nullable(),
    population: z.number().nullable(),
    agingRate: z.number().nullable(),
    freshTransactionSignal: FreshTransactionSignal.optional(),
  }),
  risks: z.array(z.string()),
  recommendedTools: z.array(z.string()).describe('深掘り用の推奨ツール名'),
  uiActions: z.array(OpportunityUiAction).describe('UIボタン定義'),
  creativeAngle: z.string().nullable().optional().describe('Gemini生成の独創的洞察'),
  userQuestionSuggestions: z.array(z.string()).optional().describe('Gemini生成のフォローアップ質問候補'),
});
export type OpportunityCard = z.infer<typeof OpportunityCard>;

export const DiscoverOpportunitiesOutput = z.object({
  summary: z.string(),
  cards: z.array(OpportunityCard),
  dataCoverage: z.object({
    prefecture: z.string(),
    citiesScanned: z.number(),
    availableMetrics: z.array(z.string()),
    missingMetrics: z.array(z.string()),
  }),
  nextActions: z.array(z.string()),
  attribution: z.string(),
  markdownReport: z.string().optional(),
});
export type DiscoverOpportunitiesOutput = z.infer<typeof DiscoverOpportunitiesOutput>;

// ── v6.8.0 Renovation / Nagoya tools ───────────────────────────────────────

export const RenovationYieldInput = z.object({
  ward: z.string().describe('名古屋市の区名 (例: 中区, 中村区)'),
  chochou: z.string().describe('町丁目名 (例: 栄三丁目, 名駅一丁目)'),
  buildingAge: z.number().min(0).max(100).describe('築年数'),
  floorArea: z.number().min(10).max(2000).describe('専有面積 (㎡)'),
  acquisitionPrice: z.number().optional().describe('取得予定価格 (円)。省略時は推定'),
  propertyType: z.enum(['mansion', 'house', 'office']).default('mansion').describe('物件種別'),
});
export type RenovationYieldInput = z.infer<typeof RenovationYieldInput>;

export const FutureTimelineInput = z.object({
  ward: z.string().describe('名古屋市の区名 (例: 中区)'),
  chochou: z.string().default('').describe('町丁目名 (省略時は区全体)'),
});
export type FutureTimelineInput = z.infer<typeof FutureTimelineInput>;

export const ChochouProfileInput = z.object({
  ward: z.string().describe('名古屋市の区名'),
  chochou: z.string().default('').describe('町丁目名 (省略時は区全体)'),
  output_mode: outputModeField,
});
export type ChochouProfileInput = z.infer<typeof ChochouProfileInput>;

export const RecommendRenovationTargetsInput = z.object({
  buildingAge: z.number().min(0).max(100).default(30).describe('想定築年数'),
  floorArea: z.number().min(10).max(2000).default(70).describe('想定面積 (㎡)'),
  propertyType: z.enum(['mansion', 'house', 'office']).default('mansion'),
  limit: z.number().min(1).max(20).default(10).describe('上位何件を返すか'),
});
export type RecommendRenovationTargetsInput = z.infer<typeof RecommendRenovationTargetsInput>;

// ── v6.9.0 Contract Intelligence tools ───────────────────────────────────────

export const ContractSupportInput = z.object({
  ward: z.string().describe('名古屋市の区名 (例: 中区, 中村区)'),
  chochou: z.string().default('').describe('町丁目名 (省略時は区全体)'),
  buildingAge: z.number().min(0).max(100).describe('築年数'),
  floorArea: z.number().min(10).max(2000).describe('専有面積 (㎡)'),
  price: z.number().describe('取得予定価格 (円)'),
  propertyType: z.enum(['mansion', 'house', 'office']).default('mansion').describe('物件種別'),
  proposedClauses: z.array(z.string()).optional().describe('すでに検討中の特約・条項（任意）'),
});
export type ContractSupportInput = z.infer<typeof ContractSupportInput>;

export const ContractSupportOutput = z.object({
  summary: z.string(),
  riskMatrix: z.array(z.object({
    clause: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    reason: z.string(),
    mitigation: z.string(),
  })),
  negotiationAnchors: z.array(z.object({
    topic: z.string(),
    currentPriceImpact: z.string(),
    futureUplift: z.string(),
    recommendation: z.string(),
  })),
  recommendedClauses: z.array(z.object({
    clause: z.string(),
    rationale: z.string(),
    priority: z.enum(['must', 'recommended', 'optional']),
  })),
  markdown: z.string(),
  pdfBase64: z.string().optional(),
});
export type ContractSupportOutput = z.infer<typeof ContractSupportOutput>;

export const AssessContractRiskInput = z.object({
  ward: z.string().describe('名古屋市の区名'),
  chochou: z.string().default('').describe('町丁目名'),
  proposedTerms: z.record(z.unknown()).describe('提案中の契約条項（JSON 形式）'),
});
export type AssessContractRiskInput = z.infer<typeof AssessContractRiskInput>;

export const AssessContractRiskOutput = z.object({
  overallRiskScore: z.number().min(0).max(100),
  clauseRisks: z.array(z.object({
    clause: z.string(),
    riskScore: z.number(),
    level: z.enum(['low', 'medium', 'high']),
    explanation: z.string(),
    suggestedFix: z.string().optional(),
  })),
  dealBreakerFlags: z.array(z.string()),
  summary: z.string(),
});
export type AssessContractRiskOutput = z.infer<typeof AssessContractRiskOutput>;

// ── purchase review decision support ────────────────────────────────────────

export const PurchasePropertyType = z.enum([
  'mansion',
  'house',
  'building',
  'store',
  'land',
  'office',
  'mixed',
]);
export type PurchasePropertyType = z.infer<typeof PurchasePropertyType>;

export const PurchaseReviewInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中区', '新宿区'）"),
  district: z.string().optional().describe('町丁目・地区名（販売図面から分かる範囲で可）'),
  addressMemo: z.string().optional().describe('販売図面・物件資料に記載された住所メモ'),
  propertyType: PurchasePropertyType.default('mansion').describe('物件種別'),
  askingPrice: z.number().positive().describe('売出価格・購入打診価格（円）'),
  negotiablePrice: z.number().positive().optional().describe('交渉後に狙う価格（円）'),
  landAreaSqm: z.number().positive().optional().describe('土地面積（㎡）'),
  buildingAreaSqm: z.number().positive().optional().describe('建物面積（㎡）'),
  exclusiveAreaSqm: z.number().positive().optional().describe('専有面積（㎡）'),
  buildingAge: z.number().min(0).max(120).optional().describe('築年数'),
  structure: z.string().optional().describe('構造（RC/SRC/S/木造など）'),
  floors: z.number().int().positive().optional().describe('階数'),
  currentAnnualRent: z.number().min(0).optional().describe('現況年間賃料（円）'),
  expectedAnnualRent: z.number().min(0).optional().describe('想定年間賃料（円）'),
  occupancyRate: z.number().min(0).max(1).optional().describe('想定稼働率（0-1）'),
  operatingExpenseAnnual: z.number().min(0).optional().describe('年間運営費・管理費・修繕費等（円）'),
  renovationCost: z.number().min(0).optional().describe('想定リノベ/修繕費（円）'),
  propertyTaxAnnual: z.number().min(0).optional().describe('固定資産税等（円/年）'),
  kojiPricePerSqm: z.number().positive().optional().describe('参考公示地価（円/㎡）'),
  rosenkaPricePerSqm: z.number().positive().optional().describe('参考路線価（円/㎡）'),
  transactionMedianPerSqm: z.number().positive().optional().describe('近隣取引相場中央値（円/㎡）'),
  recommenderClaim: z.string().optional().describe('仲介会社・営業担当などが勧めている理由'),
  proposedTerms: z.object({
    financingDays: z.number().int().min(0).max(90).optional(),
    buildingInspection: z.boolean().optional(),
    defectLiabilityMonths: z.number().int().min(0).max(60).optional(),
    handoverCondition: z.string().optional(),
    existingLease: z.boolean().optional(),
    earlyTerminationPenalty: z.boolean().optional(),
  }).optional().describe('提案中の契約条件'),
  output_mode: outputModeField,
});
export type PurchaseReviewInput = z.infer<typeof PurchaseReviewInput>;

export const PurchaseDecision = z.enum(['buy', 'negotiate', 'hold', 'reject']);
export type PurchaseDecision = z.infer<typeof PurchaseDecision>;

export const PurchaseReviewAxis = z.object({
  axis: z.enum(['price', 'yield', 'location', 'future', 'risk', 'contract']),
  label: z.string(),
  score: z.number().min(0).max(100),
  summary: z.string(),
  evidence: z.array(z.string()),
});
export type PurchaseReviewAxis = z.infer<typeof PurchaseReviewAxis>;

export const PurchaseReviewOutput = z.object({
  decision: PurchaseDecision,
  decisionLabel: z.string(),
  overallScore: z.number().min(0).max(100),
  priceScore: z.number().min(0).max(100),
  yieldScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  futureScore: z.number().min(0).max(100),
  contractScore: z.number().min(0).max(100),
  keyNumbers: z.object({
    askingPrice: z.number(),
    pricePerSqm: z.number().nullable(),
    pricePerTsubo: z.number().nullable(),
    kojiPricePerSqm: z.number().nullable(),
    rosenkaPerSqm: z.number().nullable(),
    transactionMedianPerSqm: z.number().nullable(),
    askingToKojiRatio: z.number().nullable(),
    askingToTransactionRatio: z.number().nullable(),
    grossYield: z.number().nullable(),
    netYield: z.number().nullable(),
    downsideNetYield: z.number().nullable(),
    paybackYears: z.number().nullable(),
  }),
  axes: z.array(PurchaseReviewAxis),
  redFlags: z.array(z.string()),
  negotiationPoints: z.array(z.string()),
  missingInformation: z.array(z.string()),
  recommendedClauses: z.array(z.object({
    clause: z.string(),
    rationale: z.string(),
    priority: z.enum(['must', 'recommended', 'optional']),
  })),
  dataSources: z.array(z.string()),
  markdownReport: z.string(),
  dashboardUri: z.string(),
  attribution: z.string(),
});
export type PurchaseReviewOutput = z.infer<typeof PurchaseReviewOutput>;

// ── leveraged cash flow simulation ──────────────────────────────────────────

export const LeveragedPaymentType = z.enum(['equal_payment', 'equal_principal']);
export type LeveragedPaymentType = z.infer<typeof LeveragedPaymentType>;

export const LeveragedCashflowInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中区', '新宿区'）"),
  district: z.string().optional().describe('町丁目・地区名（任意）'),
  propertyType: PurchasePropertyType.default('mansion').describe('物件種別'),
  askingPrice: z.number().positive().describe('購入価格・売出価格（円）'),
  purchaseCost: z.number().min(0).default(0).describe('仲介手数料・登記費用など初期取得費用（円）'),
  renovationCost: z.number().min(0).default(0).describe('初期修繕・リノベーション費用（円）'),
  landValueRatio: z.number().min(0).max(1).default(0.4).describe('土地按分比率。建物減価償却のために使用（0-1）'),
  annualRent: z.number().positive().describe('初年度の想定年間賃料収入（円）'),
  otherIncomeAnnual: z.number().min(0).default(0).describe('駐車場・看板等のその他年間収入（円）'),
  vacancyRate: z.number().min(0).max(1).default(0.05).describe('初年度の想定空室率（0-1）'),
  operatingExpenseAnnual: z.number().min(0).default(0).describe('管理費・修繕費・保険料など年間運営費（円）'),
  propertyTaxAnnual: z.number().min(0).default(0).describe('固定資産税・都市計画税等（円/年）'),
  annualCapex: z.number().min(0).default(0).describe('毎年の資本的支出・大規模修繕積立相当（円/年）'),
  loan: z.object({
    ltvPct: z.number().min(0).max(100).default(70).describe('借入比率 LTV（%）'),
    loanAmount: z.number().positive().optional().describe('借入額（円）。指定時はLTVより優先'),
    interestRatePct: z.number().min(0).max(20).describe('年利（%）'),
    termYears: z.number().int().min(1).max(50).default(25).describe('返済期間（年）'),
    paymentType: LeveragedPaymentType.default('equal_payment').describe('返済方式'),
    interestOnlyYears: z.number().int().min(0).max(10).default(0).describe('元金据置年数'),
  }).describe('銀行借入条件'),
  assumptions: z.object({
    simulationYears: z.number().int().min(1).max(30).default(10).describe('シミュレーション年数'),
    rentGrowthPct: z.number().min(-20).max(20).default(1).describe('年間賃料成長率（%）'),
    expenseGrowthPct: z.number().min(-20).max(20).default(1).describe('年間経費上昇率（%）'),
    exitCapRatePct: z.number().min(0.1).max(30).optional().describe('売却時キャップレート（%）。未指定なら売却益を含めない'),
    exitCostPct: z.number().min(0).max(20).default(3).describe('売却時費用率（%）'),
    depreciationYears: z.number().int().min(1).max(60).optional().describe('建物減価償却年数。未指定なら物件種別から推定'),
    marginalTaxRatePct: z.number().min(0).max(55).default(20).describe('所得税・住民税の簡易限界税率（%）'),
  }).default({}).describe('10年収支・税務前提'),
  output_mode: outputModeField,
});
export type LeveragedCashflowInput = z.infer<typeof LeveragedCashflowInput>;

export const LeveragedCashflowYear = z.object({
  year: z.number().int(),
  grossRent: z.number(),
  vacancyLoss: z.number(),
  effectiveIncome: z.number(),
  operatingExpense: z.number(),
  propertyTax: z.number(),
  noi: z.number(),
  interestPayment: z.number(),
  principalPayment: z.number(),
  debtService: z.number(),
  beforeTaxCashflow: z.number(),
  depreciation: z.number(),
  taxableIncome: z.number(),
  estimatedTax: z.number(),
  afterTaxCashflow: z.number(),
  loanBalance: z.number(),
  cumulativeAfterTaxCashflow: z.number(),
  dscr: z.number().nullable(),
});
export type LeveragedCashflowYear = z.infer<typeof LeveragedCashflowYear>;

export const LeveragedCashflowOutput = z.object({
  prefecture: z.string(),
  city: z.string(),
  district: z.string().nullable(),
  summary: z.string(),
  summaryKpis: z.object({
    initialEquity: z.number(),
    loanAmount: z.number(),
    ltvPct: z.number(),
    annualDebtServiceYear1: z.number(),
    year1Noi: z.number(),
    year1Dscr: z.number().nullable(),
    year1CashOnCashPct: z.number().nullable(),
    minDscr: z.number().nullable(),
    totalAfterTaxCashflow: z.number(),
    terminalSaleProceeds: z.number().nullable(),
    tenYearIrrPct: z.number().nullable(),
    equityMultiple: z.number().nullable(),
  }),
  assumptions: z.object({
    simulationYears: z.number(),
    interestRatePct: z.number(),
    termYears: z.number(),
    paymentType: LeveragedPaymentType,
    rentGrowthPct: z.number(),
    expenseGrowthPct: z.number(),
    vacancyRate: z.number(),
    depreciationYears: z.number(),
    marginalTaxRatePct: z.number(),
  }),
  yearlyRows: z.array(LeveragedCashflowYear),
  sensitivity: z.array(z.object({
    label: z.string(),
    interestRatePct: z.number(),
    vacancyRate: z.number(),
    tenYearIrrPct: z.number().nullable(),
    totalAfterTaxCashflow: z.number(),
    minDscr: z.number().nullable(),
  })),
  redFlags: z.array(z.string()),
  recommendations: z.array(z.string()),
  markdownReport: z.string(),
  dashboardUri: z.string(),
  attribution: z.string(),
});
export type LeveragedCashflowOutput = z.infer<typeof LeveragedCashflowOutput>;

// ── composite_value_score (v6.12.0) ──

// ── get_zoning_info (v6.13.0) ──

export const ZoningInfoInput = z.object({
  prefecture: prefectureField,
  area: z.string().describe("Target area (e.g. '名古屋市中区', '新宿区') | 対象エリア"),
  district: z.string().optional().describe("Specific district (e.g. '栄', '西新宿') | 地区名"),
});
export type ZoningInfoInput = z.infer<typeof ZoningInfoInput>;

export const ZoningInfoOutput = z.object({
  area: z.string(),
  records: z.array(z.object({
    city: z.string(),
    district: z.string(),
    zone_type: z.string().describe('用途地域 (e.g. 商業地域, 第1種住居地域)'),
    coverage_ratio: z.number().describe('建蔽率 (%)'),
    floor_area_ratio: z.number().describe('容積率 (%)'),
    height_limit: z.number().nullable().describe('高さ制限 (m) — null=制限なし'),
  })),
  zoneDistribution: z.record(z.number()).describe('用途地域別の件数分布'),
  summary: z.string(),
  attribution: z.string(),
});
export type ZoningInfoOutput = z.infer<typeof ZoningInfoOutput>;

// ── get_vacancy_stats (v6.13.0) ──

export const VacancyStatsInput = z.object({
  prefecture: prefectureField,
  area: z.string().optional().describe("Target city (e.g. '名古屋市中区') — omit for full prefecture | 対象市区町村"),
});
export type VacancyStatsInput = z.infer<typeof VacancyStatsInput>;

export const VacancyStatsOutput = z.object({
  area: z.string(),
  records: z.array(z.object({
    city: z.string(),
    total_housing: z.number(),
    total_vacant: z.number(),
    vacancy_rate: z.number().describe('空き家率 (%)'),
    for_rent: z.number(),
    for_sale: z.number(),
    other_vacant: z.number(),
  })),
  prefectureAvgRate: z.number().describe('都道府県平均空き家率 (%)'),
  nationalAvgRate: z.number().describe('全国平均空き家率 (%) ≈ 13.6'),
  summary: z.string(),
  attribution: z.string(),
});
export type VacancyStatsOutput = z.infer<typeof VacancyStatsOutput>;

// ── get_population_outlook (v6.13.0) ──

export const PopulationOutlookInput = z.object({
  prefecture: prefectureField,
  area: z.string().optional().describe("Target city (e.g. '名古屋市中区') — omit for full prefecture | 対象市区町村"),
});
export type PopulationOutlookInput = z.infer<typeof PopulationOutlookInput>;

export const PopulationOutlookOutput = z.object({
  area: z.string(),
  records: z.array(z.object({
    city: z.string(),
    pop_2020: z.number(),
    pop_2030: z.number(),
    pop_2040: z.number(),
    pop_2050: z.number(),
    decline_rate_2050: z.number().describe('2050年までの人口減少率 (%)'),
  })),
  prefectureAvgDecline: z.number().describe('都道府県平均減少率 (%)'),
  summary: z.string(),
  attribution: z.string(),
});
export type PopulationOutlookOutput = z.infer<typeof PopulationOutlookOutput>;

// ── get_real_estate_macro_snapshot (bundled data + optional e-Stat / FRED) ──

export const MacroSnapshotInput = z.object({
  prefecture: prefectureField,
  area: z.string().optional().describe("Optional city filter (e.g. '名古屋市中区') | 市区町村で絞り込み"),
  includeExternalSeries: z.boolean().default(true).describe(
    'If true, fetch construction starts (e-Stat, needs ESTAT_APP_ID) and policy-rate proxy (FRED CSV, no key). | e-Stat着工・FRED金利系列を併記',
  ),
});
export type MacroSnapshotInput = z.infer<typeof MacroSnapshotInput>;

export const MacroSnapshotOutput = z.object({
  prefectureKey: z.string(),
  prefectureDisplay: z.string(),
  areaFilter: z.string().nullable(),
  landPrice: z.object({
    latestYear: z.number().nullable(),
    priorYear: z.number().nullable(),
    medianLatestPerSqm: z.number().nullable(),
    medianPriorPerSqm: z.number().nullable(),
    yoyMedianPct: z.number().nullable(),
    avgChangeRateLatestYear: z.number().nullable(),
    rowsLatestYear: z.number(),
  }),
  transactions: z.object({
    years: z.array(z.object({
      year: z.number(),
      count: z.number(),
      medianPricePerSqm: z.number().nullable(),
    })),
    definition: z.string(),
  }),
  population: z.object({
    avgDecline2050: z.number().nullable(),
    municipalityCount: z.number(),
    definition: z.string(),
  }),
  construction: z.object({
    latestTime: z.string(),
    latestTotal: z.number(),
    priorTime: z.string().nullable(),
    priorTotal: z.number().nullable(),
    yoyPct: z.number().nullable(),
    attribution: z.string(),
  }).nullable(),
  policyRate: z.object({
    seriesId: z.string(),
    latestObservationDate: z.string(),
    latestRatePct: z.number(),
    yearAgoObservationDate: z.string(),
    yearAgoRatePct: z.number(),
    deltaPercentagePoints: z.number(),
    sourceUrl: z.string(),
    attribution: z.string(),
  }).nullable(),
  externalWarnings: z.array(z.string()),
  summary: z.string(),
  attribution: z.array(z.string()),
});
export type MacroSnapshotOutput = z.infer<typeof MacroSnapshotOutput>;

export const CompositeAxisWeights = z.object({
  landPrice: z.number().min(0).max(1).default(0.25).describe('Weight for land price axis (0-1)'),
  education: z.number().min(0).max(1).default(0.20).describe('Weight for education/school axis (0-1)'),
  transport: z.number().min(0).max(1).default(0.20).describe('Weight for transport accessibility axis (0-1)'),
  futurePlan: z.number().min(0).max(1).default(0.20).describe('Weight for future development plan axis (0-1)'),
  riskSafety: z.number().min(0).max(1).default(0.15).describe('Weight for risk/safety axis (0-1)'),
}).describe('Custom weights for the 5-axis composite score');

export const CompositeValueScoreInput = z.object({
  prefecture: prefectureField,
  area: z.string().describe("Target area (e.g. '名古屋市中区', '新宿区') | 対象エリア"),
  horizon: z.enum(['1y', '3y', '5y']).default('3y').describe('Analysis horizon | 分析期間'),
  weights: CompositeAxisWeights.optional().describe('Custom axis weights (defaults: 0.25/0.20/0.20/0.20/0.15) | 軸の重み'),
  includeNarrative: z.boolean().default(true).describe('Generate AI narrative summary (requires Gemini API key) | AI ナラティブ生成'),
  includeMarkdown: z.boolean().default(true).describe('Include Markdown report | Markdown レポートを含む'),
  output_mode: outputModeField,
});
export type CompositeValueScoreInput = z.infer<typeof CompositeValueScoreInput>;

export const CompositeAxisScore = z.object({
  axis: z.string().describe('Axis name'),
  label: z.string().describe('Display label (JP)'),
  score: z.number().min(0).max(100).describe('Normalized score 0-100'),
  rawValue: z.string().describe('Human-readable raw metric'),
  evidence: z.string().describe('Data source citation'),
});
export type CompositeAxisScore = z.infer<typeof CompositeAxisScore>;

export const CompositeValueScoreOutput = z.object({
  compositeScore: z.number().min(0).max(100).describe('Overall composite score 0-100'),
  tier: z.enum(['S', 'A', 'B', 'C']).describe('Tier rating: S(80+) A(65-79) B(50-64) C(<50)'),
  axes: z.array(CompositeAxisScore).describe('Per-axis scores with evidence'),
  peerComparison: z.array(z.object({
    city: z.string(),
    compositeScore: z.number(),
    tier: z.enum(['S', 'A', 'B', 'C']),
    zScore: z.number().describe('Standard deviations from prefecture mean'),
  })).describe('Top/bottom peer cities for comparison'),
  narrative: z.string().optional().describe('AI-generated executive summary (if Gemini available)'),
  markdownReport: z.string().optional().describe('Full Markdown report'),
  attribution: z.string(),
});
export type CompositeValueScoreOutput = z.infer<typeof CompositeValueScoreOutput>;

// ── v6.15.0 Price Triangulation ────────────────────────────────────────────

export const ArbitrageSignalType = z.enum([
  'discount',        // 取引価格 < 路線価 → 割安・買い場シグナル
  'inheritance_edge', // 路線価/公示比 < 0.75 → 相続税評価有利
  'overheated',      // 取引/公示比 > 1.30 → 市場過熱
  'fair',            // 標準範囲
]);
export type ArbitrageSignalType = z.infer<typeof ArbitrageSignalType>;

export const ArbitrageScanInput = z.object({
  prefecture: prefectureField,
  signalType: ArbitrageSignalType.optional()
    .describe("Filter by signal type: 'discount' | 'inheritance_edge' | 'overheated' | 'fair' | omit for all | シグナル種別フィルター"),
  limit: z.number().int().min(1).max(20).default(10)
    .describe('Max cities to return | 最大返却市区町村数'),
  includeLive: z.boolean().default(false)
    .describe('Fetch latest MLIT transactions live (requires MLIT_API_KEY) | ライブ取引価格取得'),
  output_mode: outputModeField,
});
export type ArbitrageScanInput = z.infer<typeof ArbitrageScanInput>;

export const ArbitrageSignalItem = z.object({
  city: z.string().describe('市区町村名'),
  rosenka: z.number().describe('路線価中央値 (円/㎡)'),
  koji: z.number().describe('公示地価中央値 (円/㎡)'),
  transactionMedian: z.number().describe('取引価格中央値 (円/㎡)'),
  rosenkaKojiRatio: z.number().describe('路線価/公示比 (基準: ≈0.80)'),
  transactionKojiRatio: z.number().describe('取引/公示比 (基準: ≈1.05)'),
  assessmentGap: z.number().describe('取引vs路線価の差 (正=取引が路線価超)'),
  signal: ArbitrageSignalType.describe('シグナル分類'),
  interpretation: z.string().describe('日本語解釈テキスト'),
});
export type ArbitrageSignalItem = z.infer<typeof ArbitrageSignalItem>;

export const ArbitrageScanOutput = z.object({
  prefecture: z.string(),
  scannedCities: z.number().describe('スキャンした市区町村数'),
  items: z.array(ArbitrageSignalItem).describe('検出シグナル一覧'),
  benchmark: z.object({
    nationalRosenkaKojiRatio: z.number().describe('全国標準: 路線価/公示比 ≈ 0.80'),
    nationalTxKojiRatio: z.number().describe('全国標準: 取引/公示比 ≈ 1.05'),
  }).describe('比較用ベンチマーク'),
  markdownReport: z.string().describe('Markdown 形式の分析レポート'),
  dataYear: z.number().describe('データ年次'),
  liveDataUsed: z.boolean().describe('MLIT ライブ取引データ使用'),
  attribution: z.string(),
});
export type ArbitrageScanOutput = z.infer<typeof ArbitrageScanOutput>;

// ── assess_exterior_visuals (v2.8 new) ──
export const AssessExteriorVisualsInput = z.object({
  prefecture: prefectureField,
  city: z.string().optional().describe("市区町村（例: '名古屋市中村区'、'世田谷区'）"),
  address: z.string().optional().describe("詳細な住所または建物名（例: '名駅南1丁目3-9'）"),
  latitude: z.number().optional().describe('緯度'),
  longitude: z.number().optional().describe('経度'),
  heading: z.number().int().min(0).max(360).optional().default(0).describe('カメラの向き (0=北、90=東、180=南、270=西)'),
  pitch: z.number().int().min(-90).max(90).optional().default(0).describe('カメラの上下角 (-90=真下、0=水平、90=真上)'),
});
export type AssessExteriorVisualsInput = z.infer<typeof AssessExteriorVisualsInput>;

export const AssessExteriorVisualsOutput = z.object({
  imageUrl: z.string().describe('取得またはモックされたストリートビュー画像のURL (または Base64 埋め込み)'),
  hasLiveImage: z.boolean().describe('Google Street View APIからライブ画像を取得できたか'),
  hasLiveAnalysis: z.boolean().describe('Gemini Vision APIによるライブ画像画像解析が行われたか'),
  latitude: z.number(),
  longitude: z.number(),
  analysis: z.object({
    overallVibe: z.string().describe('周辺の雰囲気の要約'),
    exteriorQuality: z.string().describe('外観の状態や高級感・劣化具合'),
    roadCondition: z.string().describe('前面道路の幅員や舗装、歩道の有無'),
    parkingAvailability: z.string().describe('敷地内または周辺の駐車スペース'),
    issuesIdentified: z.array(z.string()).describe('懸念点 (電線、落書き、ゴミ置き場近傍など)'),
    pros: z.array(z.string()).describe('ポジティブな特徴 (植栽の豊かさ、静かな環境、広い道路など)'),
    cons: z.array(z.string()).describe('ネガティブな特徴'),
    estimatedAgeVibe: z.string().describe('視覚的な推定築年数帯'),
    recommendationsJa: z.string().describe('不動産仲介・投資観点での推奨事項 (日本語)')
  }),
  markdownReport: z.string().describe('Markdown形式の詳細レポート'),
  attribution: z.string(),
});
export type AssessExteriorVisualsOutput = z.infer<typeof AssessExteriorVisualsOutput>;

// ── analyze_commute_accessibility (v2.8 new) ──
export const AnalyzeCommuteAccessibilityInput = z.object({
  prefecture: prefectureField,
  city: z.string().optional().describe("市区町村（例: '名古屋市中村区'、'世田谷区'）"),
  address: z.string().optional().describe("詳細住所または建物名"),
  latitude: z.number().optional().describe('緯度'),
  longitude: z.number().optional().describe('経度'),
});
export type AnalyzeCommuteAccessibilityInput = z.infer<typeof AnalyzeCommuteAccessibilityInput>;

export const CommuteDestination = z.object({
  name: z.string().describe('主要ハブ駅名 (例: 名古屋、栄、東京、新宿、梅田)'),
  distanceKm: z.number().describe('直線距離または道路距離 (km)'),
  estimatedTimeMin: z.number().describe('推定または実測の所要時間 (分)'),
  routeDescription: z.string().describe('利用する主な路線と経路の説明'),
  mode: z.enum(['transit', 'driving', 'walking']),
});
export type CommuteDestination = z.infer<typeof CommuteDestination>;

export const AnalyzeCommuteAccessibilityOutput = z.object({
  latitude: z.number(),
  longitude: z.number(),
  closestStation: z.string().describe('最寄り駅名'),
  closestStationDistanceKm: z.number().describe('最寄り駅までの距離 (km)'),
  closestStationWalkMin: z.number().describe('最寄り駅までの徒歩分数'),
  accessibilityScore: z.number().min(0).max(100).describe('総合利便性スコア (0-100)'),
  destinations: z.array(CommuteDestination).describe('各主要駅への通勤アクセス詳細'),
  hasLiveTraffic: z.boolean().describe('Google Maps APIのライブ路線・交通データを使用したか'),
  transitScoreCategory: z.enum(['excellent', 'very_good', 'good', 'fair', 'poor']).describe('利便性カテゴリ'),
  markdownReport: z.string().describe('Markdown形式の詳細通勤レポート'),
  attribution: z.string(),
});
export type AnalyzeCommuteAccessibilityOutput = z.infer<typeof AnalyzeCommuteAccessibilityOutput>;

// ── optimize_portfolio_allocation (v2.8 premium) ──
export const PortfolioProperty = z.object({
  name: z.string().describe('物件名または識別子'),
  prefecture: z.string().describe('都道府県名'),
  city: z.string().describe('市区町村'),
  purchasePriceJpy: z.number().describe('購入価格または想定価格（円）'),
  annualRentJpy: z.number().describe('年間想定賃料収入（円）'),
  propertyType: z.enum(['residential', 'commercial', 'office', 'mixed']),
  latitude: z.number().optional().describe('緯度（オプション）'),
  longitude: z.number().optional().describe('経度（オプション）'),
});

export const OptimizePortfolioInput = z.object({
  properties: z.array(PortfolioProperty).describe('ポートフォリオ物件一覧'),
  targetGoal: z.enum(['yield_max', 'risk_min', 'balanced']).default('balanced').describe('最適化の目的'),
});
export type OptimizePortfolioInput = z.infer<typeof OptimizePortfolioInput>;

export const PortfolioAnalysisItem = z.object({
  name: z.string(),
  currentYield: z.number().describe('現在の表面利回り（%）'),
  hazardRiskScore: z.number().describe('災害リスクスコア (0-100)'),
  landPriceTrendCagr: z.number().describe('予測地価CAGR（%）'),
  riskAdjustedReturnScore: z.number().describe('リスク調整後リターンスコア (0-100)'),
  actionRecommendation: z.string().describe('推奨アクション JA'),
});
export type PortfolioAnalysisItem = z.infer<typeof PortfolioAnalysisItem>;

export const OptimizePortfolioOutput = z.object({
  totalAssetsJpy: z.number().describe('ポートフォリオ総資産額'),
  overallYield: z.number().describe('ポートフォリオ全体の平均表面利回り'),
  portfolioRiskScore: z.number().min(0).max(100).describe('全体のリスクスコア (0-100)'),
  diversificationScore: z.number().min(0).max(100).describe('地域・用途分散度スコア (0-100)'),
  items: z.array(PortfolioAnalysisItem).describe('物件ごとの個別分析評価'),
  optimizationStrategyJa: z.string().describe('全体最適化戦略アドバイス JA'),
  markdownReport: z.string().describe('Markdown形式の詳細レポート'),
  attribution: z.string(),
});
export type OptimizePortfolioOutput = z.infer<typeof OptimizePortfolioOutput>;

// ── audit_zoning_compliance (v2.8 premium) ──
export const AuditZoningComplianceInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中区'）"),
  address: z.string().optional().describe('詳細住所'),
  latitude: z.number().optional().describe('緯度'),
  longitude: z.number().optional().describe('経度'),
  proposedUse: z.enum(['residential', 'commercial', 'industrial', 'office', 'mixed']),
  proposedHeightM: z.number().describe('計画建物の高さ (m)'),
  proposedFloors: z.number().int().describe('計画建物の階数'),
  proposedBuildingAreaSqm: z.number().describe('計画建物の建築面積 (㎡)'),
  proposedTotalFloorAreaSqm: z.number().describe('計画建物の延床面積 (㎡)'),
  siteAreaSqm: z.number().describe('敷地面積 (㎡)'),
  frontRoadWidthM: z.number().describe('前面道路幅員 (m)'),
});
export type AuditZoningComplianceInput = z.infer<typeof AuditZoningComplianceInput>;

export const AuditZoningComplianceOutput = z.object({
  latitude: z.number(),
  longitude: z.number(),
  zoningType: z.string().describe('用途地域種別'),
  legalMaxCoverageRatio: z.number().describe('法定最大建蔽率 (%)'),
  legalMaxFloorAreaRatio: z.number().describe('法定最大容積率 (%)'),
  proposedCoverageRatio: z.number().describe('計画建蔽率 (%)'),
  proposedFloorAreaRatio: z.number().describe('計画容積率 (%)'),
  coverageRatioCompliant: z.boolean().describe('建蔽率が法定内か'),
  floorAreaRatioCompliant: z.boolean().describe('容積率が法定内か'),
  slantLineCompliant: z.boolean().describe('道路・隣地斜線制限を満たすか'),
  heightLimitCompliant: z.boolean().describe('絶対高さ制限を満たすか'),
  isFullyCompliant: z.boolean().describe('すべての規制に適合しているか'),
  complianceSummaryJa: z.string().describe('適合性状況の日本語要約'),
  optimizationTipsJa: z.array(z.string()).describe('容積最大化・最適化のためのアドバイス'),
  markdownReport: z.string().describe('Markdown形式の詳細監査レポート'),
  attribution: z.string(),
});
export type AuditZoningComplianceOutput = z.infer<typeof AuditZoningComplianceOutput>;

// ── forecast_demographic_shift (v2.8 premium) ──
export const ForecastDemographicShiftInput = z.object({
  prefecture: prefectureField,
  city: z.string().describe("市区町村（例: '名古屋市中区'）"),
  neighborhood: z.string().optional().describe("町丁目（例: '栄3丁目'）"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export type ForecastDemographicShiftInput = z.infer<typeof ForecastDemographicShiftInput>;

export const DemographicForecastYear = z.object({
  year: z.number(),
  estimatedPopulation: z.number().describe('推計人口（人）'),
  estimatedHouseholds: z.number().describe('推計世帯数（世帯）'),
  agingRate: z.number().describe('高齢化率（%）'),
  familyRatio: z.number().describe('ファミリー世帯比率（%）'),
  pedestrianFlowIndex: z.number().describe('人流指数（基準100）'),
});
export type DemographicForecastYear = z.infer<typeof DemographicForecastYear>;

export const ForecastDemographicShiftOutput = z.object({
  city: z.string(),
  neighborhood: z.string().optional(),
  growthCategory: z.enum(['active_growth', 'stable', 'moderate_decline', 'rapid_decline']).describe('エリア成長性分類'),
  growthCategoryJa: z.string(),
  timeline: z.array(DemographicForecastYear).describe('10年後（および2050年）までの推移予測データ'),
  tenYearPopulationChangeRate: z.number().describe('10年間の人口増減率（%）'),
  tenYearPedestrianFlowChangeRate: z.number().describe('10年間の人流増減率（%）'),
  forecastSummaryJa: z.string().describe('将来予測の日本語サマリー'),
  markdownReport: z.string().describe('Markdown形式の詳細将来予測レポート'),
  attribution: z.string(),
});
export type ForecastDemographicShiftOutput = z.infer<typeof ForecastDemographicShiftOutput>;
