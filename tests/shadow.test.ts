import { describe, it, expect } from 'vitest';
import { simulateLandscape } from '../src/tools/simulate_landscape_impact.js';
import { LandscapeInput, LandscapeOutput } from '../src/schemas.js';

const NAGOYA_STATION = { lat: 35.1709, lng: 136.8816 };

describe('LandscapeInput schema validation', () => {
  it('parses valid input with defaults', () => {
    const input = LandscapeInput.parse({
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
    });
    expect(input.prefecture).toBe('愛知県');
    expect(input.radiusM).toBe(500);
    expect(input.lat).toBe(NAGOYA_STATION.lat);
    expect(input.lng).toBe(NAGOYA_STATION.lng);
  });

  it('accepts timePreset values', () => {
    for (const preset of ['morning', 'noon', 'evening']) {
      const input = LandscapeInput.parse({
        lat: NAGOYA_STATION.lat,
        lng: NAGOYA_STATION.lng,
        timePreset: preset,
      });
      expect(input.timePreset).toBe(preset);
    }
  });

  it('rejects invalid timePreset', () => {
    expect(() =>
      LandscapeInput.parse({
        lat: NAGOYA_STATION.lat,
        lng: NAGOYA_STATION.lng,
        timePreset: 'midnight',
      }),
    ).toThrow();
  });

  it('validates a sample LandscapeOutput structure', () => {
    const sampleOutput = {
      sunPosition: { altitudeDeg: 60, azimuthDeg: 180, dateTime: '2026-05-07T12:00:00.000Z' },
      nearbyBuildingCount: 5,
      maxHeight: 247,
      avgHeight: 150,
      totalShadowAreaSqm: 12000,
      sunlightHoursEstimate: 6.5,
      shadowPolygons: [
        { buildingName: 'テストビル', height: 200, shadowLengthM: 50, polygon: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ],
      highImpactBuildings: [
        { name: 'テストビル', height: 200, distance: 100 },
      ],
      keyInsights: ['高層ビルの影響あり'],
    };
    expect(() => LandscapeOutput.parse(sampleOutput)).not.toThrow();
  });
});

describe('Sun position calculation', () => {
  it('noon sun in Nagoya should have positive altitude', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'noon',
    });
    expect(result.sunPosition.altitudeDeg).toBeGreaterThan(0);
  });

  it('morning preset should produce lower altitude than noon', () => {
    const morning = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'morning',
    });
    const noon = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'noon',
    });
    expect(morning.sunPosition.altitudeDeg).toBeLessThan(noon.sunPosition.altitudeDeg);
  });

  it('evening preset should produce lower altitude than noon', () => {
    const evening = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'evening',
    });
    const noon = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'noon',
    });
    expect(evening.sunPosition.altitudeDeg).toBeLessThan(noon.sunPosition.altitudeDeg);
  });
});

describe('Shadow simulation integration (Nagoya station area)', () => {
  it('finds nearby buildings in Nagoya station area', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
    });
    expect(result.nearbyBuildingCount).toBeGreaterThan(0);
  });

  it('nearbyBuildingCount should be > 0', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 1000,
    });
    expect(result.nearbyBuildingCount).toBeGreaterThan(0);
  });

  it('maxHeight should reflect Midland Square (247m)', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
    });
    expect(result.maxHeight).toBe(247);
  });

  it('shadowPolygons array should have entries for found buildings', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
    });
    expect(result.shadowPolygons.length).toBeGreaterThan(0);
    expect(result.shadowPolygons.length).toBeLessThanOrEqual(result.nearbyBuildingCount);
  });

  it('each shadow polygon should have 4+ coordinate pairs if polygon is non-empty', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
    });
    for (const sp of result.shadowPolygons) {
      if (sp.polygon.length > 0) {
        expect(sp.polygon.length).toBeGreaterThanOrEqual(4);
      }
    }
    // At least verify the structure exists
    expect(Array.isArray(result.shadowPolygons)).toBe(true);
  });

  it('generates markdown report when includeMarkdown is true', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport!.length).toBeGreaterThan(0);
  });

  it('markdown report is undefined when includeMarkdown is false', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      includeMarkdown: false,
    });
    expect(result.markdownReport).toBeUndefined();
  });

  it('Tokyo returns 0 buildings (no plateau data)', () => {
    const result = simulateLandscape({
      prefecture: '東京都',
      lat: 35.6812,
      lng: 139.7671,
      radiusM: 500,
    });
    expect(result.nearbyBuildingCount).toBe(0);
    expect(result.shadowPolygons).toHaveLength(0);
  });

  it('highImpactBuildings contains buildings with shadow_impact high', () => {
    const result = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
    });
    expect(result.highImpactBuildings.length).toBeGreaterThan(0);
    for (const b of result.highImpactBuildings) {
      expect(b.name).toBeDefined();
      expect(b.height).toBeGreaterThan(0);
      expect(b.distance).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Time preset shadow comparison', () => {
  it('morning preset creates longer shadows than noon', () => {
    const morning = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'morning',
    });
    const noon = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'noon',
    });
    expect(morning.totalShadowAreaSqm).toBeGreaterThan(noon.totalShadowAreaSqm);
  });

  it('noon shadows should be shorter (high sun angle)', () => {
    const noon = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'noon',
    });
    const evening = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'evening',
    });
    expect(noon.totalShadowAreaSqm).toBeLessThan(evening.totalShadowAreaSqm);
  });

  it('evening shadows should be similar to morning (low sun angle)', () => {
    const morning = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'morning',
    });
    const evening = simulateLandscape({
      prefecture: '愛知県',
      lat: NAGOYA_STATION.lat,
      lng: NAGOYA_STATION.lng,
      radiusM: 500,
      timePreset: 'evening',
    });
    const ratio = morning.totalShadowAreaSqm / evening.totalShadowAreaSqm;
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(3.0);
  });
});
