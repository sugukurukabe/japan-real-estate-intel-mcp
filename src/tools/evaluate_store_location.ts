import type { StoreLocationInput, StoreLocationOutput } from '../schemas.js';
import { evaluateStoreLocationAnalysis } from '../analysis/store_location.js';

export function evaluateStoreLocation(input: StoreLocationInput): StoreLocationOutput {
  return evaluateStoreLocationAnalysis(input);
}
