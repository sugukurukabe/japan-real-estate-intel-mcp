import type {
  PurchaseReviewInput,
  PurchaseReviewOutput,
  PurchaseReviewAxis,
  PurchaseDecision,
} from '../schemas.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { resolvePrefecture } from '../prefecture/resolver.js';

interface KeyNumbers {
  askingPrice: number;
  pricePerSqm: number | null;
  pricePerTsubo: number | null;
  kojiPricePerSqm: number | null;
  rosenkaPerSqm: number | null;
  transactionMedianPerSqm: number | null;
  askingToKojiRatio: number | null;
  askingToTransactionRatio: number | null;
  grossYield: number | null;
  netYield: number | null;
  downsideNetYield: number | null;
  paybackYears: number | null;
}

interface ClauseItem {
  clause: string;
  rationale: string;
  priority: 'must' | 'recommended' | 'optional';
}

function getAreaSqm(input: PurchaseReviewInput): number {
  return input.exclusiveAreaSqm ?? input.buildingAreaSqm ?? input.landAreaSqm ?? 0;
}

function calculatePriceAxis(input: PurchaseReviewInput, areaSqm: number): { axis: PurchaseReviewAxis; keyNumbers: Partial<KeyNumbers> } {
  const price = input.askingPrice;
  const pricePerSqm = areaSqm > 0 ? Math.round(price / areaSqm) : null;
  const pricePerTsubo = pricePerSqm != null ? Math.round(pricePerSqm * 3.305785) : null;

  let score = 60;
  const evidence: string[] = [];
  const keyNumbers: Partial<KeyNumbers> = {
    askingPrice: price,
    pricePerSqm,
    pricePerTsubo,
    kojiPricePerSqm: null,
    rosenkaPerSqm: null,
    transactionMedianPerSqm: null,
    askingToKojiRatio: null,
    askingToTransactionRatio: null,
  };

  if (input.kojiPricePerSqm != null && pricePerSqm != null) {
    const ratio = Math.round((pricePerSqm / input.kojiPricePerSqm) * 100) / 100;
    keyNumbers.kojiPricePerSqm = input.kojiPricePerSqm;
    keyNumbers.askingToKojiRatio = ratio;

    if (ratio < 0.9) {
      score += 20;
      evidence.push(`公示地価比${ratio}倍（割安）`);
    } else if (ratio > 1.3) {
      score -= 15;
      evidence.push(`公示地価比${ratio}倍（割高）`);
    } else {
      evidence.push(`公示地価比${ratio}倍（妥当）`);
    }
  }

  if (input.rosenkaPricePerSqm != null && pricePerSqm != null) {
    const ratio = Math.round((pricePerSqm / input.rosenkaPricePerSqm) * 100) / 100;
    keyNumbers.rosenkaPerSqm = input.rosenkaPricePerSqm;
    if (ratio < 0.85) {
      score += 15;
      evidence.push(`路線価比${ratio}倍（割安）`);
    } else if (ratio > 1.5) {
      score -= 10;
      evidence.push(`路線価比${ratio}倍（割高）`);
    }
  }

  if (input.transactionMedianPerSqm != null && pricePerSqm != null) {
    const ratio = Math.round((pricePerSqm / input.transactionMedianPerSqm) * 100) / 100;
    keyNumbers.transactionMedianPerSqm = input.transactionMedianPerSqm;
    keyNumbers.askingToTransactionRatio = ratio;

    if (ratio < 0.95) {
      score += 10;
      evidence.push(`取引相場比${ratio}倍（割安）`);
    } else if (ratio > 1.2) {
      score -= 10;
      evidence.push(`取引相場比${ratio}倍（割高）`);
    }
  }

  if (evidence.length === 0) {
    evidence.push('近隣相場データ未入力のため標準評価');
  }

  return {
    axis: {
      axis: 'price',
      label: '価格評価',
      score: Math.max(0, Math.min(100, Math.round(score))),
      summary: pricePerSqm != null
        ? `㎡単価¥${pricePerSqm.toLocaleString()}（公示比${keyNumbers.askingToKojiRatio ?? 'N/A'}倍）`
        : '面積データ未入力',
      evidence,
    },
    keyNumbers,
  };
}

