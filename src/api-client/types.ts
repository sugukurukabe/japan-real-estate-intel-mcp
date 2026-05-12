/**
 * API response type definitions for:
 *  - MLIT 不動産情報ライブラリ (XIT001: 取引価格, XCT001: 地価公示)
 *  - e-Stat 政府統計 (getStatsData: 国勢調査人口)
 *
 * These mirror the JSON shapes returned by each API.
 * Transformation to existing CSV schemas lives in each client module.
 */

// ── MLIT XIT001: 不動産取引価格情報 ────────────────────────────────────────

/**
 * Single transaction record from MLIT XIT001 API.
 * All fields are string-typed as returned by the API.
 * Numeric fields (TradePrice, UnitPrice, Area) require parseInt() at usage.
 */
export interface MlitTransaction {
  /** 取引の種類: e.g. "宅地(土地と建物)", "中古マンション等" */
  Type: string;
  /** 地域: e.g. "商業地", "住宅地" */
  Region: string;
  /** 市区町村コード (5桁): e.g. "23101" */
  MunicipalityCode: string;
  /** 都道府県名: e.g. "愛知県" */
  Prefecture: string;
  /** 市区町村名: e.g. "名古屋市中区" */
  Municipality: string;
  /** 地区名: e.g. "丸の内" */
  DistrictName: string;
  /** 取引価格（総額）円: e.g. "85000000" */
  TradePrice: string;
  /** 坪単価（円）: may be empty string */
  PricePerUnit: string;
  /** 間取り: may be empty */
  FloorPlan: string;
  /** 面積（㎡）: e.g. "80" */
  Area: string;
  /** 取引価格（㎡単価）円: e.g. "250000" */
  UnitPrice: string;
  /** 土地の形状: e.g. "不整形", "ほぼ整形" */
  LandShape: string;
  /** 建築年: e.g. "1972年", "令和元年" */
  BuildingYear: string;
  /** 建物の構造: e.g. "ＲＣ", "木造" */
  Structure: string;
  /** 用途: e.g. "住宅", "事務所", "店舗" */
  Use: string;
  /** 都市計画: e.g. "第1種住居地域", "商業地域" */
  CityPlanning: string;
  /** 建蔽率（%）: e.g. "60" */
  CoverageRatio: string;
  /** 容積率（%）: e.g. "200" */
  FloorAreaRatio: string;
  /** 取引時点: e.g. "2025年第1四半期" */
  Period: string;
  /** 改装: e.g. "改装済", "" */
  Renovation: string;
  /** 取引の事情等: may be empty */
  Remarks: string;
  /** 価格情報区分: "不動産取引価格情報" | "成約価格情報" */
  PriceCategory: string;
  /** 地区コード: e.g. "131020170" */
  DistrictCode: string;
}

/** Top-level MLIT XIT001 API response */
export interface MlitApiResponse {
  data: MlitTransaction[];
  /** Status field present on error responses */
  status?: number;
  message?: string;
}

// ── Transformed CSV row types (for writing to data/{pref}/*.csv) ────────────

/** Matches existing data/{pref}/transactions.csv schema */
export interface TransactionCsvRow {
  year: number;
  quarter: number;
  city: string;
  district: string;
  property_type: string;
  land_use: string;
  price_per_sqm: number;
  total_price: number;
  area_sqm: number;
  city_planning: string;
  coverage_ratio: string;
  floor_area_ratio: string;
}

/** Matches existing data/{pref}/land_price.csv schema */
export interface LandPriceCsvRow {
  year: number;
  city: string;
  district: string;
  address: string;
  land_use: string;
  price_per_sqm: number;
  change_rate: number;
  lat: number;
  lng: number;
}

// ── e-Stat API: getStatsData ────────────────────────────────────────────────

/**
 * Single statistical value from e-Stat getStatsData response.
 * Attribute names use the @-prefix notation from the XML-to-JSON conversion.
 */
export interface EstatValue {
  /** 地域コード (5桁市区町村コード or 2桁都道府県コード): e.g. "23101" */
  '@area': string;
  /** 時点コード: e.g. "2020100000" (2020年) */
  '@time': string;
  /** カテゴリコード: used to distinguish metric (population, households, etc.) */
  '@cat01'?: string;
  /** 数値: e.g. "2296000" */
  $: string;
  /** 単位: e.g. "人", "世帯" */
  '@unit'?: string;
}

/** e-Stat CLASS_INF category metadata */
export interface EstatClass {
  '@code': string;
  '@name': string;
  '@level'?: string;
}

/** e-Stat getStatsData full JSON response shape */
export interface EstatApiResponse {
  GET_STATS_DATA: {
    PARAMETER?: {
      STATS_DATA_ID: string;
    };
    STATISTICAL_DATA: {
      CLASS_INF: {
        CLASS_OBJ: {
          '@id': string;
          '@name': string;
          CLASS: EstatClass | EstatClass[];
        }[];
      };
      DATA_INF: {
        VALUE: EstatValue[];
        NOTE?: { '@char': string; $: string } | { '@char': string; $: string }[];
      };
    };
  };
}

/** Matches existing data/{pref}/population.csv schema */
export interface PopulationCsvRow {
  city: string;
  population_2020: number;
  population_2025: number;
  households_2020: number;
  households_2025: number;
  density_per_sqkm: number;
  aging_rate: number;
}

// ── e-Stat extended row types (v6.8.0) ──────────────────────────────────────

/** Household composition by municipality */
export interface HouseholdCompositionRow {
  city: string;
  totalHouseholds: number;
  singlePersonHouseholds: number;
  familyHouseholds: number;
  singlePersonRatio: number;
}

/** Vacancy statistics by municipality */
export interface VacancyStatsRow {
  city: string;
  totalVacant: number;
  forRent: number;
  forSale: number;
  other: number;
}

/** Economic census row by municipality */
export interface EconomicCensusRow {
  city: string;
  establishments: number;
  employees: number;
}

// ── Shared fetch result wrapper ─────────────────────────────────────────────

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}
