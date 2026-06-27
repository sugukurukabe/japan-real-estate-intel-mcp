import { moduleLogger } from '../logger.js';
import type { OptimizePortfolioInput, OptimizePortfolioOutput, PortfolioAnalysisItem } from '../schemas.js';
import { getLoader } from '../data-loaders/registry.js';

const log = moduleLogger('portfolio_optimization');

export async function optimizePortfolio(input: OptimizePortfolioInput): Promise<OptimizePortfolioOutput> {
  log.info({ propertyCount: input.properties.length, goal: input.targetGoal }, 'Optimizing portfolio allocation');

  let totalAssetsJpy = 0;
  let totalAnnualRentJpy = 0;
  const items: PortfolioAnalysisItem[] = [];

  for (const prop of input.properties) {
    totalAssetsJpy += prop.purchasePriceJpy;
    totalAnnualRentJpy += prop.annualRentJpy;

    const currentYield = prop.purchasePriceJpy > 0
      ? Math.round((prop.annualRentJpy / prop.purchasePriceJpy) * 100 * 10) / 10
      : 0;

    // Load hazard risk and land prices from local loader
    const loader = getLoader(prop.prefecture);
    let hazardRiskScore = 30; // Default fallback
    let landPriceTrendCagr = 1.2; // Default fallback

    if (loader) {
      // Resolve risk
      const riskData = loader.getEarthquakeData ? loader.getEarthquakeData() : [];
      const cityRisk = riskData.find(r => r.city.includes(prop.city));
      if (cityRisk) {
        hazardRiskScore = cityRisk.probability_30y * 100 + (cityRisk.liquefaction_risk === 'high' ? 30 : cityRisk.liquefaction_risk === 'medium' ? 15 : 0);
        hazardRiskScore = Math.min(95, Math.max(10, hazardRiskScore));
      }

      // Resolve land price CAGR
      const prices = loader.getLandPrices ? loader.getLandPrices() : [];
      const cityPrices = prices.filter(p => p.city.includes(prop.city));
      if (cityPrices.length > 0) {
        const avgChange = cityPrices.reduce((sum, p) => sum + p.change_rate, 0) / cityPrices.length;
        landPriceTrendCagr = Math.round(avgChange * 10) / 10;
      }
    }

    // Risk Adjusted Return Score formula
    const riskAdjustedReturnScore = Math.round(
      Math.max(10, Math.min(100, currentYield * 5 + landPriceTrendCagr * 6 + (100 - hazardRiskScore) * 0.4))
    );

    // Dynamic Action recommendation
    let actionRecommendation = '安定的運用。現状維持（ホールド）で安定インカムを獲得。';
    if (hazardRiskScore >= 60) {
      actionRecommendation = '⚠️災害リスク高。早期の売却または保険内容の見直し、低リスク資産への組換えを推奨。';
    } else if (currentYield < 3.5 && landPriceTrendCagr < 1.0) {
      actionRecommendation = '📉 資本効率低下。リノベーションによるバリューアップ、または都心への買換を推奨。';
    } else if (landPriceTrendCagr >= 2.5) {
      actionRecommendation = '🚀 含み益増大期待。成長エリアのため長期保有（ストロングホールド）によるキャピタルゲイン獲得。';
    }

    items.push({
      name: prop.name,
      currentYield,
      hazardRiskScore: Math.round(hazardRiskScore),
      landPriceTrendCagr,
      riskAdjustedReturnScore,
      actionRecommendation,
    });
  }

  const overallYield = totalAssetsJpy > 0
    ? Math.round((totalAnnualRentJpy / totalAssetsJpy) * 100 * 100) / 100
    : 0;

  // Compute portfolio risk score
  const avgRisk = items.reduce((sum, item) => sum + item.hazardRiskScore, 0) / (items.length || 1);
  const portfolioRiskScore = Math.round(avgRisk);

  // Compute diversification score
  // Based on entropy of prefecture and propertyType distributions
  const prefCount = new Set(input.properties.map(p => p.prefecture)).size;
  const typeCount = new Set(input.properties.map(p => p.propertyType)).size;
  const diversificationScore = Math.min(100, Math.round((prefCount / 3) * 50 + (typeCount / 3) * 50));

  // Determine strategy text based on goal
  let optimizationStrategyJa = '';
  if (input.targetGoal === 'risk_min') {
    optimizationStrategyJa = '災害リスクと地価下落リスクの抑制に主眼を置いたポートフォリオ戦略を推奨します。ハザードマップ赤ゾーンの資産を売却し、内陸部または強固な地盤の準都心・高台住宅地へリバランスしてください。';
  } else if (input.targetGoal === 'yield_max') {
    optimizationStrategyJa = 'インカムゲイン最大化を狙う戦略。利回り3.5%未満の低収益物件を売却し、リノベーション対象の築古アパートや地方主要都市の駅近商業・商業ビルへ資金を集中させるべきです。';
  } else {
    optimizationStrategyJa = 'バランス維持戦略。現在のアセット構成は利回りとキャピタルゲインのバランスが良好です。災害リスク高の物件のみ個別に対策（火災・地震保険の増額、耐震補強）を行い、ホールドを維持します。';
  }

  const markdownReport = `# ポートフォリオ統合リスク・リターン最適化レポート
\`Premium Mode: Pro/Enterprise Tier Activated\`

---

## 📊 ポートフォリオ全体サマリー

- **総資産額 (想定価格)**: **${(totalAssetsJpy / 100000000).toFixed(2)} 億円** (計 ${input.properties.length} 物件)
- **全体表面利回り**: **${overallYield.toFixed(2)} %** (年間インカム想定: **${(totalAnnualRentJpy / 10000).toFixed(0)} 万円**)
- **ポートフォリオ総合リスク**: **${portfolioRiskScore} / 100**
- **分散投資スコア**: **${diversificationScore} / 100** (都道府県数: ${prefCount}, 用途種別数: ${typeCount})

---

## 🔍 物件ごとのリスク・リターン個別評価

| 物件識別子 | 表面利回り | 災害リスクスコア | 地価CAGR予測 | リスク調整後リターン | 推奨アクション |
|------------|------------|------------------|--------------|----------------------|----------------|
${items.map(item => `| **${item.name}** | ${item.currentYield.toFixed(1)}% | ${item.hazardRiskScore}/100 | ${item.landPriceTrendCagr >= 0 ? '+' : ''}${item.landPriceTrendCagr.toFixed(1)}% | **${item.riskAdjustedReturnScore}/100** | ${item.actionRecommendation} |`).join('\n')}

---

## 💡 有料プラン限定：全体ポートフォリオ最適化戦略

### 最適化目的: **${input.targetGoal === 'yield_max' ? 'インカム最大化' : input.targetGoal === 'risk_min' ? 'リスク最小化' : 'バランス型成長'}**

${optimizationStrategyJa}

---
*免責事項: 本最適化レポートはローカルの都市統計情報およびシミュレーションモデルに基づくものであり、特定の不動産売買、投資勧誘、金融取引の助言を保証するものではありません。*`;

  return {
    totalAssetsJpy,
    overallYield,
    portfolioRiskScore,
    diversificationScore,
    items,
    optimizationStrategyJa,
    markdownReport,
    attribution: 'Enterprise Real Estate Portfolio Risk Optimizer',
  };
}