function calculateYieldAxis(input: PurchaseReviewInput): { axis: PurchaseReviewAxis; keyNumbers: Partial<KeyNumbers> } {
  const price = input.askingPrice;
  const annualRent = input.expectedAnnualRent ?? input.currentAnnualRent ?? null;
  const operatingExpense = input.operatingExpenseAnnual ?? 0;

  let score = 55;
  const evidence: string[] = [];
  const keyNumbers: Partial<KeyNumbers> = {
    grossYield: null,
    netYield: null,
    downsideNetYield: null,
    paybackYears: null,
  };

  if (annualRent != null && annualRent > 0) {
    const grossYield = Math.round((annualRent / price) * 1000) / 10;
    keyNumbers.grossYield = grossYield;

    if (grossYield >= 8) {
      score += 20;
      evidence.push(`表面利回り${grossYield}%（高水準）`);
    } else if (grossYield >= 6) {
      score += 10;
      evidence.push(`表面利回り${grossYield}%（標準）`);
    } else if (grossYield >= 4) {
      score -= 5;
      evidence.push(`表面利回り${grossYield}%（やや低め）`);
    } else {
      score -= 15;
      evidence.push(`表面利回り${grossYield}%（低水準）`);
    }

    const payback = Math.round((price / annualRent) * 10) / 10;
    keyNumbers.paybackYears = payback;

    if (payback <= 12) {
      score += 10;
      evidence.push(`投資回収年数${payback}年（短期回収）`);
    } else if (payback <= 18) {
      evidence.push(`投資回収年数${payback}年（標準）`);
    } else {
      score -= 5;
      evidence.push(`投資回収年数${payback}年（長期回収）`);
    }
  }

  if (annualRent != null && operatingExpense > 0) {
    const noi = annualRent - operatingExpense;
    const netYield = Math.round((noi / price) * 1000) / 10;
    keyNumbers.netYield = netYield;

    if (netYield >= 5) {
      score += 10;
      evidence.push(`実質利回り${netYield}%（安定）`);
    } else if (netYield > 0) {
      evidence.push(`実質利回り${netYield}%`);
    } else {
      score -= 10;
      evidence.push('実質利回りマイナス（赤字運営）');
    }
  }

  if (evidence.length === 0) {
    evidence.push('賃貸収入データ未入力のため標準評価');
  }

  return {
    axis: {
      axis: 'yield',
      label: '利回り評価',
      score: Math.max(0, Math.min(100, Math.round(score))),
      summary: keyNumbers.grossYield != null
        ? `表面利回り${keyNumbers.grossYield}% / 回収${keyNumbers.paybackYears}年`
        : '賃貸データ未入力',
      evidence,
    },
    keyNumbers,
  };
}

function calculateRiskAxis(input: PurchaseReviewInput): PurchaseReviewAxis {
  let score = 65;
  const evidence: string[] = [];

  if (input.occupancyRate != null) {
    const vacancyRate = (1 - input.occupancyRate) * 100;
    if (vacancyRate >= 15) {
      score -= 15;
      evidence.push(`空室率${vacancyRate.toFixed(0)}%（高リスク）`);
    } else if (vacancyRate >= 8) {
      score -= 5;
      evidence.push(`空室率${vacancyRate.toFixed(0)}%（注意）`);
    } else {
      evidence.push(`空室率${vacancyRate.toFixed(0)}%（安定）`);
    }
  }

  if (input.buildingAge != null) {
    if (input.buildingAge >= 40) {
      score -= 15;
      evidence.push(`築${input.buildingAge}年（老朽化進行）`);
    } else if (input.buildingAge >= 25) {
      score -= 5;
      evidence.push(`築${input.buildingAge}年（中古注意）`);
    } else {
      evidence.push(`築${input.buildingAge}年（比較的新築）`);
    }
  }

  if (input.renovationCost != null && input.renovationCost > input.askingPrice * 0.2) {
    score -= 10;
    evidence.push('大規模修繕費が価格の20%超（要注意）');
  }

  if (evidence.length === 0) {
    evidence.push('リスクデータ未入力のため標準評価');
  }

  return {
    axis: 'risk',
    label: 'リスク評価',
    score: Math.max(0, Math.min(100, Math.round(score))),
    summary: '空室・老朽化・修繕リスクを総合評価',
    evidence,
  };
}

