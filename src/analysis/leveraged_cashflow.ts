import type {
  LeveragedCashflowInput,
  LeveragedCashflowOutput,
  LeveragedCashflowYear,
  LeveragedPaymentType,
} from '../schemas.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { resolvePrefecture } from '../prefecture/resolver.js';

interface ProjectionParams {
  input: LeveragedCashflowInput;
  interestRatePct: number;
  vacancyRate: number;
}

const STRUCTURE_DEPRECIATION_YEARS: Record<string, number> = {
  mansion: 47,
  building: 39,
  office: 39,
  store: 34,
  mixed: 39,
  house: 22,
  land: 1,
};

function roundYen(value: number): number {
  return Math.round(value);
}

function roundPct(value: number): number {
  return Math.round(value * 10) / 10;
}

function nullableRoundPct(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : roundPct(value);
}

function depreciationYears(input: LeveragedCashflowInput): number {
  return (
    input.assumptions.depreciationYears ?? STRUCTURE_DEPRECIATION_YEARS[input.propertyType] ?? 39
  );
}

function loanAmount(input: LeveragedCashflowInput): number {
  return input.loan.loanAmount ?? roundYen(input.askingPrice * (input.loan.ltvPct / 100));
}

function initialEquity(input: LeveragedCashflowInput, amount: number): number {
  return roundYen(input.askingPrice + input.purchaseCost + input.renovationCost - amount);
}

/** 年次・元利均等: 返済開始時点残高 B、残返済年数 n のときの年間返済総額（元利合計） */
function annualPaymentEqualPayment(
  openingBalance: number,
  annualRate: number,
  amortYearsLeft: number,
): number {
  if (amortYearsLeft <= 0 || openingBalance <= 0) return 0;
  if (annualRate === 0) return openingBalance / amortYearsLeft;
  const f = Math.pow(1 + annualRate, amortYearsLeft);
  return openingBalance * ((annualRate * f) / (f - 1));
}

function publicDashboardDeepLink(searchParams: string): string {
  const base = (process.env.MCP_PUBLIC_URL ?? 'https://realestate-mcp.jp').replace(/\/$/, '');
  return `${base}/ui/dashboard.html?${searchParams}`;
}

function computeIrr(cashflows: number[]): number | null {
  if (!cashflows.some((v) => v > 0) || !cashflows.some((v) => v < 0)) return null;

  let rate = 0.08;
  for (let i = 0; i < 100; i += 1) {
    let npv = 0;
    let derivative = 0;
    cashflows.forEach((cf, year) => {
      const discount = Math.pow(1 + rate, year);
      npv += cf / discount;
      if (year > 0) {
        derivative -= (year * cf) / Math.pow(1 + rate, year + 1);
      }
    });
    if (Math.abs(npv) < 1) return roundPct(rate * 100);
    if (derivative === 0) break;
    const next = rate - npv / derivative;
    if (!Number.isFinite(next) || next <= -0.99 || next > 10) break;
    rate = next;
  }

  return null;
}

function terminalSaleProceeds(
  input: LeveragedCashflowInput,
  finalNoi: number,
  loanBalance: number,
): number | null {
  const exitCap = input.assumptions.exitCapRatePct;
  if (exitCap == null || exitCap <= 0 || finalNoi <= 0) return null;
  const grossSale = finalNoi / (exitCap / 100);
  const exitCost = grossSale * (input.assumptions.exitCostPct / 100);
  return roundYen(Math.max(0, grossSale - exitCost - loanBalance));
}

