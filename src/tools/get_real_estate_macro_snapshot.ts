import { MacroSnapshotInput, MacroSnapshotOutput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import { buildMacroSnapshotCore } from '../analysis/macro_snapshot.js';
import { EstatClient } from '../api-client/estat.js';
import { fetchPolicyRateFromFred } from '../api-client/fred_policy_rate.js';

const LOCAL_ATTRIBUTION =
  '地価・取引・将来人口: 同梱 data/{都道府県}/ のスナップショット（出所は data/data-README.md および各ツールのデータREADME）';

export async function getRealEstateMacroSnapshotTool(rawArgs: Record<string, unknown>): Promise<{
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}> {
  const input = MacroSnapshotInput.parse(rawArgs);
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);
  const loader = getLoader(prefKey);
  const core = buildMacroSnapshotCore(loader, input.area);

  const externalWarnings: string[] = [];
  let construction: {
    latestTime: string;
    latestTotal: number;
    priorTime: string | null;
    priorTotal: number | null;
    yoyPct: number | null;
    attribution: string;
  } | null = null;
  let policyRate: Awaited<ReturnType<typeof fetchPolicyRateFromFred>> = null;

  if (input.includeExternalSeries) {
    const estatId = process.env['ESTAT_APP_ID'];
    if (estatId) {
      try {
        const client = new EstatClient(estatId);
        construction = await client.fetchBuildingConstructionPrefectureSummary(prefKey);
        if (!construction) {
          externalWarnings.push(
            '建築物着工（e-Stat）: 値が空でした（地域コードまたは表変更の可能性）。',
          );
        }
      } catch (e) {
        externalWarnings.push(
          `建築物着工（e-Stat）: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    } else {
      externalWarnings.push('建築物着工（e-Stat）: ESTAT_APP_ID 未設定のためスキップ。');
    }

    try {
      policyRate = await fetchPolicyRateFromFred();
      if (!policyRate) {
        externalWarnings.push('政策金利プロキシ（FRED CSV）: 取得できませんでした。');
      }
    } catch (e) {
      externalWarnings.push(`政策金利プロキシ: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const attribution = [
    LOCAL_ATTRIBUTION,
    ...(construction ? [construction.attribution] : []),
    ...(policyRate ? [policyRate.attribution] : []),
  ];

  const lp = core.landPrice;
  const pop = core.population;
  const tx = core.transactions;

  const summary = [
    `${prefDisplay}${input.area ? `（${input.area}）` : ''}: 公示地価㎡中央値の年次YoY ${lp.yoyMedianPct ?? 'N/A'}%、`,
    `取引は ${tx.years.map((y) => `${y.year}年${y.count}件`).join(' / ')}、`,
    `2050年までの人口減少率（市区町村平均）${pop.avgDecline2050 ?? 'N/A'}%。`,
    construction
      ? ` 建築物着工（県合算・参考）: 時点 ${construction.latestTime} 合計 ${construction.latestTotal}（前年比 ${construction.yoyPct ?? 'N/A'}%）。`
      : '',
    policyRate
      ? ` 短期金利プロキシ: ${policyRate.latestRatePct}%（${policyRate.latestObservationDate}）、1年前比 ${policyRate.deltaPercentagePoints}pt。`
      : '',
  ].join('');

  const md = [
    `## 不動産マクロスナップショット — ${prefDisplay}`,
    input.area ? `**市区町村フィルタ**: ${input.area}` : '',
    '',
    '### 地価（data 内公示地価、㎡単価の年次中央値）',
    `| 項目 | 値 |`,
    '|------|-----|',
    `| 最新年 | ${lp.latestYear ?? '—'} |`,
    `| 前年 | ${lp.priorYear ?? '—'} |`,
    `| 最新年中央値（円/㎡） | ${lp.medianLatestPerSqm?.toLocaleString() ?? '—'} |`,
    `| 前年中央値（円/㎡） | ${lp.medianPriorPerSqm?.toLocaleString() ?? '—'} |`,
    `| 中央値YoY（%） | ${lp.yoyMedianPct ?? '—'} |`,
    `| 最新年の平均 change_rate（%） | ${lp.avgChangeRateLatestYear ?? '—'} |`,
    `| 最新年の行数 | ${lp.rowsLatestYear} |`,
    '',
    '### 取引件数・㎡単価中央値（直近3年）',
    `_${tx.definition}_`,
    '',
    '| 年 | 件数 | ㎡単価中央値（円） |',
    '|----|------|-------------------|',
    ...tx.years.map(
      (y) => `| ${y.year} | ${y.count} | ${y.medianPricePerSqm?.toLocaleString() ?? '—'} |`,
    ),
    '',
    '### 将来人口（2050年減少率の市区町村平均）',
    `_${pop.definition}_`,
    '',
    `| 対象市区町村数 | 平均減少率（%） |`,
    '|----------------|----------------|',
    `| ${pop.municipalityCount} | ${pop.avgDecline2050 ?? '—'} |`,
    '',
    construction
      ? [
          '### 建築物着工（都道府県、政府統計 e-Stat）',
          `| 最新時点 | 合計 | 前時点 | 前年合計 | YoY（%） |`,
          '|------------|------|--------|----------|----------|',
          `| ${construction.latestTime} | ${construction.latestTotal.toLocaleString()} | ${construction.priorTime ?? '—'} | ${construction.priorTotal?.toLocaleString() ?? '—'} | ${construction.yoyPct ?? '—'} |`,
          '',
        ].join('\n')
      : '',
    policyRate
      ? [
          '### 短期金利プロキシ（FRED / 中央銀行系列）',
          `| 最新日付 | 水準（%） | 1年前 | 差（pt） |`,
          '|----------|-----------|-------|-----------|',
          `| ${policyRate.latestObservationDate} | ${policyRate.latestRatePct} | ${policyRate.yearAgoRatePct} (${policyRate.yearAgoObservationDate}) | ${policyRate.deltaPercentagePoints} |`,
          '',
        ].join('\n')
      : '',
    externalWarnings.length > 0
      ? ['**外部データ**:', ...externalWarnings.map((w) => `- ${w}`), ''].join('\n')
      : '',
    '### 出所',
    ...attribution.map((a) => `- ${a}`),
  ]
    .filter(Boolean)
    .join('\n');

  const structured = {
    prefectureKey: prefKey,
    prefectureDisplay: prefDisplay,
    areaFilter: input.area?.trim() ? input.area.trim() : null,
    landPrice: lp,
    transactions: tx,
    population: pop,
    construction,
    policyRate,
    externalWarnings,
    summary,
    attribution,
  };

  MacroSnapshotOutput.parse(structured);

  return {
    content: [{ type: 'text' as const, text: md }],
    structuredContent: structured as unknown as Record<string, unknown>,
  };
}