function calculateFutureAxis(input: PurchaseReviewInput): PurchaseReviewAxis {
  let score = 55;
  const evidence: string[] = [];

  if (input.recommenderClaim != null && input.recommenderClaim.length > 0) {
    score += 10;
    evidence.push(`仲介推奨理由あり: ${input.recommenderClaim.substring(0, 50)}...`);
  }

  if (input.structure != null) {
    const durableStructures = ['RC', 'SRC', '鉄骨'];
    if (durableStructures.some(s => input.structure!.includes(s))) {
      score += 10;
      evidence.push(`構造: ${input.structure}（耐久性高）`);
    }
  }

  if (evidence.length === 0) {
    evidence.push('将来性データ未入力のため標準評価');
  }

  return {
    axis: 'future',
    label: '将来性評価',
    score: Math.max(0, Math.min(100, Math.round(score))),
    summary: '構造・推奨理由から将来性を評価',
    evidence,
  };
}

function calculateContractAxis(input: PurchaseReviewInput): PurchaseReviewAxis {
  let score = 60;
  const evidence: string[] = [];
  const terms = input.proposedTerms;

  if (terms?.financingDays != null) {
    if (terms.financingDays >= 60) {
      score += 10;
      evidence.push(`融資期間${terms.financingDays}日（余裕あり）`);
    } else if (terms.financingDays >= 30) {
      evidence.push(`融資期間${terms.financingDays}日（標準）`);
    } else {
      score -= 10;
      evidence.push(`融資期間${terms.financingDays}日（短め）`);
    }
  }

  if (terms?.buildingInspection != null) {
    if (terms.buildingInspection) {
      score += 10;
      evidence.push('建物検査実施済み（安心）');
    } else {
      score -= 5;
      evidence.push('建物検査未実施（要確認）');
    }
  }

  if (terms?.defectLiabilityMonths != null) {
    if (terms.defectLiabilityMonths >= 24) {
      score += 10;
      evidence.push(`瑕疵担保${terms.defectLiabilityMonths}ヶ月（手厚い）`);
    } else if (terms.defectLiabilityMonths >= 12) {
      evidence.push(`瑕疵担保${terms.defectLiabilityMonths}ヶ月（標準）`);
    } else {
      score -= 10;
      evidence.push(`瑕疵担保${terms.defectLiabilityMonths}ヶ月（短め）`);
    }
  }

  if (terms?.existingLease != null) {
    if (terms.existingLease) {
      score -= 5;
      evidence.push('既存賃貸借あり（引継注意）');
    } else {
      evidence.push('既存賃貸借なし（即利用可）');
    }
  }

  if (evidence.length === 0) {
    evidence.push('契約条件データ未入力のため標準評価');
  }

  return {
    axis: 'contract',
    label: '契約条件評価',
    score: Math.max(0, Math.min(100, Math.round(score))),
    summary: '融資・検査・瑕疵・引渡し条件を総合評価',
    evidence,
  };
}

function determineDecision(overallScore: number, redFlags: string[]): PurchaseDecision {
  if (redFlags.length >= 4) return 'reject';
  if (overallScore >= 80) return 'buy';
  if (overallScore >= 65) return 'negotiate';
  if (overallScore >= 45) return 'hold';
  return 'reject';
}

