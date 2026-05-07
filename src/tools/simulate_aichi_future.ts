/**
 * simulate_aichi_future — Aichi Prefecture Future Value Simulator
 *
 * Models the long-term land price impact of major Aichi-specific infrastructure projects:
 *   - Linear Chuo Shinkansen (Nagoya station upgrade)
 *   - Chubu Centrair International Airport expansion
 *   - Toyota / Okazaki Industrial Park developments
 *   - Aichi Loop Line + expressway expansions
 *   - Aichi Expo legacy + Nagakute urban development
 */

import { z } from 'zod';

// ── Input / Output schemas ─────────────────────────────────────────────────

export const AichiFutureInput = z.object({
  city: z.string().describe('対象市区町村（例: 名古屋市中区, 豊田市, 常滑市）'),
  scenarios: z
    .array(
      z.enum([
        'linear_chuo',
        'centrair_expansion',
        'toyota_industrial',
        'expressway',
        'expo_legacy',
        'all',
      ]),
    )
    .default(['all'])
    .describe('シナリオ（all で全シナリオを一括試算）'),
  horizon: z
    .enum(['3y', '5y', '10y'])
    .default('10y')
    .describe('試算期間'),
  includeMarkdown: z.boolean().default(true),
});
export type AichiFutureInput = z.infer<typeof AichiFutureInput>;

export const AichiFutureScenarioResult = z.object({
  scenario: z.string(),
  scenarioLabel: z.string(),
  upliftPct: z.number().describe('地価上昇率(%)'),
  confidenceLow: z.number(),
  confidenceHigh: z.number(),
  signal: z.enum(['strong_buy', 'buy', 'hold', 'watch', 'neutral']),
  rationale: z.string(),
  timelineNote: z.string(),
});
export type AichiFutureScenarioResult = z.infer<typeof AichiFutureScenarioResult>;

export const AichiFutureOutput = z.object({
  city: z.string(),
  horizon: z.string(),
  totalUpliftPct: z.number().describe('全シナリオ合計の推定地価上昇率(%)'),
  compositeSignal: z.enum(['strong_buy', 'buy', 'hold', 'watch', 'neutral']),
  scenarios: z.array(AichiFutureScenarioResult),
  topDrivers: z.array(z.string()),
  riskFactors: z.array(z.string()),
  markdownReport: z.string().optional(),
  attribution: z.string(),
});
export type AichiFutureOutput = z.infer<typeof AichiFutureOutput>;

// ── Infrastructure database ────────────────────────────────────────────────

interface InfraRecord {
  cities: string[];          // cities that benefit (partial match)
  baseUplift3y: number;      // % uplift at 3-year horizon
  baseUplift5y: number;
  baseUplift10y: number;
  confidenceBand: number;    // ±% band
  label: string;
  rationale: string;
  timeline: string;
}

const LINEAR_DATA: Record<string, InfraRecord> = {
  '名古屋市中村区': {
    cities: ['名古屋市中村区', '名駅', '中村区'],
    baseUplift3y: 8, baseUplift5y: 18, baseUplift10y: 32,
    confidenceBand: 6,
    label: 'リニア名古屋駅（地下）— 名駅エリア直接恩恵',
    rationale: 'リニア名古屋駅整備により名駅周辺がターミナル化。東京40分圏による企業立地需要急増。先行して2025年頃から地価上昇が始まっている。',
    timeline: '2027年工事本格化、2037年開業予定（工期遅延リスクあり）',
  },
  '名古屋市中区': {
    cities: ['名古屋市中区', '栄', '丸の内', '伏見', '中区'],
    baseUplift3y: 5, baseUplift5y: 12, baseUplift10y: 22,
    confidenceBand: 4,
    label: 'リニア波及効果 — 栄・伏見ビジネス集積',
    rationale: 'リニア開業後のオフィス需要拡大の波及。名駅〜栄のビジネス軸が強化され、高層オフィスビルの需給がタイト化。',
    timeline: 'リニア開業の3〜5年後から顕在化',
  },
  '名古屋市熱田区': {
    cities: ['名古屋市熱田区', '熱田区'],
    baseUplift3y: 3, baseUplift5y: 8, baseUplift10y: 15,
    confidenceBand: 5,
    label: 'リニア波及 + 名古屋南部再開発',
    rationale: '名古屋港・熱田エリアの物流・工業地の再評価。名駅南再開発の延伸効果。',
    timeline: '2028年頃からの段階的効果',
  },
};

const CENTRAIR_DATA: Record<string, InfraRecord> = {
  '常滑市': {
    cities: ['常滑市', 'セントレア', '知多市', '東海市'],
    baseUplift3y: 4, baseUplift5y: 10, baseUplift10y: 18,
    confidenceBand: 5,
    label: '中部国際空港（セントレア）第2滑走路拡張',
    rationale: '第2滑走路整備により国際便が大幅増。空港島周辺の商業・物流施設需要拡大。インバウンド回復との相乗効果。',
    timeline: '2030年代の整備計画。空港アクセス改善も並行',
  },
  '知多市': {
    cities: ['知多市', '阿久比町'],
    baseUplift3y: 2, baseUplift5y: 6, baseUplift10y: 10,
    confidenceBand: 4,
    label: 'セントレア拡張 周辺波及',
    rationale: '空港アクセス改善による知多半島北部の物流需要増。住宅地としての空港近郊ブランド向上。',
    timeline: '整備計画の進捗に依存',
  },
};

