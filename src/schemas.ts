import { z } from 'zod';

// ── cross_analyze_real_estate_market ──

export const CrossAnalyzeInput = z.object({
  area: z.string().describe("愛知県内のエリア（例: '名古屋市中村区' または '名古屋市全体'）"),
  propertyType: z.enum(['residential', 'commercial', 'logistics', 'office', 'mixed']),
  timeRange: z.enum(['1y', '3y', '5y']),
  includeRisk: z.boolean().default(true).describe('災害リスク（水没可能性など）を考慮するか'),
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

export const CrossAnalyzeOutput = z.object({
  summary: z.string(),
  priceTrend: PriceTrend,
  riskScore: z.number().min(0).max(100),
  investmentScore: z.number().min(0).max(100),
  keyInsights: z.array(z.string()),
  charts: ChartsData,
});
export type CrossAnalyzeOutput = z.infer<typeof CrossAnalyzeOutput>;

// ── assess_property_risk ──

export const AssessRiskInput = z.object({
  address: z.string().describe('住所または地番'),
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
  area: z.string(),
  purpose: z.enum(['investment', 'development', 'rental', 'management']),
  includeCharts: z.boolean().default(true),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInput>;

export const GenerateReportOutput = z.object({
  markdownReport: z.string(),
  chartsData: ChartsData,
  riskHighlights: z.array(z.string()),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutput>;

// ── cross_analyze_with_human_flow ──

export const HumanFlowAnalyzeInput = z.object({
  area: z.string().describe("愛知県内のエリア（例: '名古屋市中村区'）"),
  propertyType: z.enum(['residential', 'commercial', 'logistics', 'office', 'mixed']),
  timeRange: z.enum(['1y', '3y', '5y']),
  includeRisk: z.boolean().default(true),
  dayType: z.enum(['weekday', 'weekend', 'both']).default('both').describe('平日/休日/両方'),
});
export type HumanFlowAnalyzeInput = z.infer<typeof HumanFlowAnalyzeInput>;

export const HumanFlowMetrics = z.object({
  weekdayAvgFlow: z.number().describe('平日平均人流（人/日）'),
  weekendAvgFlow: z.number().describe('休日平均人流（人/日）'),
  avgStayMinutes: z.number().describe('平均滞在時間（分）'),
  flowTrend: z.enum(['increasing', 'stable', 'decreasing']),
  peakHour: z.string().describe('ピーク時間帯'),
});
export type HumanFlowMetrics = z.infer<typeof HumanFlowMetrics>;

export const HumanFlowAnalyzeOutput = z.object({
  summary: z.string(),
  priceTrend: PriceTrend,
  humanFlow: HumanFlowMetrics,
  riskScore: z.number().min(0).max(100),
  realDemandScore: z.number().min(0).max(100).describe('人流に基づく実需要スコア'),
  investmentScore: z.number().min(0).max(100),
  vacancyRiskScore: z.number().min(0).max(100).describe('空室リスクスコア'),
  keyInsights: z.array(z.string()),
  charts: ChartsData,
});
export type HumanFlowAnalyzeOutput = z.infer<typeof HumanFlowAnalyzeOutput>;

// ── assess_family_friendly_score ──

export const FamilyFriendlyInput = z.object({
  area: z.string().describe('愛知県内のエリア'),
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
  area: z.string().describe('愛知県内のエリア'),
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
  area: z.string().optional().describe('初期表示エリア'),
  layer: z
    .enum(['land_price', 'transaction', 'flood_risk', 'population', 'human_flow', 'school_district', 'corporate_density', 'plateau_3d'])
    .optional()
    .describe('初期レイヤー'),
  propertyType: z
    .enum(['residential', 'commercial', 'logistics', 'office', 'mixed'])
    .optional(),
});
export type OpenDashboardInput = z.infer<typeof OpenDashboardInput>;

export const OpenDashboardOutput = z.object({
  area: z.string(),
  layer: z.string(),
  attribution: z.string(),
});
export type OpenDashboardOutput = z.infer<typeof OpenDashboardOutput>;
