import { optimizePortfolio } from '../analysis/portfolio_optimization.js';
import type { OptimizePortfolioInput, OptimizePortfolioOutput } from '../schemas.js';

export async function optimizePortfolioTool(input: OptimizePortfolioInput): Promise<OptimizePortfolioOutput> {
  return optimizePortfolio(input);
}