const TOYOTA_DATA: Record<string, InfraRecord> = {
  '豊田市': {
    cities: ['豊田市'],
    baseUplift3y: 4, baseUplift5y: 10, baseUplift10y: 16,
    confidenceBand: 5,
    label: 'トヨタ電動化投資 + 工業団地拡充',
    rationale: 'トヨタ本社による電動化・自動運転関連の国内回帰投資が加速。関連部品メーカーの集積が進み、従業員需要（住宅・商業）が拡大。',
    timeline: '2025〜2030年が投資集中期',
  },
  '岡崎市': {
    cities: ['岡崎市'],
    baseUplift3y: 2, baseUplift5y: 6, baseUplift10y: 10,
    confidenceBand: 5,
    label: '三河地区 工業集積 + 岡崎城下町再開発',
    rationale: 'トヨタ系列の裾野拡大と観光開発（岡崎城周辺）の相乗効果。名古屋圏ベッドタウンとしての住宅需要も堅調。',
    timeline: '継続的な複合効果',
  },
  '安城市': {
    cities: ['安城市'],
    baseUplift3y: 3, baseUplift5y: 7, baseUplift10y: 12,
    confidenceBand: 4,
    label: '安城市 次世代モビリティ産業集積',
    rationale: 'EV・自動運転関連の研究開発拠点集積。デンソー等の大企業R&D拡張と連動。',
    timeline: '2025〜2030年の先行効果あり',
  },
};

const EXPRESSWAY_DATA: Record<string, InfraRecord> = {
  '名古屋市港区': {
    cities: ['名古屋市港区', '港区'],
    baseUplift3y: 2, baseUplift5y: 5, baseUplift10y: 9,
    confidenceBand: 4,
    label: '名古屋高速・名四国道拡充',
    rationale: '名古屋港の物流機能拡充と道路インフラ整備。物流施設・倉庫需要の増加。',
    timeline: '継続的な効果',
  },
  '一宮市': {
    cities: ['一宮市'],
    baseUplift3y: 2, baseUplift5y: 5, baseUplift10y: 9,
    confidenceBand: 4,
    label: '名古屋第二環状自動車道 周辺物流拠点化',
    rationale: '名二環の完成により名古屋北部の物流ハブとしての地位が強化。工業・物流用地の需要拡大。',
    timeline: '整備進捗に応じて段階的効果',
  },
};

const EXPO_DATA: Record<string, InfraRecord> = {
  '長久手市': {
    cities: ['長久手市', '日進市', '尾張旭市'],
    baseUplift3y: 3, baseUplift5y: 8, baseUplift10y: 14,
    confidenceBand: 5,
    label: '愛知万博レガシー + リニモ沿線開発',
    rationale: 'リニモ（Linimo）沿線の住宅開発が継続進展。良好な住環境・緑豊かなエリアへの移住需要。企業研究施設の立地も増加。',
    timeline: '2025年以降の継続的効果',
  },
  '名古屋市名東区': {
    cities: ['名古屋市名東区', '名東区'],
    baseUplift3y: 2, baseUplift5y: 5, baseUplift10y: 9,
    confidenceBand: 3,
    label: 'リニモ沿線 万博レガシー波及',
    rationale: 'リニモで長久手・愛・地球博記念公園方面へのアクセス良好。良質住宅需要が継続。',
    timeline: '継続効果',
  },
};

// ── Core simulation logic ──────────────────────────────────────────────────

function findRecord(
  db: Record<string, InfraRecord>,
  city: string,
): [string, InfraRecord] | null {
  for (const [key, rec] of Object.entries(db)) {
    if (rec.cities.some((c) => city.includes(c) || c.includes(city.replace('市', '').replace('区', '')))) {
      return [key, rec];
    }
  }
  return null;
}

function horizonValue(rec: InfraRecord, horizon: '3y' | '5y' | '10y'): number {
  if (horizon === '3y') return rec.baseUplift3y;
  if (horizon === '5y') return rec.baseUplift5y;
  return rec.baseUplift10y;
}

function toSignal(uplift: number): AichiFutureScenarioResult['signal'] {
  if (uplift >= 20) return 'strong_buy';
  if (uplift >= 12) return 'buy';
  if (uplift >= 7) return 'hold';
  if (uplift >= 3) return 'watch';
  return 'neutral';
}

