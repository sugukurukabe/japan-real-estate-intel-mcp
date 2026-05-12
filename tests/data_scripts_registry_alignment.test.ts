import { describe, expect, it } from 'vitest';
import { listAvailable } from '../src/data-loaders/index.js';
import { POPULATION_DECLINE_MULTIPLIER } from '../scripts/population-projection-decline.js';
import { SYNTHETIC_RISK_PROFILES } from '../scripts/risk-profile-config.js';

describe('data pipeline scripts vs registered prefecture loaders', () => {
  it('synthetic risk profiles cover exactly the registered loader keys', () => {
    const registered = listAvailable().sort((a, b) => a.localeCompare(b));
    expect(Object.keys(SYNTHETIC_RISK_PROFILES).sort((a, b) => a.localeCompare(b))).toEqual(registered);
  });

  it('population projection decline multipliers cover exactly the registered loader keys', () => {
    const registered = listAvailable().sort((a, b) => a.localeCompare(b));
    expect(Object.keys(POPULATION_DECLINE_MULTIPLIER).sort((a, b) => a.localeCompare(b))).toEqual(registered);
  });
});
