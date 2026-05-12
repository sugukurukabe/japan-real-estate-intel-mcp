/**
 * Unit tests for src/api-client/* modules.
 *
 * All HTTP calls are mocked with vi.stubGlobal('fetch', ...) so no real
 * network requests are made. API keys are not required to run these tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MlitClient, transactionsToCsv, landPriceToCsv } from '../src/api-client/mlit.js';
import { EstatClient, populationToCsv } from '../src/api-client/estat.js';
import type { MlitApiResponse, EstatApiResponse } from '../src/api-client/types.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MLIT_FIXTURE: MlitApiResponse = {
  data: [
    {
      Type: '宅地(土地と建物)',
      Region: '住宅地',
      MunicipalityCode: '23101',
      Prefecture: '愛知県',
      Municipality: '名古屋市中区',
      DistrictName: '丸の内',
      TradePrice: '45000000',
      PricePerUnit: '',
      FloorPlan: '4LDK',
      Area: '150',
      UnitPrice: '300000',
      LandShape: 'ほぼ整形',
      BuildingYear: '2010年',
      Structure: 'ＲＣ',
      Use: '住宅',
      CityPlanning: '第1種住居地域',
      CoverageRatio: '60',
      FloorAreaRatio: '200',
      Period: '2025年第1四半期',
      Renovation: '',
      Remarks: '',
      PriceCategory: '不動産取引価格情報',
      DistrictCode: '231010001',
    },
    {
      Type: '中古マンション等',
      Region: '商業地',
      MunicipalityCode: '23101',
      Prefecture: '愛知県',
      Municipality: '名古屋市中区',
      DistrictName: '栄',
      TradePrice: '8000000',
      PricePerUnit: '',
      FloorPlan: '1LDK',
      Area: '50',
      UnitPrice: '160000',
      LandShape: '',
      BuildingYear: '2015年',
      Structure: 'ＲＣ',
      Use: '住宅',
      CityPlanning: '商業地域',
      CoverageRatio: '80',
      FloorAreaRatio: '500',
      Period: '2025年第2四半期',
      Renovation: '',
      Remarks: '',
      PriceCategory: '不動産取引価格情報',
      DistrictCode: '231010002',
    },
    {
      // record with zero UnitPrice — should be filtered out in toTransactionRows
      Type: '農地',
      Region: '農地',
      MunicipalityCode: '23901',
      Prefecture: '愛知県',
      Municipality: '西尾市',
      DistrictName: '吉良',
      TradePrice: '500000',
      PricePerUnit: '',
      FloorPlan: '',
      Area: '200',
      UnitPrice: '',  // empty → filtered
      LandShape: '不整形',
      BuildingYear: '',
      Structure: '',
      Use: '農地',
      CityPlanning: '市街化調整区域',
      CoverageRatio: '',
      FloorAreaRatio: '',
      Period: '2025年第1四半期',
      Renovation: '',
      Remarks: '',
      PriceCategory: '不動産取引価格情報',
      DistrictCode: '239010001',
    },
  ],
};

const ESTAT_FIXTURE: EstatApiResponse = {
  GET_STATS_DATA: {
    STATISTICAL_DATA: {
      CLASS_INF: {
        CLASS_OBJ: [
          {
            '@id': 'area',
            '@name': '地域',
            CLASS: [
              { '@code': '23101', '@name': '名古屋市中区' },
              { '@code': '23102', '@name': '名古屋市東区' },
            ],
          },
          {
            '@id': 'cat01',
            '@name': '男女別人口及び世帯数',
            CLASS: [
              { '@code': 'T000849001', '@name': '人口総数' },
              { '@code': 'T000849002', '@name': '世帯数' },
            ],
          },
        ],
      },
      DATA_INF: {
        VALUE: [
          { '@area': '23101', '@time': '2020100000', '@cat01': 'T000849001', $: '81512' },
          { '@area': '23101', '@time': '2020100000', '@cat01': 'T000849002', $: '47389' },
          { '@area': '23102', '@time': '2020100000', '@cat01': 'T000849001', $: '74118' },
          { '@area': '23102', '@time': '2020100000', '@cat01': 'T000849002', $: '39204' },
        ],
      },
    },
  },
};

// ── Mock helpers ──────────────────────────────────────────────────────────────

function mockFetchSuccess(body: unknown): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }));
}

function mockFetchError(status: number, message: string): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(message),
    json: () => Promise.resolve({ error: message }),
  }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MlitClient', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  describe('fetchTransactions', () => {
    it('returns transaction array on success', async () => {
      mockFetchSuccess(MLIT_FIXTURE);
      const client = new MlitClient('test-key');
      const result = await client.fetchTransactions('aichi', 2025);
      expect(result).toHaveLength(3);
      expect(result[0].Municipality).toBe('名古屋市中区');
    });

    it('passes correct headers and URL parameters', async () => {
      const mockFn = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve(MLIT_FIXTURE),
      });
      vi.stubGlobal('fetch', mockFn);
      const client = new MlitClient('my-api-key');
      await client.fetchTransactions('tokyo', 2025, 2);
      const [url, opts] = mockFn.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('XIT001');
      expect(url).toContain('area=13'); // Tokyo = 13
      expect(url).toContain('year=2025');
      expect(url).toContain('quarter=2');
      expect((opts?.headers as Record<string, string>)?.['Ocp-Apim-Subscription-Key']).toBe('my-api-key');
    });

    it('throws on HTTP error', async () => {
      mockFetchError(401, 'Unauthorized');
      const client = new MlitClient('bad-key');
      await expect(client.fetchTransactions('aichi', 2025)).rejects.toThrow('401');
    });

    it('throws for unknown prefecture key', async () => {
      const client = new MlitClient('key');
      await expect(client.fetchTransactions('okinawa', 2025)).rejects.toThrow('okinawa');
    });
  });

  describe('toTransactionRows', () => {
    it('filters out records with zero UnitPrice', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      expect(rows).toHaveLength(2); // 3rd record has empty UnitPrice
    });

    it('parses Period string to year and quarter', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      expect(rows[0].year).toBe(2025);
      expect(rows[0].quarter).toBe(1);
      expect(rows[1].quarter).toBe(2);
    });

    it('maps Municipality and DistrictName to city/district', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      expect(rows[0].city).toBe('名古屋市中区');
      expect(rows[0].district).toBe('丸の内');
    });

    it('parses UnitPrice to numeric price_per_sqm', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      expect(rows[0].price_per_sqm).toBe(300000);
      expect(rows[1].price_per_sqm).toBe(160000);
    });
  });

  describe('toLandPriceRows', () => {
    it('aggregates by city × district and returns median price', () => {
      const client = new MlitClient('key');
      const rows = client.toLandPriceRows(MLIT_FIXTURE.data, 2025);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.price_per_sqm > 0)).toBe(true);
    });

    it('filters to specified year', () => {
      const client = new MlitClient('key');
      const rows2024 = client.toLandPriceRows(MLIT_FIXTURE.data, 2024);
      expect(rows2024).toHaveLength(0); // all fixture data is 2025
    });

    it('row structure matches land_price.csv schema', () => {
      const client = new MlitClient('key');
      const rows = client.toLandPriceRows(MLIT_FIXTURE.data, 2025);
      const row = rows[0];
      expect(typeof row.year).toBe('number');
      expect(typeof row.city).toBe('string');
      expect(typeof row.district).toBe('string');
      expect(typeof row.price_per_sqm).toBe('number');
      expect(typeof row.change_rate).toBe('number');
    });
  });

  describe('transactionsToCsv', () => {
    it('produces CSV with correct header', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      const csv = transactionsToCsv(rows);
      expect(csv.split('\n')[0]).toContain('year,quarter,city');
    });

    it('produces one data row per filtered record', () => {
      const client = new MlitClient('key');
      const rows = client.toTransactionRows(MLIT_FIXTURE.data);
      const lines = transactionsToCsv(rows).split('\n');
      expect(lines.length).toBe(rows.length + 1); // header + rows
    });
  });

  describe('landPriceToCsv', () => {
    it('produces CSV with year,city,district,... header', () => {
      const client = new MlitClient('key');
      const rows = client.toLandPriceRows(MLIT_FIXTURE.data, 2025);
      const csv = landPriceToCsv(rows);
      expect(csv.split('\n')[0]).toBe('year,city,district,address,land_use,price_per_sqm,change_rate,lat,lng');
    });
  });
});

describe('EstatClient', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  describe('fetchPopulation', () => {
    it('returns e-Stat API response on success', async () => {
      mockFetchSuccess(ESTAT_FIXTURE);
      const client = new EstatClient('test-app-id');
      const result = await client.fetchPopulation('aichi');
      expect(result.GET_STATS_DATA).toBeDefined();
    });

    it('includes appId in request URL', async () => {
      const mockFn = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve(ESTAT_FIXTURE),
      });
      vi.stubGlobal('fetch', mockFn);
      const client = new EstatClient('my-app-id');
      await client.fetchPopulation('osaka');
      const [url] = mockFn.mock.calls[0] as [string];
      expect(url).toContain('appId=my-app-id');
      expect(url).toContain('cdAreaFrom=27100'); // Osaka = 27
    });

    it('throws on HTTP error', async () => {
      mockFetchError(403, 'Forbidden');
      const client = new EstatClient('bad-id');
      await expect(client.fetchPopulation('aichi')).rejects.toThrow('403');
    });

    it('throws for unknown prefecture key', async () => {
      const client = new EstatClient('id');
      await expect(client.fetchPopulation('okinawa')).rejects.toThrow('okinawa');
    });
  });

  describe('toPopulationRows', () => {
    it('returns one row per municipality', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      expect(rows).toHaveLength(2);
    });

    it('maps area code to city name via CLASS_INF', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const chiku = rows.find((r) => r.city === '名古屋市中区');
      expect(chiku).toBeDefined();
      expect(chiku!.population_2020).toBe(81512);
    });

    it('extracts household count', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const chiku = rows.find((r) => r.city === '名古屋市中区');
      expect(chiku!.households_2020).toBe(Math.round(81512 * 0.42));
    });

    it('estimates population_2025 and households_2025', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const row = rows[0];
      expect(row.population_2025).toBeGreaterThan(0);
      expect(row.population_2025).toBeLessThan(row.population_2020 * 1.1);
    });

    it('row structure matches population.csv schema', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const row = rows[0];
      expect(typeof row.city).toBe('string');
      expect(typeof row.population_2020).toBe('number');
      expect(typeof row.households_2020).toBe('number');
      expect(typeof row.aging_rate).toBe('number');
    });
  });

  describe('populationToCsv', () => {
    it('has correct header', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const csv = populationToCsv(rows);
      expect(csv.split('\n')[0]).toBe(
        'city,population_2020,population_2025,households_2020,households_2025,density_per_sqkm,aging_rate',
      );
    });

    it('produces one data row per municipality', () => {
      const client = new EstatClient('id');
      const rows = client.toPopulationRows(ESTAT_FIXTURE);
      const lines = populationToCsv(rows).split('\n');
      expect(lines.length).toBe(rows.length + 1);
    });
  });
});
