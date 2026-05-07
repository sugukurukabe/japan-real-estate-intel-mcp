import { z } from 'zod';

const prefectureField = z.string().default('愛知県').describe('都道府県名（和名/英名/ISO 3166-2 コード対応）');
const neighborhoodField = z.string().optional().describe("町丁目（例: '名駅南1丁目'）。v2.4 では町丁目レベル実データに対応（対応都道府県のみ）");

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
