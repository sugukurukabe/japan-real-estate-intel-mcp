import sys

with open('src/server.ts', 'rb') as f:
    content = f.read()

changed = False

# 1. Inject import
if b'import { portfolioOptimizer }' not in content:
    old = b"import { forecastLandPriceTrend } from './tools/forecast_land_price_trend.js';"
    new = (
        b"import { forecastLandPriceTrend } from './tools/forecast_land_price_trend.js';\r\n"
        b"import { portfolioOptimizer } from './tools/portfolio_optimizer.js';"
    )
    if old in content:
        content = content.replace(old, new)
        changed = True
        print('Injected import')
    else:
        print('WARNING: import marker not found')

# 2. Inject schema import
if b'PortfolioOptimizerInput' not in content:
    old_s = b"  ForecastLandPriceTrendInput,\r\n  ScenarioWhatIfInput,\r\n} from './schemas.js';"
    new_s = b"  ForecastLandPriceTrendInput,\r\n  ScenarioWhatIfInput,\r\n  PortfolioOptimizerInput,\r\n} from './schemas.js';"
    if old_s in content:
        content = content.replace(old_s, new_s)
        changed = True
        print('Injected schema import')
    else:
        print('WARNING: schema marker not found')

# 3. Inject tool registration
desc = '\u8907\u6570\u30a8\u30ea\u30a2\u306e\u4e0d\u52d5\u7523\u6295\u8cc7\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa\u3092\u6700\u9069\u5316\u3002\u6700\u59275\u30a8\u30ea\u30a2\u3092\u6bd4\u8f03\u3057\u3001\u671f\u5f85\u5e74\u7387\u30ea\u30bf\u30fc\u30f3\u30fb\u30ea\u30b9\u30af\u30b9\u30b3\u30a2\u30fb\u5206\u6563\u30b9\u30b3\u30a2\u30fb\u30b7\u30e3\u30fc\u30d7\u30ec\u30b7\u30aa\u3092\u7b97\u51fa\u3057\u5c55\u958b\u3059\u308b\u3002'
tool_block = (
    b"  server.tool(\r\n"
    b"    'portfolio_optimizer',\r\n"
    b"    '" + desc.encode('utf-8') + b"',\r\n"
    b"    PortfolioOptimizerInput.shape,\r\n"
    b"    (args) => withErrorHandling('portfolio_optimizer', 'multi', async () => {\r\n"
    b"      const input = PortfolioOptimizerInput.parse(args);\r\n"
    b"      const result = portfolioOptimizer(input);\r\n"
    b"      return {\r\n"
    b"        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],\r\n"
    b"        structuredContent: { ...result, attribution: ATTRIBUTION },\r\n"
    b"      };\r\n"
    b"    }),\r\n"
    b"  );\r\n\r\n"
    b"  return server;\r\n"
    b"}\r\n"
)

if b'portfolio_optimizer' not in content or b'portfolioOptimizer' not in content:
    marker = b"  return server;\r\n}\r\n"
    if marker in content:
        content = content.replace(marker, tool_block)
        changed = True
        print('Injected tool registration')
    else:
        print('WARNING: return marker not found')
else:
    print('Tool registration already present')

# 4. Update tool count
if b'// -- Tools (13) --' not in content:
    content = content.replace(b'// -- Tools (12) --', b'// -- Tools (13) --')
    changed = True
    print('Updated tool count to 13')

if changed:
    with open('src/server.ts', 'wb') as f:
        f.write(content)
    print('Saved server.ts')
else:
    print('No changes needed')
