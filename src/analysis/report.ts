import type { CrossAnalyzeOutput, ChartsData } from '../schemas.js';
import type { PopulationRecord } from '../data-loaders/types.js';
import { ATTRIBUTION } from '../data/attribution.js';

interface ReportParams {
  area: string;
  purpose: 'investment' | 'development' | 'rental' | 'management';
  analysis: CrossAnalyzeOutput;
  population?: PopulationRecord;
  includeCharts: boolean;
}

const PURPOSE_LABELS: Record<string, string> = {
  investment: '投資',
  development: '開発',
  rental: '賃貸',
  management: '管理',
};

export function generateMarkdownReport(params: ReportParams): {
  markdownReport: string;
  chartsData: ChartsData;
  riskHighlights: string[];
} {
  const { area, purpose, analysis, population, includeCharts } = params;
  const purposeLabel = PURPOSE_LABELS[purpose] ?? purpose;
  const now = new Date().toISOString().split('T')[0];

  const riskHighlights: string[] = [];
  if (analysis.riskScore >= 60) {
    riskHighlights.push(`⚠ ${area}の総合リスクスコアは${analysis.riskScore}/100（高リスク）`);
  }
  if (analysis.riskScore >= 40 && analysis.riskScore < 60) {
    riskHighlights.push(`△ ${area}の総合リスクスコアは${analysis.riskScore}/100（中リスク）`);
  }
  if (analysis.priceTrend.changeRate < -5) {
    riskHighlights.push(`⚠ 地価が大幅下落中（${analysis.priceTrend.changeRate}%）`);
  }
  if (population && population.aging_rate > 30) {
    riskHighlights.push(`△ 高齢化率${population.aging_rate}%：将来の需要構造変化に留意`);
  }

  let md = `# ${area} 不動産${purposeLabel}レポート\n\n`;
  md += `**生成日**: ${now}  \n`;
  md += `**対象エリア**: ${area}  \n`;
  md += `**分析目的**: ${purposeLabel}  \n\n`;

  md += `---\n\n`;

  md += `## 概要\n\n${analysis.summary}\n\n`;

  md += `## 価格動向\n\n`;
  md += `| 指標 | 値 |\n|------|----|\n`;
  md += `| 現在平均価格 | ${analysis.priceTrend.current.toLocaleString()} 万円/㎡ |\n`;
  md += `| 変化率 | ${analysis.priceTrend.changeRate > 0 ? '+' : ''}${analysis.priceTrend.changeRate}% |\n`;
  md += `| 見通し | ${analysis.priceTrend.forecast} |\n\n`;

  md += `## スコアサマリー\n\n`;
  md += `| 指標 | スコア |\n|------|--------|\n`;
  md += `| 投資スコア | **${analysis.investmentScore}** / 100 |\n`;
  md += `| リスクスコア | **${analysis.riskScore}** / 100 |\n\n`;

  if (population) {
    md += `## 人口動態\n\n`;
    md += `| 指標 | 値 |\n|------|----|\n`;
    md += `| 人口（2025推計） | ${population.population_2025.toLocaleString()} 人 |\n`;
    md += `| 世帯数（2025推計） | ${population.households_2025.toLocaleString()} 世帯 |\n`;
    md += `| 人口密度 | ${population.density_per_sqkm.toLocaleString()} 人/km² |\n`;
    md += `| 高齢化率 | ${population.aging_rate}% |\n\n`;
  }

  if (analysis.keyInsights.length > 0) {
    md += `## 主要インサイト\n\n`;
    for (const insight of analysis.keyInsights) {
      md += `- ${insight}\n`;
    }
    md += '\n';
  }

  if (riskHighlights.length > 0) {
    md += `## リスクハイライト\n\n`;
    for (const h of riskHighlights) {
      md += `- ${h}\n`;
    }
    md += '\n';
  }

  if (purpose === 'investment') {
    md += `## 投資推奨アクション\n\n`;
    if (analysis.investmentScore >= 70) {
      md += `1. **積極的な投資検討を推奨**。リスク調整後でも魅力的な投資機会。\n`;
      md += `2. 現地調査・デューデリジェンスの実施。\n`;
      md += `3. 水害保険を含むリスクヘッジの検討。\n`;
    } else if (analysis.investmentScore >= 40) {
      md += `1. **選択的な投資検討**。物件個別の精査が必要。\n`;
      md += `2. 周辺開発計画・インフラ整備の確認。\n`;
      md += `3. 中長期保有前提での採算性検証。\n`;
    } else {
      md += `1. **慎重な検討が必要**。リスクに見合うリターンか精査。\n`;
      md += `2. 代替エリアとの比較分析を推奨。\n`;
      md += `3. 短期ではなく特殊用途での可能性を検討。\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;
  md += `*${ATTRIBUTION}*\n`;

  return {
    markdownReport: md,
    chartsData: includeCharts ? analysis.charts : {},
    riskHighlights,
  };
}
