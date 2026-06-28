import { forecastDemographicShift } from '../analysis/demographic_forecast.js';
import type { ForecastDemographicShiftInput, ForecastDemographicShiftOutput } from '../schemas.js';

export async function forecastDemographicShiftTool(input: ForecastDemographicShiftInput): Promise<ForecastDemographicShiftOutput> {
  return forecastDemographicShift(input);
}
