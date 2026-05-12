/**
 * price_triangulation.ts — v6.15.0
 *
 * 路線価（NTA）× 公示地価（MLIT 公示）× 取引価格（MLIT XIT001）の三角測量。
 *
 * 実務の比率感覚:
 *   路線価 / 公示地価 ≈ 0.80  (相続税評価の控え目設定)
 *   取引 / 公示地価 ≈ 1.05   (実勢価格は公示よりやや高め)
 *
 * シグナル定義:
 *   discount        — 取引 < 路線価  → 実勢が税評価を下回る割安圏
 *   inheritance_edge — 路線価/公示 < 0.75 → 相続税評価が特に有利なエリア
 *   overheated      — 取引/公示 > 1.30 → 実勢が公的評価を大幅超過
 *   fair            — 標準範囲
 */

import type { PrefectureLoader } from '../data-loaders/types.js';
import type { ArbitrageSignalItem, ArbitrageSignalType } from '../schemas.js';
import { MlitClient } from '../api-client/mlit.js';
import { moduleLogger } from '../logger.js';

const log = moduleLogger('price_triangulation');

export const BENCHMARK = {
  nationalRosenkaKojiRatio: 0.80,
  nationalTxKojiRatio: 1.05,
};

const SIGNAL_THRESHOLDS = {
  discountMaxTxKojiRatio: 0.95,   // 取引/公示 < 0.95 (路線価を下回る目安)
  inheritanceEdgeMaxRosenkaKoji: 0.75,
  overheatMinTxKojiRatio: 1.30,
};

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

function classifySignal(
  rosenkaKojiRatio: number,
  txKojiRatio: number,
): ArbitrageSignalType {
  if (txKojiRatio < SIGNAL_THRESHOLDS.discountMaxTxKojiRatio) return 'discount';
  if (rosenkaKojiRatio < SIGNAL_THRESHOLDS.inheritanceEdgeMaxRosenkaKoji) return 'inheritance_edge';
  if (txKojiRatio > SIGNAL_THRESHOLDS.overheatMinTxKojiRatio) return 'overheated';
  return 'fair';
}

function buildInterpretation(
  signal: ArbitrageSignalType,
  city: string,
  rosenkaKojiRatio: number,
  txKojiRatio: number,
  assessmentGap: number,
): string {
  const gapStr = assessmentGap >= 0 ? `+${Math.round(assessmentGap / 1000)}千円/㎡` : `${Math.round(assessmentGap / 1000)}千円/㎡`;
  switch (signal) {
    case 'discount':
      return `【割安シグナル】${city}: 取引実勢が路線価を下回る（路線/公示比 ${(rosenkaKojiRatio * 100).toFixed(0)}%、取引/公示比 ${(txKojiRatio * 100).toFixed(0)}%）。売り急ぎや需要低下が背景に可能性。差額 ${gapStr}。`;
    case 'inheritance_edge':
      return `【相続有利】${city}: 路線価/公示比が${(rosenkaKojiRatio * 100).toFixed(0)}%と全国標準（80%）より低く、相続税評価額が特に抑えられるエリア。資産承継・相続計画で有利。`;
    case 'overheated':
      return `【過熱警戒】${city}: 取引実勢が公示地価の${(txKojiRatio * 100).toFixed(0)}%と高騰。投資参入コストが高く、将来の価格調整リスクに注意。差額 ${gapStr}。`;
    case 'fair':
      return `【適正水準】${city}: 路線/公示比 ${(rosenkaKojiRatio * 100).toFixed(0)}%、取引/公示比 ${(txKojiRatio * 100).toFixed(0)}%で標準的な水準。市場は均衡状態。差額 ${gapStr}。`;
  }
}

export interface TriangulationResult {
  city: string;
  rosenka: number;
  koji: number;
  transactionMedian: number;
  rosenkaKojiRatio: number;
  transactionKojiRatio: number;
  assessmentGap: number;
  signal: ArbitrageSignalType;
  interpretation: string;
  dataYear: number;
}

export function computeTriangulationForCity(
  loader: PrefectureLoader,
  city: string,
): TriangulationResult | null {
  const rosenkaRows = loader.getRosenka().filter(r => r.city === city);
  const landPriceRows = loader.getLandPrices().filter(r => r.city === city);
  const txRows = loader.getTransactions().filter(r => r.city === city && r.price_per_sqm > 0);

  if (rosenkaRows.length === 0 || landPriceRows.length === 0) return null;

  // Most recent year of each
  const latestRosenkaYear = Math.max(...rosenkaRows.map(r => r.year));
  const latestKojiYear = Math.max(...landPriceRows.map(r => r.year));
  const dataYear = Math.max(latestRosenkaYear, latestKojiYear);

  const rosenka = median(
    rosenkaRows.filter(r => r.year === latestRosenkaYear).map(r => r.median_per_sqm),
  );
  const koji = median(
    landPriceRows.filter(r => r.year === latestKojiYear).map(r => r.price_per_sqm),
  );

  const latestTxYear = txRows.length > 0 ? Math.max(...txRows.map(r => r.year)) : 0;
  const txMedian = txRows.length > 0
    ? median(txRows.filter(r => r.year === latestTxYear).map(r => r.price_per_sqm))
    : koji; // fallback to koji when no tx data

  if (rosenka === 0 || koji === 0) return null;

  const rosenkaKojiRatio = rosenka / koji;
  const transactionKojiRatio = txMedian / koji;
  const assessmentGap = txMedian - rosenka;
  const signal = classifySignal(rosenkaKojiRatio, transactionKojiRatio);
  const interpretation = buildInterpretation(signal, city, rosenkaKojiRatio, transactionKojiRatio, assessmentGap);

  return {
    city,
    rosenka,
    koji,
    transactionMedian: txMedian,
    rosenkaKojiRatio: Math.round(rosenkaKojiRatio * 1000) / 1000,
    transactionKojiRatio: Math.round(transactionKojiRatio * 1000) / 1000,
    assessmentGap,
    signal,
    interpretation,
    dataYear,
  };
}