function applyLoanYear(params: {
  yearIndex: number;
  openingBalance: number;
  interestOnlyYears: number;
  amortYears: number;
  annualRate: number;
  paymentType: LeveragedPaymentType;
  equalPaymentFixed: number | null;
  equalPrincipalFixed: number | null;
}): {
  interestPayment: number;
  principalPayment: number;
  debtService: number;
  closingBalance: number;
  equalPaymentFixed: number | null;
  equalPrincipalFixed: number | null;
} {
  const { yearIndex, openingBalance, interestOnlyYears, amortYears, annualRate, paymentType } =
    params;

  if (openingBalance <= 0) {
    return {
      interestPayment: 0,
      principalPayment: 0,
      debtService: 0,
      closingBalance: 0,
      equalPaymentFixed: params.equalPaymentFixed,
      equalPrincipalFixed: params.equalPrincipalFixed,
    };
  }

  let equalPaymentFixed = params.equalPaymentFixed;
  let equalPrincipalFixed = params.equalPrincipalFixed;

  const interestPayment = roundYen(openingBalance * annualRate);

  if (yearIndex <= interestOnlyYears || amortYears <= 0) {
    return {
      interestPayment,
      principalPayment: 0,
      debtService: interestPayment,
      closingBalance: roundYen(openingBalance),
      equalPaymentFixed,
      equalPrincipalFixed,
    };
  }

  if (paymentType === 'equal_payment' && equalPaymentFixed === null) {
    equalPaymentFixed = roundYen(annualPaymentEqualPayment(openingBalance, annualRate, amortYears));
  }
  if (paymentType === 'equal_principal' && equalPrincipalFixed === null) {
    equalPrincipalFixed = roundYen(openingBalance / amortYears);
  }

  let principalPayment = 0;
  let debtService = 0;

  if (paymentType === 'equal_principal') {
    const pr = equalPrincipalFixed ?? roundYen(openingBalance / amortYears);
    principalPayment = Math.min(openingBalance, pr);
    debtService = interestPayment + principalPayment;
  } else {
    const targetTotal =
      equalPaymentFixed ??
      roundYen(annualPaymentEqualPayment(openingBalance, annualRate, amortYears));
    principalPayment = Math.min(openingBalance, Math.max(0, targetTotal - interestPayment));
    debtService = interestPayment + principalPayment;
  }

  return {
    interestPayment,
    principalPayment: roundYen(principalPayment),
    debtService: roundYen(debtService),
    closingBalance: roundYen(Math.max(0, openingBalance - principalPayment)),
    equalPaymentFixed,
    equalPrincipalFixed,
  };
}

