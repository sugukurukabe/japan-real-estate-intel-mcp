/**
 * Relative decline weight vs national average (1.0 = use national curve as-is).
 * Used by `fetch-population-projection.ts`.
 */
export const POPULATION_DECLINE_MULTIPLIER: Record<string, number> = {
  tokyo: 0.5,
  osaka: 0.9,
  aichi: 0.8,
  kanagawa: 0.6,
  fukuoka: 0.85,
  hokkaido: 1.3,
  kyoto: 0.95,
  hyogo: 1.0,
  chiba: 0.75,
  saitama: 0.7,
};
