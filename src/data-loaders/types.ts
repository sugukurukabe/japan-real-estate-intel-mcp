import type { FeatureCollection } from 'geojson';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LoaderCapabilities {
  transactions: boolean;
  humanFlow: boolean;
  education: boolean;
  corporate: boolean;
  crime: boolean;
  plateau: boolean;
  transport: boolean;
  commercial: boolean;
  medical: boolean;
  neighborhoods: boolean;
}

export interface LandPriceRecord {
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

export interface TransactionRecord {
  year: number;
  quarter: number;
  city: string;
  district: string;
  property_type: string;
  area_sqm: number;
  price_total: number;
  price_per_sqm: number;
  building_year: number | null;
  structure: string;
  use: string;
}

export interface PopulationRecord {
  city: string;
  population_2020: number;
  population_2025: number;
  households_2020: number;
  households_2025: number;
  density_per_sqkm: number;
  aging_rate: number;
}

export interface EarthquakeRecord {
  city: string;
  max_intensity: string;
  probability_30y: number;
  liquefaction_risk: 'low' | 'medium' | 'high';
  description: string;
}

export interface HumanFlowRecord {
  city: string;
  district: string;
  weekday_avg_flow: number;
  weekend_avg_flow: number;
  avg_stay_minutes: number;
  peak_hour: string;
  flow_trend: 'increasing' | 'stable' | 'decreasing';
  year: number;
}

export interface SchoolDistrictRecord {
  city: string;
  district: string;
  elementary_school: string;
  junior_high_school: string;
  education_score: number;
  university_advancement_rate: number;
  nearby_school_count: number;
  avg_deviation_value: number;
}

export interface CorporateLocationRecord {
  city: string;
  district: string;
  total_establishments: number;
  major_company_count: number;
  employee_total: number;
  avg_commute_minutes: number;
  top_industry: string;
  industry_share: number;
  office_vacancy_rate: number;
}

export interface CrimeStatsRecord {
  city: string;
  total_crimes: number;
  crime_rate_per_1000: number;
  theft_count: number;
  violent_count: number;
  fraud_count: number;
  safety_score: number;
  dominant_crime_type: string;
  year: number;
}

export interface PlateauBuildingRecord {
  city: string;
  district: string;
  building_name: string;
  height_m: number;
  floors: number;
  lat: number;
  lng: number;
  use: string;
  built_year: number;
  shadow_impact: 'high' | 'medium' | 'low';
}

export interface TransportRecord {
  city: string;
  district: string;
  station_name: string;
  line: string;
  daily_passengers: number;
  walk_min_to_center: number;
  station_type: 'jr' | 'subway' | 'private' | 'bus';
}

export interface CommercialFacilityRecord {
  city: string;
  district: string;
  facility_name: string;
  type: 'mall' | 'sc' | 'cvs' | 'drugstore' | 'fast_food' | 'cafe' | 'supermarket';
  chain_brand: string;
  lat: number;
  lng: number;
  gfa_sqm: number;
}

export interface MedicalFacilityRecord {
  city: string;
  district: string;
  facility_name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'dental' | 'elderly_care';
  lat: number;
  lng: number;
  beds: number | null;
}

export interface NeighborhoodRecord {
  city: string;
  district: string;
  neighborhood: string;
  population: number;
  households: number;
  pop_density_sqkm: number;
  avg_age: number;
  child_ratio: number;
  elderly_ratio: number;
  daytime_pop_ratio: number;
}

export interface PrefectureLoader {
  readonly key: string;
  readonly displayName: string;
  readonly isoCode: string;
  readonly capabilities: LoaderCapabilities;

  geocode(address: string): LatLng | undefined;
  reverseGeocode(lat: number, lng: number): string | undefined;

  getLandPrices(): LandPriceRecord[];
  getTransactions(): TransactionRecord[];
  getPopulation(): PopulationRecord[];
  getEarthquakeData(): EarthquakeRecord[];
  getFloodZones(): FeatureCollection;
  getLandslideZones(): FeatureCollection;
  getMunicipalities(): FeatureCollection;

  getHumanFlow(): HumanFlowRecord[];
  getSchoolDistricts(): SchoolDistrictRecord[];
  getCorporateLocations(): CorporateLocationRecord[];
  getCrimeStats(): CrimeStatsRecord[];
  getPlateauBuildings(): PlateauBuildingRecord[];

  getTransport(): TransportRecord[];
  getCommercialFacilities(): CommercialFacilityRecord[];
  getMedicalFacilities(): MedicalFacilityRecord[];
  getNeighborhoods(): NeighborhoodRecord[];
}