function projectRows(params: ProjectionParams): {
  rows: LeveragedCashflowYear[];
  terminalSale: number | null;
  irr: number | null;
  equityMultiple: number | null;
  initialEquity: number;
  loanAmount: number;
} {
  const { input, interestRatePct, vacancyRate } = params;
  const amount = loanAmount(input);
  const equity = initialEquity(input, amount);
  const depYears = depreciationYears(input);
  const buildingBasis = (input.askingPrice + input.renovationCost) * (1 - input.landValueRatio);
  const annualDepreciation = input.propertyType === 'land' ? 0 : roundYen(buildingBasis / depYears);
  const taxRate = input.assumptions.marginalTaxRatePct / 100;
  let balance = amount;
  let cumulativeAfterTaxCashflow = 0;
  const rows: LeveragedCashflowYear[] = [];

  const annualRate = interestRatePct / 100;
  const io = input.loan.interestOnlyYears;
  const amortYears = Math.max(0, input.loan.termYears - io);
  let equalPaymentFixed: number | null = null;
  let equalPrincipalFixed: number | null = null;

  for (let year = 1; year <= input.assumptions.simulationYears; year += 1) {
    const growthPower = year - 1;
    const grossRent = roundYen(
      input.annualRent * Math.pow(1 + input.assumptions.rentGrowthPct / 100, growthPower),
    );
    const otherIncome = roundYen(
      input.otherIncomeAnnual * Math.pow(1 + input.assumptions.rentGrowthPct / 100, growthPower),
    );
    const vacancyLoss = roundYen(grossRent * vacancyRate);
    const effectiveIncome = roundYen(grossRent + otherIncome - vacancyLoss);
    const operatingExpense = roundYen(
      (input.operatingExpenseAnnual + input.annualCapex) *
        Math.pow(1 + input.assumptions.expenseGrowthPct / 100, growthPower),
    );
    const propertyTax = roundYen(
      input.propertyTaxAnnual * Math.pow(1 + input.assumptions.expenseGrowthPct / 100, growthPower),
    );
    const noi = roundYen(effectiveIncome - operatingExpense - propertyTax);

    const loanStep = applyLoanYear({
      yearIndex: year,
      openingBalance: balance,
      interestOnlyYears: io,
      amortYears,
      annualRate,
      paymentType: input.loan.paymentType,
      equalPaymentFixed,
      equalPrincipalFixed,
    });
    equalPaymentFixed = loanStep.equalPaymentFixed;
    equalPrincipalFixed = loanStep.equalPrincipalFixed;
    balance = loanStep.closingBalance;

    const beforeTaxCashflow = roundYen(noi - loanStep.debtService);
    const taxableIncome = roundYen(noi - loanStep.interestPayment - annualDepreciation);
    const estimatedTax = roundYen(Math.max(0, taxableIncome * taxRate));
    const afterTaxCashflow = roundYen(beforeTaxCashflow - estimatedTax);
    cumulativeAfterTaxCashflow = roundYen(cumulativeAfterTaxCashflow + afterTaxCashflow);
    rows.push({
      year,
      grossRent,
      vacancyLoss,
      effectiveIncome,
      operatingExpense,
      propertyTax,
      noi,
      interestPayment: loanStep.interestPayment,
      principalPayment: loanStep.principalPayment,
      debtService: loanStep.debtService,
      beforeTaxCashflow,
      depreciation: annualDepreciation,
      taxableIncome,
      estimatedTax,
      afterTaxCashflow,
      loanBalance: loanStep.closingBalance,
      cumulativeAfterTaxCashflow,
      dscr: loanStep.debtService > 0 ? roundPct(noi / loanStep.debtService) : null,
    });
  }

  const terminalSale = terminalSaleProceeds(input, rows[rows.length - 1]?.noi ?? 0, balance);
  const cashflows = [-equity, ...rows.map((row) => row.afterTaxCashflow)];
  if (terminalSale != null && cashflows.length > 1) {
    cashflows[cashflows.length - 1] += terminalSale;
  }

  const sumOperatingCf = rows.reduce((s, row) => s + row.afterTaxCashflow, 0);
  const totalEquityDistributions = sumOperatingCf + (terminalSale ?? 0);
  const equityMultiple =
    equity > 0 ? Math.round((totalEquityDistributions / equity) * 100) / 100 : null;

  return {
    rows,
    terminalSale,
    irr: computeIrr(cashflows),
    equityMultiple,
    initialEquity: equity,
    loanAmount: amount,
  };
}

function buildSensitivity(input: LeveragedCashflowInput): LeveragedCashflowOutput['sensitivity'] {
  const scenarios = [
    { label: '金利-0.5% / 空室率-3pt', rateDelta: -0.5, vacancyDelta: -0.03 },
    { label: '基準', rateDelta: 0, vacancyDelta: 0 },
    { label: '金利+0.5% / 空室率+3pt', rateDelta: 0.5, vacancyDelta: 0.03 },
    { label: '金利+1.0% / 空室率+5pt', rateDelta: 1.0, vacancyDelta: 0.05 },
  ];

  return scenarios.map((scenario) => {
    const interestRatePct = Math.max(0, input.loan.interestRatePct + scenario.rateDelta);
    const vacancyRate = Math.min(0.95, Math.max(0, input.vacancyRate + scenario.vacancyDelta));
    const projection = projectRows({ input, interestRatePct, vacancyRate });
    const dscrs = projection.rows.map((row) => row.dscr).filter((v): v is number => v != null);
    return {
      label: scenario.label,
      interestRatePct: roundPct(interestRatePct),
      vacancyRate: roundPct(vacancyRate * 100),
      tenYearIrrPct: projection.irr,
      totalAfterTaxCashflow:
        projection.rows[projection.rows.length - 1]?.cumulativeAfterTaxCashflow ?? 0,
      minDscr: dscrs.length > 0 ? Math.min(...dscrs) : null,
    };
  });
}