export function simulateAichiFuture(input: AichiFutureInput): AichiFutureOutput {
  const { city, horizon, scenarios: reqScenarios } = input;
  const hor = horizon as '3y' | '5y' | '10y';
  const all = reqScenarios.includes('all');
  const results: AichiFutureScenarioResult[] = [];

  const tryAdd = (
    scenarioKey: string,
    scenarioLabel: string,
    db: Record<string, InfraRecord>,
    reqKey: string,
  ) => {
    if (!all && !reqScenarios.includes(reqKey as never)) return;
    const found = findRecord(db, city);
    if (!found) return;
    const [, rec] = found;
    const uplift = horizonValue(rec, hor);
    results.push({
      scenario: reqKey,
      scenarioLabel,
      upliftPct: uplift,
      confidenceLow: Math.max(0, uplift - rec.confidenceBand),
      confidenceHigh: uplift + rec.confidenceBand,
      signal: toSignal(uplift),
      rationale: rec.rationale,
      timelineNote: rec.timeline,
    });
  };

  tryAdd('linear_chuo', 'リニア中央新幹線', LINEAR_DATA, 'linear_chuo');
  tryAdd('centrair_expansion', 'セントレア第2滑走路', CENTRAIR_DATA, 'centrair_expansion');
  tryAdd('toyota_industrial', 'トヨタ電動化投資', TOYOTA_DATA, 'toyota_industrial');
  tryAdd('expressway', '高速道路・幹線道路整備', EXPRESSWAY_DATA, 'expressway');
  tryAdd('expo_legacy', '万博レガシー・リニモ沿線', EXPO_DATA, 'expo_legacy');

  // Compute totals (cap at 45% to avoid compounding arithmetic)
  const raw = results.reduce((s, r) => s + r.upliftPct, 0);
  const totalUplift = Math.min(raw, 45);
  const compositeSignal = toSignal(totalUplift);

  // Top drivers
  const sorted = [...results].sort((a, b) => b.upliftPct - a.upliftPct);
  const topDrivers = sorted.slice(0, 3).map((r) => `${r.scenarioLabel}（+${r.upliftPct}%）`);

  // Risk factors
  const riskFactors = [
    'リニア開業遅延リスク（静岡県区間の環境調整）',
    '日銀の金利上昇による不動産市況の調整',
    '全国的な人口減少による長期的需要低下',
    '自動車産業の電動化移行に伴う雇用変動リスク',
  ].slice(0, results.length > 0 ? 3 : 2);

  if (results.length === 0) {
    riskFactors.push('対象エリアへの直接的インフラ影響データが現在準備中');
  }

  const attribution = '出典: 国土交通省「リニア中央新幹線計画」「中部国際空港整備計画」、愛知県「あいち産業立地白書」ほか';

  // Build Markdown report
  let md = '';
  if (input.includeMarkdown) {
    const horizonLabel = { '3y': '3年後', '5y': '5年後', '10y': '10年後' }[horizon];
    md = [
      `## ${city} 愛知インフラ 将来価値シミュレーション（${horizonLabel}）`,
      '',
      '| 項目 | 内容 |',
      '|---|---|',
      `| 対象エリア | ${city} |`,
      `| 試算期間 | ${horizonLabel} |`,
      `| **推定地価上昇率（合計）** | **+${totalUplift}%** |`,
      `| 信頼区間 | +${Math.max(0, totalUplift - 5)}% 〜 +${Math.min(50, totalUplift + 8)}% |`,
      `| 総合シグナル | **${compositeSignal === 'strong_buy' ? '強い買い' : compositeSignal === 'buy' ? '買い' : compositeSignal === 'hold' ? '保有継続' : '様子見'}** |`,
      '',
      '### シナリオ別内訳',
      '',
      ...(results.length > 0 ? [
        '| シナリオ | 上昇率 | 信頼区間 | 判定 |',
        '|---|---|---|---|',
        ...results.map((r) => `| ${r.scenarioLabel} | +${r.upliftPct}% | +${r.confidenceLow}〜+${r.confidenceHigh}% | ${r.signal === 'strong_buy' ? '強い買い' : r.signal === 'buy' ? '買い' : r.signal === 'hold' ? '保有' : '様子見'} |`),
      ] : ['> この市区町村への直接インフラ恩恵は限定的または現在データ準備中です。']),
      '',
      '### 主要ドライバー',
      ...topDrivers.map((d) => `- ${d}`),
      '',
      '### リスク要因',
      ...riskFactors.map((r) => `- ${r}`),
      '',
      '### 各シナリオ詳細',
      ...results.flatMap((r) => [
        `**${r.scenarioLabel}**: ${r.rationale}`,
        `> ${r.timelineNote}`,
        '',
      ]),
      `> ※ ${attribution}`,
      '> 本試算はサンプルモデルに基づく参考値です。投資判断は専門家へご相談ください。',
    ].join('\n');
  }

  return {
    city,
    horizon,
    totalUpliftPct: totalUplift,
    compositeSignal,
    scenarios: results,
    topDrivers,
    riskFactors,
    ...(input.includeMarkdown ? { markdownReport: md } : {}),
    attribution,
  };
}