function generateMarkdownReport(
  input: PurchaseReviewInput,
  axes: PurchaseReviewAxis[],
  overallScore: number,
  decision: PurchaseDecision,
  keyNumbers: KeyNumbers,
  redFlags: string[],
  negotiationPoints: string[],
  missingInfo: string[],
  recommendedClauses: ClauseItem[],
): string {
  const axisTable = axes
    .map(a => `| ${a.label} | ${a.score} | ${a.summary} |`)
    .join('\n');

  const redFlagSection = redFlags.length > 0
    ? redFlags.map(f => `- ⚠️ ${f}`).join('\n')
    : '- 重大なレッドフラグなし';

  const negotiationSection = negotiationPoints.length > 0
    ? negotiationPoints.map(p => `- ${p}`).join('\n')
    : '- 特に交渉ポイントなし';

  const missingSection = missingInfo.length > 0
    ? missingInfo.map(m => `- ${m}`).join('\n')
    : '- 特になし';

  const clauseSection = recommendedClauses.length > 0
    ? recommendedClauses.map(c => `- 【${c.priority}】${c.clause}（${c.rationale}）`).join('\n')
    : '- 標準条項で十分';

  const areaSqm = getAreaSqm(input);
  const areaTsubo = Math.round(areaSqm * 3.305785);

  return `# 購入審査レポート

**物件**: ${input.city}${input.district ? ` ${input.district}` : ''}（${input.propertyType}）
**販売価格**: ¥${input.askingPrice.toLocaleString()}（${areaSqm}㎡ / ${areaTsubo}坪）
**総合スコア**: **${overallScore}点**（${decision.toUpperCase()}）

## 5軸評価

| 評価軸 | スコア | 内容 |
|--------|--------|------|
${axisTable}

## 主要数値

- ㎡単価: ¥${keyNumbers.pricePerSqm?.toLocaleString() ?? 'N/A'}
- 坪単価: ¥${keyNumbers.pricePerTsubo?.toLocaleString() ?? 'N/A'}
- 公示地価比: ${keyNumbers.askingToKojiRatio != null ? `${keyNumbers.askingToKojiRatio}倍` : 'データなし'}
- 路線価比: ${keyNumbers.rosenkaPerSqm != null ? `¥${keyNumbers.rosenkaPerSqm.toLocaleString()}/㎡` : 'データなし'}
- 表面利回り: ${keyNumbers.grossYield != null ? `${keyNumbers.grossYield}%` : 'データなし'}
- 投資回収年数: ${keyNumbers.paybackYears != null ? `${keyNumbers.paybackYears}年` : 'データなし'}

## レッドフラグ

${redFlagSection}

## 交渉ポイント

${negotiationSection}

## 不足情報

${missingSection}

## 推奨特約条項

${clauseSection}

---
${ATTRIBUTION}
`;
}