function buildRedFlags(
  rows: LeveragedCashflowYear[],
  minDscr: number | null,
  year1CashOnCashPct: number | null,
): string[] {
  const flags: string[] = [];
  if (minDscr != null && minDscr < 1.1) flags.push(`最低DSCRが${minDscr}倍で返済余力が薄い`);
  if (rows.some((row) => row.afterTaxCashflow < 0))
    flags.push('税引後キャッシュフローが赤字の年がある');
  if (year1CashOnCashPct != null && year1CashOnCashPct < 2)
    flags.push(`初年度CCRが${year1CashOnCashPct}%で低い`);
  const y1 = rows[0];
  if (y1 && y1.estimatedTax > y1.beforeTaxCashflow) {
    flags.push('税額が税前キャッシュフローを上回る年があり、手元資金に注意');
  }
  return flags;
}

function buildRecommendations(redFlags: string[], input: LeveragedCashflowInput): string[] {
  const recommendations: string[] = [];
  if (redFlags.some((flag) => flag.includes('DSCR'))) {
    recommendations.push('LTVを下げる、返済期間を延ばす、または金利条件を再交渉する');
  }
  if (redFlags.some((flag) => flag.includes('赤字'))) {
    recommendations.push('賃料査定・空室率・修繕費の前提を保守的に見直す');
  }
  if (input.assumptions.exitCapRatePct == null) {
    recommendations.push('出口価格を評価するため、売却時キャップレートを設定して再試算する');
  }
  if (recommendations.length === 0) {
    recommendations.push('基準シナリオは返済余力が概ね確保されている。金利上昇シナリオも確認する');
  }
  return recommendations;
}

function formatYen(value: number | null): string {
  if (value == null) return 'N/A';
  return `¥${value.toLocaleString()}`;
}

function buildMarkdownReport(
  input: LeveragedCashflowInput,
  output: Omit<LeveragedCashflowOutput, 'markdownReport'>,
): string {
  const yr = input.assumptions.simulationYears;
  const yearly = output.yearlyRows
    .map(
      (row) =>
        `| ${row.year} | ${formatYen(row.noi)} | ${formatYen(row.debtService)} | ${formatYen(row.afterTaxCashflow)} | ${formatYen(row.loanBalance)} | ${row.dscr ?? 'N/A'} |`,
    )
    .join('\n');
  const sensitivity = output.sensitivity
    .map(
      (row) =>
        `| ${row.label} | ${row.interestRatePct}% | ${row.vacancyRate}% | ${row.tenYearIrrPct ?? 'N/A'}% | ${row.minDscr ?? 'N/A'} |`,
    )
    .join('\n');
  const flags =
    output.redFlags.length > 0
      ? output.redFlags.map((flag) => `- ${flag}`).join('\n')
      : '- 重大なレッドフラグなし';
  const recommendations = output.recommendations.map((rec) => `- ${rec}`).join('\n');

  return `# レバレッジ${yr}年キャッシュフロー試算

**対象**: ${input.prefecture}${input.city}${input.district ? ` ${input.district}` : ''}（${input.propertyType}）
**購入価格**: ${formatYen(input.askingPrice)}
**借入**: ${formatYen(output.summaryKpis.loanAmount)} / LTV ${output.summaryKpis.ltvPct}% / 年利 ${output.assumptions.interestRatePct}% / ${output.assumptions.termYears}年（${input.loan.paymentType === 'equal_payment' ? '元利均等' : '元金均等'}）

## 主要KPI

- 初期自己資金: ${formatYen(output.summaryKpis.initialEquity)}
- 初年度NOI: ${formatYen(output.summaryKpis.year1Noi)}
- 初年度DSCR: ${output.summaryKpis.year1Dscr ?? 'N/A'}倍
- 初年度CCR: ${output.summaryKpis.year1CashOnCashPct ?? 'N/A'}%
- 最低DSCR: ${output.summaryKpis.minDscr ?? 'N/A'}倍
- ${yr}年税引後CF累計（運用）: ${formatYen(output.summaryKpis.totalAfterTaxCashflow)}
- 売却控除後手取り: ${formatYen(output.summaryKpis.terminalSaleProceeds)}
- ${yr}年期間IRR: ${output.summaryKpis.tenYearIrrPct ?? 'N/A'}%
- Equity Multiple（運用CF+売却手取り / 自己資金）: ${output.summaryKpis.equityMultiple ?? 'N/A'}倍

## 年次プロフォーマ

| 年 | NOI | 返済額 | 税引後CF | 期末借入残高 | DSCR |
|---:|---:|---:|---:|---:|---:|
${yearly}

## 感応度（空室率は%表示）

| シナリオ | 金利(年%) | 空室率(%) | ${yr}年期間IRR(%) | 最低DSCR |
|---|---:|---:|---:|---:|
${sensitivity}

## レッドフラグ

${flags}

## 推奨アクション

${recommendations}

---
税務計算は簡易推計です。実際の投資判断・税務申告・融資判断には税理士、金融機関、不動産鑑定士等の専門家確認を併用してください。

${ATTRIBUTION}
`;
}

