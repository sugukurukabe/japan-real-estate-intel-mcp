-- BigQuery schema for japan-real-estate-intel data platform
-- Dataset: japan_real_estate

CREATE TABLE IF NOT EXISTS `japan_real_estate.land_prices` (
  pref_key STRING NOT NULL,
  year INT64 NOT NULL,
  city STRING NOT NULL,
  district STRING,
  address STRING,
  land_use STRING,
  price_per_sqm FLOAT64,
  change_rate FLOAT64,
  lat FLOAT64,
  lng FLOAT64,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY RANGE_BUCKET(year, GENERATE_ARRAY(2015, 2030, 1))
CLUSTER BY pref_key, city;

CREATE TABLE IF NOT EXISTS `japan_real_estate.population` (
  pref_key STRING NOT NULL,
  city STRING NOT NULL,
  population_2020 INT64,
  population_2025 INT64,
  households_2020 INT64,
  households_2025 INT64,
  density_per_sqkm FLOAT64,
  aging_rate FLOAT64,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY pref_key, city;

CREATE TABLE IF NOT EXISTS `japan_real_estate.mlit_transactions` (
  pref_key STRING NOT NULL,
  year INT64 NOT NULL,
  quarter INT64,
  city STRING NOT NULL,
  district STRING,
  property_type STRING,
  price_per_sqm FLOAT64,
  total_price FLOAT64,
  area_sqm FLOAT64,
  city_planning STRING,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY RANGE_BUCKET(year, GENERATE_ARRAY(2015, 2030, 1))
CLUSTER BY pref_key, city;

CREATE TABLE IF NOT EXISTS `japan_real_estate.human_flow` (
  pref_key STRING NOT NULL,
  city STRING NOT NULL,
  district STRING,
  weekday_avg_flow FLOAT64,
  weekend_avg_flow FLOAT64,
  avg_stay_minutes FLOAT64,
  peak_hour STRING,
  flow_trend STRING,
  year INT64,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY pref_key, city;

CREATE TABLE IF NOT EXISTS `japan_real_estate.ingestion_log` (
  run_id STRING NOT NULL,
  pref_key STRING,
  source STRING,
  table_name STRING,
  rows_inserted INT64,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status STRING,
  error_message STRING
);
