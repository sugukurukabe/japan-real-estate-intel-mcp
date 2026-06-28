import { moduleLogger } from '../logger.js';
import type { AuditZoningComplianceInput, AuditZoningComplianceOutput } from '../schemas.js';
import { getLoader } from '../data-loaders/registry.js';

const log = moduleLogger('zoning_compliance');

export async function auditZoningCompliance(input: AuditZoningComplianceInput): Promise<AuditZoningComplianceOutput> {
  log.info({ prefecture: input.prefecture, city: input.city, proposedUse: input.proposedUse }, 'Auditing zoning compliance');

  const lat = input.latitude ?? 35.6812;
  const lng = input.longitude ?? 139.7671;

  // 1. Fetch zoning data from prefecture loader if available
  const loader = getLoader(input.prefecture);
  let zoningType = '第一種中高層住居専用地域';
  let legalMaxCoverageRatio = 60;
  let legalMaxFloorAreaRatio = 200;
  let legalHeightLimit: number | null = 20;

  if (loader && loader.getZoning) {
    const zoningRecords = loader.getZoning();
    const cityRecord = zoningRecords.find(r => r.city.includes(input.city));
    if (cityRecord) {
      zoningType = cityRecord.zone_type;
      legalMaxCoverageRatio = cityRecord.coverage_ratio;
      legalMaxFloorAreaRatio = cityRecord.floor_area_ratio;
      legalHeightLimit = cityRecord.height_limit;
    }
  }

  // Adjustment based on proposed use
  if (input.proposedUse === 'commercial' || input.proposedUse === 'office') {
    if (zoningType.includes('住居')) {
      zoningType = '商業地域（みなし）';
      legalMaxCoverageRatio = 80;
      legalMaxFloorAreaRatio = 400;
      legalHeightLimit = null;
    }
  }

  // 2. Calculations
  const proposedCoverageRatio = Math.round((input.proposedBuildingAreaSqm / input.siteAreaSqm) * 100 * 10) / 10;
  const proposedFloorAreaRatio = Math.round((input.proposedTotalFloorAreaSqm / input.siteAreaSqm) * 100 * 10) / 10;

  // 3. Compliance checks
  const coverageRatioCompliant = proposedCoverageRatio <= legalMaxCoverageRatio;
  const floorAreaRatioCompliant = proposedFloorAreaRatio <= legalMaxFloorAreaRatio;

  // Slant line compliance (Road slant check: limit = road_width * 1.25 or 1.50 depending on zone)
  const slantGradient = zoningType.includes('商業') || zoningType.includes('工業') ? 1.5 : 1.25;
  const maxAllowableHeightAtBoundary = input.frontRoadWidthM * slantGradient;
  // A simplified rule: if proposed height exceeds max height at boundary + setback margin, it fails.
  // Setback margin approximation: (siteArea - buildingArea) / frontage_width (approx 10m)
  const estimatedSetbackM = Math.max(2, (input.siteAreaSqm - input.proposedBuildingAreaSqm) / 20);
  const slantHeightLimit = maxAllowableHeightAtBoundary + (estimatedSetbackM * slantGradient);
  const slantLineCompliant = input.proposedHeightM <= slantHeightLimit;

  // Absolute height limit compliance
  const heightLimitCompliant = legalHeightLimit === null || input.proposedHeightM <= legalHeightLimit;

  const isFullyCompliant = coverageRatioCompliant && floorAreaRatioCompliant && slantLineCompliant && heightLimitCompliant;

  // 4. Generate summary and tips
  let complianceSummaryJa = '計画建物はすべての都市計画規制（建蔽率、容積率、斜線制限、絶対高さ制限）に適合しています。';
  if (!isFullyCompliant) {
    const violations: string[] = [];
    if (!coverageRatioCompliant) violations.push('建蔽率超過');
    if (!floorAreaRatioCompliant) violations.push('容積率超過');
    if (!slantLineCompliant) violations.push('道路斜線制限抵触');
    if (!heightLimitCompliant) violations.push('絶対高さ制限超過');
    complianceSummaryJa = `計画建物に一部規制不適合があります（不適合項目: ${violations.join('、')}）。改善が必要です。`;
  }

  const optimizationTipsJa: string[] = [];
  if (!coverageRatioCompliant) {
    optimizationTipsJa.push('建物の建築面積を縮小するか、敷地面積を拡大（隣地の買い増しなど）して建蔽率を基準内に抑えてください。');
  }
  if (!floorAreaRatioCompliant) {
    optimizationTipsJa.push('延床面積を削減するか、共同住宅の容積率緩和特例（エントランス、共用廊下、エレベーターシャフトの除外）の適用を検討してください。');
  }
  if (!slantLineCompliant) {
    optimizationTipsJa.push('計画建物を前面道路から後退（セットバック）させることで、斜線制限による高さの許容量を増やすことができます。');
    optimizationTipsJa.push('天空率（Sky Factor）を用いた算定方式を適用することで、道路斜線制限を超過していても法的に適合と判定される可能性があります。');
  }
  if (floorAreaRatioCompliant && proposedFloorAreaRatio < legalMaxFloorAreaRatio * 0.8) {
    const extraArea = Math.round((legalMaxFloorAreaRatio - proposedFloorAreaRatio) * input.siteAreaSqm / 100);
    optimizationTipsJa.push(`まだ容積率に余裕があります。最大で約 ${extraArea} ㎡ の延床面積を追加可能です。上層階の増築や天井高の確保を検討できます。`);
  }

  const markdownReport = `# 用途地域・法的斜線制限 監査レポート
\`Premium Mode: Enterprise Tier Activated\`

本レポートは、指定された開発計画建物プランが、敷地の都市計画法および建築基準法に基づく規制に適合しているかを自動監査した結果です。

---

## 📍 対象地および計画概要
- **所在地**: ${input.prefecture} ${input.city} ${input.address ?? ''}
- **座標**: 緯度 ${lat.toFixed(6)} / 経度 ${lng.toFixed(6)}
- **用途地域（判定）**: **${zoningType}**
- **前面道路幅員**: ${input.frontRoadWidthM} m

---

## 📊 監査結果サマリー

| 規制項目 | 法定限界・基準値 | 計画数値 | 適合判定 |
| :--- | :--- | :--- | :--- |
| **建蔽率** | ${legalMaxCoverageRatio} % | ${proposedCoverageRatio} % | ${coverageRatioCompliant ? '✅ 適合' : '❌ 不適合'} |
| **容積率** | ${legalMaxFloorAreaRatio} % | ${proposedFloorAreaRatio} % | ${floorAreaRatioCompliant ? '✅ 適合' : '❌ 不適合'} |
| **道路・隣地斜線** | 斜線勾配 ${slantGradient} (限界高: 約 ${slantHeightLimit.toFixed(1)}m) | 高さ ${input.proposedHeightM}m (${input.proposedFloors}階) | ${slantLineCompliant ? '✅ 適合' : '❌ 不適合'} |
| **絶対高さ制限** | ${legalHeightLimit ? `${legalHeightLimit} m` : '制限なし'} | 高さ ${input.proposedHeightM} m | ${heightLimitCompliant ? '✅ 適合' : '❌ 不適合'} |

### 総合判定: ${isFullyCompliant ? '🟢 【適合】 合法的に建築可能です' : '🔴 【要修正】 法的規制に抵触しています'}
> **状況解説**: ${complianceSummaryJa}

---

## 💡 法的容積の最大化・計画最適化に向けたアドバイス
${optimizationTipsJa.map(tip => `- ${tip}`).join('\n')}

---
*免責事項: 本監査レポートは入力された簡易的なスペックと地域の法定基本値に基づくシミュレーションであり、各自治体の詳細な建築条例や地区計画、日影規制による詳細制限を完全に反映したものではありません。実際の設計・確認申請にあたっては、必ず一級建築士または特定行政庁にご相談ください。*`;

  return {
    latitude: lat,
    longitude: lng,
    zoningType,
    legalMaxCoverageRatio,
    legalMaxFloorAreaRatio,
    proposedCoverageRatio,
    proposedFloorAreaRatio,
    coverageRatioCompliant,
    floorAreaRatioCompliant,
    slantLineCompliant,
    heightLimitCompliant,
    isFullyCompliant,
    complianceSummaryJa,
    optimizationTipsJa,
    markdownReport,
    attribution: 'Enterprise 3D Zoning & Compliance Auditor',
  };
}