export async function simulateLeveragedCashflow(
  input: LeveragedCashflowInput,
): Promise<LeveragedCashflowOutput> {
  const yr = input.assumptions.simulationYears;
  const projection = projectRows({
    input,
    interestRatePct: input.loan.interestRatePct,
    vacancyRate: input.vacancyRate,
  });
  const rows = projection.rows;
  const dscrs = rows.map((row) => row.dscr).filter((v): v is number => v != null);
  const minDscr = dscrs.length > 0 ? Math.min(...dscrs) : null;
  const year1 = rows[0];
  const totalAfterTaxCashflow = rows[rows.length - 1]?.cumulativeAfterTaxCashflow ?? 0;
  const year1CashOnCashPct =
    projection.initialEquity > 0 && year1
      ? roundPct((year1.afterTaxCashflow / projection.initialEquity) * 100)
      : null;
  const redFlags = buildRedFlags(rows, minDscr, year1CashOnCashPct);
  const recommendations = buildRecommendations(redFlags, input);
  const ltvPct = roundPct((projection.loanAmount / input.askingPrice) * 100);
  const prefKey = resolvePrefecture(input.prefecture) || input.prefecture;
  const dashParams = new URLSearchParams({
    prefecture: prefKey,
    area: input.city,
    mode: 'cashflow',
    years: String(yr),
  });
  const dashboardUri = publicDashboardDeepLink(dashParams.toString());

  const baseOutput = {
    prefecture: input.prefecture,
    city: input.city,
    district: input.district ?? null,
    summary: `${input.city}: ${yr}年期間IRR ${projection.irr ?? 'N/A'}%、最低DSCR ${minDscr ?? 'N/A'}倍、税引後CF累計 ${formatYen(totalAfterTaxCashflow)}`,
    summaryKpis: {
      initialEquity: projection.initialEquity,
      loanAmount: projection.loanAmount,
      ltvPct,
      annualDebtServiceYear1: year1?.debtService ?? 0,
      year1Noi: year1?.noi ?? 0,
      year1Dscr: year1?.dscr ?? null,
      year1CashOnCashPct: nullableRoundPct(year1CashOnCashPct),
      minDscr,
      totalAfterTaxCashflow,
      terminalSaleProceeds: projection.terminalSale,
      tenYearIrrPct: projection.irr,
      equityMultiple: projection.equityMultiple,
    },
    assumptions: {
      simulationYears: input.assumptions.simulationYears,
      interestRatePct: input.loan.interestRatePct,
      termYears: input.loan.termYears,
      paymentType: input.loan.paymentType,
      rentGrowthPct: input.assumptions.rentGrowthPct,
      expenseGrowthPct: input.assumptions.expenseGrowthPct,
      vacancyRate: roundPct(input.vacancyRate * 100),
      depreciationYears: depreciationYears(input),
      marginalTaxRatePct: input.assumptions.marginalTaxRatePct,
    },
    yearlyRows: rows,
    sensitivity: buildSensitivity(input),
    redFlags,
    recommendations,
    dashboardUri,
    attribution: ATTRIBUTION,
  };

  return {
    ...baseOutput,
    markdownReport: buildMarkdownReport(input, baseOutput),
  };
}
