#!/usr/bin/env python3
"""Inject forecast_land_price_trend and scenario_what_if tool registrations into server.ts."""
import sys

path = 'src/server.ts'
with open(path, 'rb') as f:
    content = f.read()

# Find the insertion point: after the closing of simulate_landscape_impact tool
marker = b'  // -- Tools (10) --'
replacement = b'  // -- Tools (12) --'
content = content.replace(marker, replacement, 1)

# Find the insert point (after simulate_landscape_impact closing paren)
insert_after = b'''  server.tool(
    'simulate_landscape_impact','''
# Find end of simulate_landscape block: after the last `);` before the resources comment
resources_marker = b'  // ?????? Resources (prefecture/{area} pattern) ??????'
# We insert new tools before the resources section
new_tools = '''
  server.tool(
    'forecast_land_price_trend',
    '\u5730\u4fa1\u30c8\u30ec\u30f3\u30c9\u4e88\u6e2c\u30c4\u30fc\u30eb\u3002\u5730\u4fa1\u516c\u793a\u30c7\u30fc\u30bf\u306e\u5e74\u5225\u63a8\u79fb\u304b\u3089\u7dda\u5f62\u56de\u5e30\u30fb\u79fb\u52d5\u5e73\u5747\u3067\u5c06\u6765\u5730\u4fa1\u3092\u4e88\u6e2c\u3002CAGR\u30fb\u30c8\u30ec\u30f3\u30c9\u65b9\u5411\u30fb\u4fe1\u983c\u533a\u9593\u304a\u3088\u3073\u6295\u8cc4\u30b7\u30b0\u30ca\u30eb\uff08buy/hold/caution\uff09\u3092\u8fd4\u3059\u3002\u5bfe\u5fdc\u53bf: \u5168 8 \u90fd\u9053\u5e9c\u770c',
    ForecastLandPriceTrendInput.shape,
    (args) => withErrorHandling('forecast_land_price_trend', String(args.prefecture ?? 'aichi'), async () => {
      const input = ForecastLandPriceTrendInput.parse(args);
      const result = forecastLandPriceTrend(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'scenario_what_if',
    '\u30b7\u30ca\u30ea\u30aa What-If \u5206\u6790\u30c4\u30fc\u30eb\u3002\u300c\u65b0\u99c5\u958b\u696d\u300d\u300c\u5927\u578b\u5546\u696d\u65bd\u8a2d\u958b\u696d\u300d\u300c\u4eba\u53e3\u6e1b\u5c11\u300d\u300c\u707d\u5bb3\u30ea\u30b9\u30af\u5909\u52d5\u300d\u306a\u3069\u306e\u4eee\u60f3\u30a4\u30d9\u30f3\u30c8\u304c\u5730\u4fa1\u30fb\u4eba\u6d41\u30fb\u6295\u8cc4\u30b9\u30b3\u30a2\u306b\u4e0e\u3048\u308b\u5f71\u97ff\u3092\u8a66\u7b97\u3002\u30d9\u30fc\u30b9\u30e9\u30a4\u30f3vs\u30b7\u30ca\u30ea\u30aa\u6bd4\u8f03\u30fb\u6a5f\u4f1a\u30fb\u30ea\u30b9\u30af\u30fb\u63a8\u5968\u30a2\u30af\u30b7\u30e7\u30f3\u3092Markdown\u30ec\u30dd\u30fc\u30c8\u3067\u51fa\u529b\u3002\u5bfe\u5fdc\u53bf: \u5168 8 \u90fd\u9053\u5e9c\u770c',
    ScenarioWhatIfInput.shape,
    (args) => withErrorHandling('scenario_what_if', String(args.prefecture ?? 'aichi'), async () => {
      const input = ScenarioWhatIfInput.parse(args);
      const result = scenarioWhatIf(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

'''.encode('utf-8')

idx = content.find(resources_marker)
if idx == -1:
    print("ERROR: Could not find resources marker", file=sys.stderr)
    sys.exit(1)

content = content[:idx] + new_tools + content[idx:]

with open(path, 'wb') as f:
    f.write(content)

print("OK: injected forecast_land_price_trend and scenario_what_if tools")