export async function reviewPurchaseRecommendation(
  input: PurchaseReviewInput,
): Promise<PurchaseReviewOutput> {
  const areaSqm = getAreaSqm(input);

  const priceResult = calculatePriceAxis(input, areaSqm);
  const yieldResult = calculateYieldAxis(input);
  const riskAxis = calculateRiskAxis(input);
  const futureAxis = calculateFutureAxis(input);
  const contractAxis = calculateContractAxis(input);

  const axes: PurchaseReviewAxis[] = [
    priceResult.axis,
    yieldResult.axis,
    riskAxis,
    futureAxis,
    contractAxis,
  ];

  const overallScore = Math.round(
    axes.reduce((sum, a) => sum + a.score, 0) / axes.length
  );

  const redFlags: string[] = [];
  const negotiationPoints: string[] = [];
  const missingInfo: string[] = [];
  const recommendedClauses: ClauseItem[] = [];

  axes.forEach(axis => {
    if (axis.score < 40) {
      redFlags.push(`${axis.label}が低スコア（${axis.score}点）`);
    }
    axis.evidence.forEach(ev => {
      if (ev.includes('割高') || ev.includes('低水準') || ev.includes('赤字') || ev.includes('高リスク') || ev.includes('老朽化')) {
        redFlags.push(ev);
      }
      if (ev.includes('注意') || ev.includes('要確認') || ev.includes('短め')) {
        negotiationPoints.push(ev);
      }
    });
  });

  if (input.kojiPricePerSqm == null && input.rosenkaPricePerSqm == null) {
    missingInfo.push('公示地価・路線価データ未入力');
  }
  if (input.expectedAnnualRent == null && input.currentAnnualRent == null) {
    missingInfo.push('賃貸収入データ未入力（利回り未算出）');
  }
  if (input.proposedTerms?.buildingInspection == null) {
    missingInfo.push('建物検査の有無が不明');
  }

  if (input.proposedTerms?.defectLiabilityMonths != null && input.proposedTerms.defectLiabilityMonths < 24) {
    recommendedClauses.push({
      clause: '瑕疵担保責任期間を24ヶ月以上に延長',
      rationale: '現行の瑕疵担保期間が短いため',
      priority: 'recommended',
    });
  }
  if (input.proposedTerms?.buildingInspection !== true) {
    recommendedClauses.push({
      clause: '売主負担での建物検査実施を特約',
      rationale: '建物検査未実施のため',
      priority: 'must',
    });
  }
  if (input.proposedTerms?.existingLease === true) {
    recommendedClauses.push({
      clause: '賃貸借契約の引継条件を明確化',
      rationale: '既存賃貸借ありのため',
      priority: 'recommended',
    });
  }

  const decision = determineDecision(overallScore, redFlags);
  const decisionLabel = decision === 'buy' ? '購入推奨' : decision === 'negotiate' ? '価格交渉推奨' : decision === 'hold' ? '保留' : '非推奨';

  const keyNumbers: KeyNumbers = {
    askingPrice: input.askingPrice,
    pricePerSqm: priceResult.keyNumbers.pricePerSqm ?? null,
    pricePerTsubo: priceResult.keyNumbers.pricePerTsubo ?? null,
    kojiPricePerSqm: priceResult.keyNumbers.kojiPricePerSqm ?? null,
    rosenkaPerSqm: priceResult.keyNumbers.rosenkaPerSqm ?? null,
    transactionMedianPerSqm: priceResult.keyNumbers.transactionMedianPerSqm ?? null,
    askingToKojiRatio: priceResult.keyNumbers.askingToKojiRatio ?? null,
    askingToTransactionRatio: priceResult.keyNumbers.askingToTransactionRatio ?? null,
    grossYield: yieldResult.keyNumbers.grossYield ?? null,
    netYield: yieldResult.keyNumbers.netYield ?? null,
    downsideNetYield: null,
    paybackYears: yieldResult.keyNumbers.paybackYears ?? null,
  };

  const markdownReport = generateMarkdownReport(
    input,
    axes,
    overallScore,
    decision,
    keyNumbers,
    redFlags,
    negotiationPoints,
    missingInfo,
    recommendedClauses,
  );

  const prefecture = resolvePrefecture(input.prefecture) || input.prefecture;
  const dashboardUri = `https://real-estate-intel-mcp.example.com/dashboard?prefecture=${encodeURIComponent(
    prefecture
  )}&area=${encodeURIComponent(input.city)}&mode=purchase&review=1`;

  return {
    decision,
    decisionLabel,
    overallScore,
    priceScore: priceResult.axis.score,
    yieldScore: yieldResult.axis.score,
    riskScore: riskAxis.score,
    futureScore: futureAxis.score,
    contractScore: contractAxis.score,
    keyNumbers,
    axes,
    redFlags,
    negotiationPoints,
    missingInformation: missingInfo,
    recommendedClauses,
    dataSources: ['公示地価（国土交通省）', '路線価（国税庁）', '取引価格情報（国土交通省）', '人口推計（総務省）'],
    markdownReport,
    dashboardUri,
    attribution: ATTRIBUTION,
  };
}
