/**
 * Tiering configuration for the MCP server.
 * Maps MCP primitives to Free/Pro/Enterprise tiers.
 *
 * This module is currently configuration-only. Runtime enforcement should be
 * wired into the MCP tool/resource/prompt handlers once account identity and
 * usage metering are available.
 */

export type Tier = 'free' | 'pro' | 'enterprise';

export interface TierConfig {
  tools: string[];
  resources: string[];
  prompts: string[];
  monthlyToolCalls: number;
  mcpAppsEnabled: boolean;
  brandedExport: boolean;
  priorityDataUpdates: boolean;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  free: {
    tools: [
      'search',
      'fetch',
      'search_area_candidates',
      'cross_analyze_real_estate_market',
      'assess_property_risk',
      'quick_visual_summary',
    ],
    resources: [
      'realestate://land-price/{prefecture}/{area}',
      'hazard://flood/{prefecture}/{area}',
      'stats://population-trend/{prefecture}/{area}',
    ],
    prompts: ['quick_start_examples'],
    monthlyToolCalls: 50,
    mcpAppsEnabled: false,
    brandedExport: false,
    priorityDataUpdates: false,
  },
  pro: {
    tools: [
      'search',
      'fetch',
      'search_area_candidates',
      'cross_analyze_real_estate_market',
      'assess_property_risk',
      'generate_area_report',
      'open_dashboard',
      'assess_family_friendly_score',
      'predict_corporate_demand',
      'compare_prefectures',
      'drill_down_local_analysis',
      'evaluate_store_location',
      'simulate_landscape_impact',
      'forecast_land_price_trend',
      'scenario_what_if',
      'portfolio_optimizer',
      'simulate_aichi_future',
      'discover_opportunities',
      'analyze_renovation_yield',
      'get_future_timeline',
      'get_chochou_profile',
      'recommend_renovation_targets',
      'generate_contract_support_package',
      'assess_contract_risk',
      'composite_value_score',
      'get_zoning_info',
      'get_vacancy_stats',
      'get_population_outlook',
      'get_real_estate_macro_snapshot',
      'detect_arbitrage_signals',
      'quick_visual_summary',
      'simulate_leveraged_cashflow',
      'review_purchase_recommendation',
    ],
    resources: [
      'realestate://land-price/{prefecture}/{area}',
      'hazard://flood/{prefecture}/{area}',
      'stats://population-trend/{prefecture}/{area}',
      'ui://japan-real-estate-intel/dashboard',
      'ui://japan-real-estate-intel/dashboard-3d',
    ],
    prompts: [
      'quick_start_examples',
      'investment_report',
      'store_location_evaluation',
      'prefecture_comparison',
      'land_price_forecast_report',
      'scenario_what_if_analysis',
      'portfolio_optimization',
      'aichi_future_value',
      'opportunity_radar',
      'composite_value_report',
      'zoning_lookup',
      'vacancy_analysis',
      'population_outlook_report',
      'arbitrage_scan',
    ],
    monthlyToolCalls: Infinity,
    mcpAppsEnabled: true,
    brandedExport: true,
    priorityDataUpdates: true,
  },
  enterprise: {
    tools: [], // all tools
    resources: [], // all resources
    prompts: [], // all prompts
    monthlyToolCalls: Infinity,
    mcpAppsEnabled: true,
    brandedExport: true,
    priorityDataUpdates: true,
  },
};

export function isToolAllowed(tier: Tier, toolName: string): boolean {
  if (tier === 'enterprise') return true;
  return TIER_CONFIG[tier].tools.includes(toolName);
}

export function isResourceAllowed(tier: Tier, resourceUri: string): boolean {
  if (tier === 'enterprise') return true;
  const config = TIER_CONFIG[tier];
  return config.resources.some((pattern) => {
    const regex = new RegExp('^' + pattern.replace(/\{[^}]+\}/g, '[^/]+') + '$');
    return regex.test(resourceUri);
  });
}

export function getTierDisplayInfo(tier: Tier): {
  name: string;
  nameJa: string;
  priceJpy: number | null;
} {
  switch (tier) {
    case 'free':
      return { name: 'Free', nameJa: '無料', priceJpy: 0 };
    case 'pro':
      return { name: 'Pro', nameJa: 'プロ', priceJpy: 550 };
    case 'enterprise':
      return { name: 'Enterprise', nameJa: 'エンタープライズ', priceJpy: null };
  }
}

import { verifyLicenseKey } from './auth/license.js';

/**
 * Dynamically resolves the active tier by validating the requested tier
 * against the provided license key.
 */
export async function resolveTier(
  requestedTier: Tier,
  licenseKey: string | undefined,
): Promise<{ tier: Tier; errorReason?: string }> {
  if (requestedTier === 'free') {
    return { tier: 'free' };
  }

  const result = await verifyLicenseKey(licenseKey);
  if (result.success) {
    if (result.tier === 'enterprise') {
      return { tier: requestedTier };
    }
    if (result.tier === 'pro' && requestedTier === 'pro') {
      return { tier: 'pro' };
    }
    return {
      tier: 'free',
      errorReason: `ライセンスプラン (${result.tier}) は要求されたプラン (${requestedTier}) と一致しません`,
    };
  }

  return { tier: 'free', errorReason: result.reason ?? '有効なライセンスキーがありません' };
}