export async function tryFetchLiveTransactionMedian(
  prefKey: string,
  city: string,
): Promise<number | null> {
  const apiKey = process.env.MLIT_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new MlitClient(apiKey);
    const now = new Date();
    const year = now.getFullYear();
    const quarter = (Math.ceil((now.getMonth() + 1) / 3) - 1 || 4) as 1 | 2 | 3 | 4;
    const txs = await client.fetchTransactions(prefKey, year, quarter);
    const cityTxs = txs.filter(t => t.Municipality?.includes(city) && Number(t.UnitPrice ?? 0) > 0);
    if (cityTxs.length === 0) return null;
    const prices = cityTxs.map(t => Number(t.UnitPrice ?? 0)).filter(p => p > 0);
    return prices.length > 0 ? median(prices) : null;
  } catch (err: unknown) {
    log.warn({ err, prefKey, city }, 'live MLIT fetch failed, falling back to CSV');
    return null;
  }
}

export function buildMarkdownReport(
  prefName: string,
  items: ArbitrageSignalItem[],
  scannedCities: number,
  dataYear: number,
  liveDataUsed: boolean,
): string {
  const signalCounts = {
    discount: items.filter(i => i.signal === 'discount').length,
    inheritance_edge: items.filter(i => i.signal === 'inheritance_edge').length,
    overheated: items.filter(i => i.signal === 'overheated').length,
    fair: items.filter(i => i.signal === 'fair').length,
  };

  const lines: string[] = [
    `# 価格トライアングル分析レポート — ${prefName}`,
    '',
    `> データ年次: ${dataYear}年 | スキャン: ${scannedCities}市区町村${liveDataUsed ? ' | ライブMLITデータ使用' : ''}`,
    '',
    '## サマリー',
    '',
    `| シグナル | 件数 | 説明 |`,
    `|---------|------|------|`,
    `| 🟢 割安 (discount) | ${signalCounts.discount} | 取引 < 路線価（買い場候補） |`,
    `| 🔵 相続有利 (inheritance_edge) | ${signalCounts.inheritance_edge} | 路線価/公示比 < 75% |`,
    `| 🔴 過熱 (overheated) | ${signalCounts.overheated} | 取引/公示比 > 130% |`,
    `| ⚪ 適正 (fair) | ${signalCounts.fair} | 標準範囲 |`,
    '',
    '## 検出シグナル詳細',
    '',
    '| 市区町村 | 路線価 (円/㎡) | 公示 (円/㎡) | 取引中央値 (円/㎡) | 路線/公示比 | 取引/公示比 | シグナル |',
    '|---------|-------------|-----------|-----------------|----------|----------|--------|',
  ];

  for (const item of items) {
    const signalEmoji = {
      discount: '🟢', inheritance_edge: '🔵', overheated: '🔴', fair: '⚪',
    }[item.signal] ?? '';
    lines.push(
      `| ${item.city} | ${item.rosenka.toLocaleString()} | ${item.koji.toLocaleString()} | ${item.transactionMedian.toLocaleString()} | ${(item.rosenkaKojiRatio * 100).toFixed(0)}% | ${(item.transactionKojiRatio * 100).toFixed(0)}% | ${signalEmoji} ${item.signal} |`,
    );
  }

  if (items.length > 0) {
    lines.push('', '## 価格比較チャート（取引/公示比）', '');
    const maxRatio = Math.max(...items.map(i => i.transactionKojiRatio));
    const barScale = Math.max(maxRatio, 1.5);
    for (const item of items) {
      const barLen = Math.round((item.transactionKojiRatio / barScale) * 20);
      const bar = '█'.repeat(Math.max(1, barLen)) + '░'.repeat(Math.max(0, 20 - barLen));
      const signalMark = { discount: '🟢', inheritance_edge: '🔵', overheated: '🔴', fair: '⚪' }[item.signal] ?? '';
      lines.push(`${signalMark} ${item.city.padEnd(12)} ${bar} ${(item.transactionKojiRatio * 100).toFixed(0)}%`);
    }
    lines.push('', `\`${'─'.repeat(20)} 130% 過熱ライン ─\``);
  }

  lines.push('', '## 各エリアの解釈', '');
  for (const item of items) {
    lines.push(`**${item.city}**: ${item.interpretation}`, '');
  }

  lines.push(
    '---',
    '',
    '### ベンチマーク参考値',
    '- 全国標準 路線価/公示比: **80%前後**（財産評価通達の水準）',
    '- 全国標準 取引/公示比: **105%前後**（実勢は公示よりやや高め）',
    '',
    '### 注意事項',
    '路線価は公示地価 × 0.80 を基準に推計したサンプル値です。実際の相続税申告には税理士・鑑定士への相談を推奨します。',
    '',
    `*データ出典: 国土交通省 不動産情報ライブラリ（公示地価・取引価格）、路線価推計（公示×0.80）*`,
  );

  return lines.join('\n');
}
