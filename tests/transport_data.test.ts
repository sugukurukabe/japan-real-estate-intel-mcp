import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';

describe('transport data (Aichi)', () => {
  const loader = getLoader('aichi');

  it('loads transport station records', () => {
    const records = loader.getTransport();
    expect(records.length).toBeGreaterThan(20);
  });

  it('transport records have required fields', () => {
    const records = loader.getTransport();
    const first = records[0];
    expect(first).toHaveProperty('city');
    expect(first).toHaveProperty('station_name');
    expect(first).toHaveProperty('line');
    expect(first).toHaveProperty('daily_passengers');
    expect(first).toHaveProperty('station_type');
  });

  it('station_type values are valid', () => {
    const valid = new Set(['jr', 'subway', 'private', 'bus']);
    for (const r of loader.getTransport()) {
      expect(valid.has(r.station_type)).toBe(true);
    }
  });
});

describe('commercial facility data (Aichi)', () => {
  const loader = getLoader('aichi');

  it('loads commercial facility records', () => {
    const records = loader.getCommercialFacilities();
    expect(records.length).toBeGreaterThan(40);
  });

  it('facility records have required fields', () => {
    const first = loader.getCommercialFacilities()[0];
    expect(first).toHaveProperty('facility_name');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('lat');
    expect(first).toHaveProperty('lng');
  });

  it('facility type values are valid', () => {
    const valid = new Set(['mall', 'sc', 'cvs', 'drugstore', 'fast_food', 'cafe', 'supermarket']);
    for (const r of loader.getCommercialFacilities()) {
      expect(valid.has(r.type)).toBe(true);
    }
  });
});

describe('medical facility data (Aichi)', () => {
  const loader = getLoader('aichi');

  it('loads medical facility records', () => {
    const records = loader.getMedicalFacilities();
    expect(records.length).toBeGreaterThan(30);
  });

  it('facility records have required fields', () => {
    const first = loader.getMedicalFacilities()[0];
    expect(first).toHaveProperty('facility_name');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('lat');
    expect(first).toHaveProperty('lng');
  });

  it('type values are valid', () => {
    const valid = new Set(['hospital', 'clinic', 'pharmacy', 'dental', 'elderly_care']);
    for (const r of loader.getMedicalFacilities()) {
      expect(valid.has(r.type)).toBe(true);
    }
  });
});

describe('loader capabilities', () => {
  it('Aichi has transport/commercial/medical capabilities', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.transport).toBe(true);
    expect(loader.capabilities.commercial).toBe(true);
    expect(loader.capabilities.medical).toBe(true);
  });

  it('Tokyo now has transport/commercial/medical capabilities (v3.1)', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.transport).toBe(true);
    expect(loader.capabilities.commercial).toBe(true);
    expect(loader.capabilities.medical).toBe(true);
  });

  it('Tokyo returns non-empty arrays for transport/commercial/medical (v3.1)', () => {
    const loader = getLoader('tokyo');
    expect(loader.getTransport().length).toBeGreaterThan(0);
    expect(loader.getCommercialFacilities().length).toBeGreaterThan(0);
    expect(loader.getMedicalFacilities().length).toBeGreaterThan(0);
  });
});
