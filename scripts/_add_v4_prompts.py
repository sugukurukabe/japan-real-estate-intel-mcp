# -*- coding: utf-8 -*-
"""Add v4.0 MCP Prompts for forecast_land_price_trend and scenario_what_if."""
import sys

path = 'src/server.ts'
with open(path, 'rb') as f:
    content = f.read()

marker = b'  return server;\n}'
if marker not in content:
    marker = b'  return server;\r\n}'
if marker not in content:
    print("ERROR: Could not find 'return server;' marker", file=sys.stderr)
    sys.exit(1)

new_prompts_str = """
  server.prompt(
    'land_price_forecast_report',
    '\u5730\u4fa1\u30c8\u30ec\u30f3\u30c9\u4e88\u6e2c\u30ec\u30dd\u30fc\u30c8\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3002forecast_land_price_trend \u30c4\u30fc\u30eb\u3092\u547c\u3073\u51fa\u3057\u3066\u5730\u4fa1\u4e88\u6e2c\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3059\u308b',
    {
      prefecture: z.string().optional().describe('\u5bfe\u8c61\u90fd\u9053\u5e9c\u770c\uff08\u7701\u7565\u6642\u306f\u611b\u77e5\u770c\uff09'),
      city: z.string().optional().describe('\u5e02\u533a\u753a\u6751'),
      horizon: z.string().optional().describe('\u4e88\u6e2c\u671f\u9593\uff081y/3y/5y\uff09'),
    },
    ({ prefecture, city, horizon }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `\u5730\u4fa1\u30c8\u30ec\u30f3\u30c9\u4e88\u6e2c\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002`,
            `\u90fd\u9053\u5e9c\u770c: ${prefecture ?? '\u611b\u77e5\u770c'}`,
            `\u5e02\u533a\u753a\u6751: ${city ?? '\u540d\u53e4\u5c4b\u5e02\u4e2d\u533a'}`,
            `\u4e88\u6e2c\u671f\u9593: ${horizon ?? '3y'}`,
            ``,
            `forecast_land_price_trend \u30c4\u30fc\u30eb\u3067CAGR\u30fb\u30c8\u30ec\u30f3\u30c9\u65b9\u5411\u30fb\u5c06\u6765\u4e88\u6e2c\u30b7\u30ea\u30fc\u30ba\u30fb\u6295\u8cc4\u30b7\u30b0\u30ca\u30eb\u3092\u542b\u3080Markdown\u30ec\u30dd\u30fc\u30c8\u3092\u51fa\u529b\u3002`,
          ].join('\\n'),
        },
      }],
    }),
  );

  server.prompt(
    'scenario_what_if_analysis',
    'What-If \u30b7\u30ca\u30ea\u30aa\u5206\u6790\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3002scenario_what_if \u30c4\u30fc\u30eb\u3067\u4ef3\u60f3\u30a4\u30d9\u30f3\u30c8\u306e\u5f71\u97ff\u3092\u8a66\u7b97',
    {
      prefecture: z.string().optional().describe('\u5bfe\u8c61\u90fd\u9053\u5e9c\u770c'),
      city: z.string().optional().describe('\u5e02\u533a\u753a\u6751'),
      scenario: z.string().optional().describe('\u30b7\u30ca\u30ea\u30aa\u7a2e\u5225'),
      scale: z.string().optional().describe('\u898f\u6a21\uff08small/medium/large\uff09'),
    },
    ({ prefecture, city, scenario, scale }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `\u4ee5\u4e0b\u306e\u6761\u4ef6\u3067What-If\u30b7\u30ca\u30ea\u30aa\u5206\u6790\u3092\u884c\u3063\u3066\u304f\u3060\u3055\u3044\u3002`,
            `\u90fd\u9053\u5e9c\u770c: ${prefecture ?? '\u611b\u77e5\u770c'}`,
            `\u5e02\u533a\u753a\u6751: ${city ?? '\u540d\u53e4\u5c4b\u5e02\u4e2d\u533a'}`,
            `\u30b7\u30ca\u30ea\u30aa: ${scenario ?? 'new_commercial_facility'}`,
            `\u898f\u6a21: ${scale ?? 'medium'}`,
            ``,
            `scenario_what_if \u30c4\u30fc\u30eb\u3067\u30d9\u30fc\u30b9\u30e9\u30a4\u30f3vs\u30b7\u30ca\u30ea\u30aa\u5f8c\u306e\u5730\u4fa1\u30fb\u6295\u8cc4\u30b9\u30b3\u30a2\u30fb\u30ea\u30b9\u30af\u5f71\u97ff\u3092\u6bd4\u8f03\u3057Markdown\u3067\u51fa\u529b\u3002`,
          ].join('\\n'),
        },
      }],
    }),
  );

"""

new_prompts_bytes = new_prompts_str.encode('utf-8')
content = content.replace(marker, new_prompts_bytes + marker, 1)

with open(path, 'wb') as f:
    f.write(content)

print("OK: added land_price_forecast_report and scenario_what_if_analysis prompts")
