import type { WidgetConfig } from './types';
import { compositeValueScoreWidget } from './configs/compositeValueScore';
import { discoverOpportunitiesWidget } from './configs/discoverOpportunities';
import { zoningInfoWidget } from './configs/zoningInfo';
import { vacancyStatsWidget } from './configs/vacancyStats';
import { populationOutlookWidget } from './configs/populationOutlook';
import { macroSnapshotWidget } from './configs/macroSnapshot';
import { arbitrageSignalsWidget } from './configs/arbitrageSignals';
import { purchaseReviewWidget } from './configs/purchaseReview';
import { leveragedCashflowWidget } from './configs/leveragedCashflow';
import { portfolioAllocationWidget } from './configs/portfolioAllocation';
import { auditZoningComplianceWidget } from './configs/auditZoningCompliance';
import { demographicShiftWidget } from './configs/demographicShift';

/**
 * ツール名 → ウィジェット設定のレジストリ。
 * 新しい`registerAppTool`ツールにウィジェットを追加する手順:
 *   1. `widgets/configs/{toolName}.ts` に `WidgetConfig` を1つエクスポート
 *   2. このファイルに import + 配列追加の2行を足す
 * `open_dashboard` / `quick_visual_summary` はダッシュボード自体を描画するため
 * 対象外(レジストリに登録しない = オーバーレイを表示しない)。
 *
 * Registry mapping tool name → widget config. To add a widget for a new
 * `registerAppTool` tool: export one `WidgetConfig` under
 * `widgets/configs/{toolName}.ts`, then add two lines here (import + array
 * entry). `open_dashboard` / `quick_visual_summary` render the dashboard
 * itself and are intentionally not registered (no overlay).
 */
const WIDGETS: WidgetConfig[] = [
  compositeValueScoreWidget,
  discoverOpportunitiesWidget,
  zoningInfoWidget,
  vacancyStatsWidget,
  populationOutlookWidget,
  macroSnapshotWidget,
  arbitrageSignalsWidget,
  purchaseReviewWidget,
  leveragedCashflowWidget,
  portfolioAllocationWidget,
  auditZoningComplianceWidget,
  demographicShiftWidget,
];

const REGISTRY: Map<string, WidgetConfig> = new Map(WIDGETS.map((w) => [w.toolName, w]));

export function getWidgetConfig(toolName: string | undefined): WidgetConfig | undefined {
  if (!toolName) return undefined;
  return REGISTRY.get(toolName);
}
