import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import { LeveragedCashflowInput, LeveragedCashflowOutput } from '../src/schemas.js';
import { simulateLeveragedCashflow } from '../src/analysis/leveraged_cashflow.js';

type RegisteredTool = {
  _meta?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  outputSchema?: unknown;
};

function sampleInput(overrides: Partial<LeveragedCashflowInput> = {}): LeveragedCashflowInput {
  return LeveragedCashflowInput.parse({
    prefecture: '愛知県',
    city: '名古屋市中区',
    district: '錦三丁目',
    propertyType: 'mansion',
    askingPrice: 48_000_000,
    purchaseCost: 2_000_000,
    renovationCost: 1_000_000,
    landValueRatio: 0.38,
    annualRent: 3_000_000,
    otherIncomeAnnual: 120_000,
    vacancyRate: 0.06,
    operatingExpenseAnnual: 520_000,
    propertyTaxAnnual: 180_000,
    annualCapex: 120_000,
    loan: {
      ltvPct: 70,
      interestRatePct: 2.1,
      termYears: 25,
      paymentType: 'equal_payment',
      interestOnlyYears: 0,
    },
    assumptions: {
      simulationYears: 10,
      rentGrowthPct: 1,
      expenseGrowthPct: 1.5,
      exitCapRatePct: 5,
      exitCostPct: 3,
      marginalTaxRatePct: 20,
    },
    output_mode: 'compact',
    ...overrides,
  });
}

describe('simulateLeveragedCashflow', () => {
  it('generates a 10-year pro-forma with debt service, tax, and KPIs', async () => {
    const output = await simulateLeveragedCashflow(sampleInput());
    const parsed = LeveragedCashflowOutput.parse(output);

    expect(parsed.yearlyRows).toHaveLength(10);
    expect(parsed.summaryKpis.loanAmount).toBe(33_600_000);
    expect(parsed.summaryKpis.initialEquity).toBe(17_400_000);
    expect(parsed.summaryKpis.year1Noi).toBeGreaterThan(0);
    expect(parsed.summaryKpis.annualDebtServiceYear1).toBeGreaterThan(0);
    expect(parsed.summaryKpis.year1Dscr).toBeGreaterThan(0);
    expect(parsed.yearlyRows[0].depreciation).toBeGreaterThan(0);
    expect(parsed.sensitivity).toHaveLength(4);
    expect(parsed.markdownReport).toMatch(/レバレッジ\d+年キャッシュフロー試算/);
  });

  it('keeps annual debt service flat for equal_payment (元利均等)', async () => {
    const output = await simulateLeveragedCashflow(sampleInput());
    const d0 = output.yearlyRows[0].debtService;
    const d1 = output.yearlyRows[1].debtService;
    expect(Math.abs(d0 - d1)).toBeLessThanOrEqual(1);
  });

  it('supports equal principal payments and reduces loan balance every year', async () => {
    const output = await simulateLeveragedCashflow(sampleInput({
      loan: {
        ltvPct: 65,
        interestRatePct: 2.5,
        termYears: 20,
        paymentType: 'equal_principal',
        interestOnlyYears: 0,
      },
    }));

    expect(output.yearlyRows[1].loanBalance).toBeLessThan(output.yearlyRows[0].loanBalance);
    expect(output.yearlyRows[0].principalPayment).toBeGreaterThan(0);
  });

  it('flags weak debt-service coverage', async () => {
    const output = await simulateLeveragedCashflow(sampleInput({
      annualRent: 1_600_000,
      vacancyRate: 0.18,
      loan: {
        ltvPct: 85,
        interestRatePct: 4.5,
        termYears: 20,
        paymentType: 'equal_payment',
        interestOnlyYears: 0,
      },
    }));

    expect(output.redFlags.some(flag => flag.includes('DSCR') || flag.includes('赤字'))).toBe(true);
  });

  it('is registered as an MCP App tool with output schema', () => {
    const server = createServer() as unknown as {
      _registeredTools: Record<string, RegisteredTool>;
    };
    const tool = server._registeredTools.simulate_leveraged_cashflow;

    expect(tool).toBeDefined();
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(tool.outputSchema).toBeDefined();
    expect(tool._meta?.['openai/outputTemplate']).toBe('ui://japan-real-estate-intel/dashboard');
    expect(tool._meta?.['openai/toolInvocation/invoking'] ?? '').toContain('レバレッジCF');
  });
});
