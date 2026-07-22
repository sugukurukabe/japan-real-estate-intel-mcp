import type { GenerateReportInput, GenerateReportOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getPopulationForCity } from '../data/loader.js';
import { getLoader } from '../data-loaders/index.js';
import { crossAnalyze } from './cross_analyze_real_estate_market.js';
import { generateMarkdownReport } from '../analysis/report.js';
import { markdownToPdfBase64 } from '../export/pdf.js';
import type { TransactionComparable } from '../export/pdf.js';

/** Build Linear Chuo Shinkansen impact section for Aichi cities. */
function buildLinearImpactSection(area: string): string {
  const LINEAR_ZONES: Record<
    string,
    { uplift: string; horizon: string; signal: string; note: string }
  > = {
    名古屋市中村区: {
      uplift: '+28〜35%',
      horizon: '10年後',
      signal: '今すぐ買い',
      note: 'リニア名古屋駅（地下）が整備予定。名駅エリアは国内最大級のターミナル化',
    },
    名古屋市中区: {
      uplift: '+18〜25%',
      horizon: '10年後',
      signal: '2年以内に買い',
      note: '栄・伏見ビジネス集積の波及恩恵。オフィス需要が継続拡大',
    },
    名古屋市熱田区: {
      uplift: '+12〜18%',
      horizon: '10年後',
      signal: '保有継続',
      note: '名古屋港と合わせた物流拠点としての再評価。名駅南開発の波及',
    },
    名古屋市中川区: {
      uplift: '+8〜12%',
      horizon: '7年後',
      signal: '様子見',
      note: '名駅南再開発の余波。住宅地としての安定需要',
    },
    名古屋市昭和区: {
      uplift: '+10〜15%',
      horizon: '10年後',
      signal: '保有推奨',
      note: '高級住宅地需要。リニア開業後の富裕層流入期待',
    },
    豊田市: {
      uplift: '+10〜15%',
      horizon: '10年後',
      signal: '中長期保有',
      note: 'トヨタ本社と電動化投資の波及。リニア波及効果も',
    },
    岡崎市: {
      uplift: '+5〜8%',
      horizon: '10年後',
      signal: '様子見',
      note: '名古屋通勤圏。リニア間接効果と三河地区の産業集積',
    },
    一宮市: {
      uplift: '+6〜10%',
      horizon: '7年後',
      signal: '検討',
      note: '名古屋北部の物流・工業集積。アクセス改善効果',
    },
    春日井市: {
      uplift: '+6〜9%',
      horizon: '7年後',
      signal: '検討',
      note: 'ベッドタウン需要。名古屋近郊の宅地需要堅調',
    },
  };

  const zone = Object.entries(LINEAR_ZONES).find(
    ([k]) =>
      area.includes(k.replace('名古屋市', '').replace('市', '')) ||
      area === k ||
      area.startsWith(k),
  );
  if (!zone) {
    return `\n## リニア中央新幹線 影響試算\n\n${area} のリニア直接影響ゾーンデータは現在準備中です。\n名古屋市中区・中村区エリアをご参照ください。\n`;
  }

  const [city, data] = zone;
  return [
    '',
    '## リニア中央新幹線 将来価値影響試算',
    '',
    `| 項目 | 内容 |`,
    `|---|---|`,
    `| 対象エリア | ${city} |`,
    `| 推定地価上昇率 | **${data.uplift}** |`,
    `| 想定時期 | ${data.horizon} |`,
    `| 投資判断 | **${data.signal}** |`,
    '',
    `> ${data.note}`,
    '',
    '**根拠**:',
    '- リニア中央新幹線は東京〜名古屋間を最短 40 分で結ぶ（開業後）',
    '- 過去の新幹線新駅開設事例では半径 1km 圏の地価が平均 15〜30% 上昇',
    '- 名古屋駅周辺は既に再開発投資が進んでおり、先行上昇局面',
    '',
    '> ※本試算はサンプルデータに基づく参考値です。投資判断の際は専門家にご相談ください。',
    '',
  ].join('\n');
}

export type ProgressFn = (progress: number, total: number, message?: string) => void;

/**
 * `pdfBase64` is intentionally NOT part of the `GenerateReportOutput` Zod
 * schema (and therefore never lands in `structuredContent`/model transcript):
 * src/server.ts pulls it off this wider return type, persists it via
 * src/artifacts.ts, and returns a `resource_link` content block instead.
 */
export async function generateAreaReport(
  input: GenerateReportInput,
  onProgress?: ProgressFn,
): Promise<GenerateReportOutput & { pdfBase64?: string }> {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const notify = onProgress ?? (() => {});

  notify(1, 6, 'クロス分析を実行中…');
  const analysis = crossAnalyze({
    prefecture: input.prefecture,
    area: input.area,
    propertyType: 'mixed',
    timeRange: '3y',
    includeRisk: true,
    includeHumanFlow: true,
    includeEducation: false,
    includeCorporate: false,
    output_mode: 'detailed',
    includeTransport: false,
    includeCommercial: false,
    includeMedical: false,
  });

  notify(2, 6, '人口データ読み込み中…');
  const population = getPopulationForCity(input.area, prefKey);

  notify(3, 6, 'Markdownレポート生成中…');
  const base = generateMarkdownReport({
    area: input.area,
    purpose: input.purpose,
    analysis,
    population,
    includeCharts: input.includeCharts,
  });

  let extendedReport = base.markdownReport;
  if (input.includeLinearImpact && prefKey === 'aichi') {
    extendedReport += buildLinearImpactSection(input.area);
  }

  const baseOutput: GenerateReportOutput = {
    ...base,
    markdownReport: extendedReport,
  };

  if (input.format !== 'pdf') {
    notify(6, 6, 'Markdown完了');
    return baseOutput;
  }

  notify(4, 6, 'ブランディング設定…');
  const branding = {
    companyName: input.companyName,
    agentName: input.agentName,
    agentLogoBase64: input.agentLogoBase64,
    disclaimer: input.disclaimer,
    footerContact: input.footerContact,
  };

  let comparables: TransactionComparable[] | undefined;
  if (input.includeTransactionComparables && loader.capabilities.transactions) {
    notify(5, 6, '取引事例を収集中…');
    const txns = loader.getTransactions();
    const filtered = txns
      .filter((t) => {
        const city = typeof t.city === 'string' ? t.city : String(t.city);
        return (
          input.area.includes(city) || city.includes(input.area.replace('市', '').replace('区', ''))
        );
      })
      .slice(-20);

    comparables = filtered.map((t) => ({
      year: String(t.year),
      quarter: String(t.quarter),
      city: String(t.city),
      district: String(t.district ?? ''),
      propertyType: String(t.property_type ?? ''),
      areaSqm: Number(t.area_sqm ?? 0),
      pricePerSqm: Number(t.price_per_sqm ?? 0),
      buildingYear: String(t.building_year ?? ''),
      structure: String(t.structure ?? ''),
    }));
  }

  notify(5, 6, 'PDF生成中…');
  const pdfBase64 = await markdownToPdfBase64(
    extendedReport,
    `${input.area} 不動産調査レポート`,
    branding,
    comparables,
  );

  notify(6, 6, 'PDF完了');
  return { ...baseOutput, pdfBase64 };
}
