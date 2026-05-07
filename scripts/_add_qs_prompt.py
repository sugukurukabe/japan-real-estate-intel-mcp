"""Inject quick_start_examples MCP Prompt into server.ts before 'return server'"""

prompt_desc = (
    '\u521d\u56de\u30e6\u30fc\u30b6\u30fc\u5411\u3051\u30af\u30a4\u30c3\u30af\u30b9\u30bf\u30fc\u30c8\u30ac\u30a4\u30c9\u3002'
    '6\u3064\u306e\u5177\u4f53\u7684\u306a\u4f7f\u7528\u4f8b\u3092\u30b3\u30fc\u30eb\u4f8b\u4ed8\u304d\u3067Markdown\u8fd4\u5374\u3059\u308b'
)
goal_desc = (
    'investment=\u6295\u8cc7\u5bb6\u5411\u3051\u3001store=\u5e97\u8217\u51fa\u5e97\u5411\u3051\u3001all=\u5168\u6599\uff08\u30c7\u30d5\u30a9\u30eb\u30c8\uff09'
)

# Build the Markdown as an array of strings joined with \n (avoids backtick and template literal issues)
# We use ['line1','line2',...].join('\\n') in the TS source
md_parts = [
    '## Japan Real Estate Intel MCP -- Quick Start',
    '',
    '\u4ee5\u4e0b\u306e\u4f8b\u3092\u305d\u306e\u307e\u307e\u30c1\u30e3\u30c3\u30c8\u306b\u8cbc\u308a\u4ed8\u3051\u3066\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002',
    '',
    '---',
    '',
    '### 1. \u5730\u4fa1\u30c8\u30ec\u30f3\u30c9\u4e88\u6e2c\uff08\u6295\u8cc7\u5224\u65ad\uff09',
    '```',
    'forecast_land_price_trend({ "prefecture": "\u6771\u4eac\u90fd", "city": "\u65b0\u5bbf\u533a", "horizon": "5y" })',
    '```',
    '> **\u7528\u9014**: 5\u5e74\u5f8c\u306e\u5730\u4fa1\u4e88\u6e2c\u30fbCAGR\u30fb\u6295\u8cc7\u30b7\u30b0\u30ca\u30eb(buy/hold/caution)\u3092\u53d6\u5f97\u3002',
    '',
    '---',
    '',
    '### 2. \u4f01\u696d\u7acb\u5730\u9700\u8981\u5206\u6790',
    '```',
    'predict_corporate_demand({ "prefecture": "\u611b\u77e5\u770c", "city": "\u540d\u53e4\u5c4b\u5e02\u4e2d\u533a", "industryType": "manufacturing" })',
    '```',
    '> **\u7528\u9014**: \u5236\u9020\u696d\u30fb\u30aa\u30d5\u30a3\u30b9\u30fb\u5c0f\u58f2\u306e\u9700\u8981\u30b9\u30b3\u30a2\u3002\u6cd5\u4eba\u8abf\u67fb\u306b\u6709\u52b9\u3002',
    '',
    '---',
    '',
    '### 3. \u30d5\u30a1\u30df\u30ea\u30fc\u5411\u3051\u9069\u6027\u8a55\u4fa1',
    '```',
    'assess_family_friendly_score({ "prefecture": "\u795e\u5948\u5ddd\u770c", "city": "\u6a2a\u6d5c\u5e02\u897f\u533a" })',
    '```',
    '> **\u7528\u9014**: \u6559\u80b2\u30fb\u5b89\u5168\u30fb\u533b\u7642\u306e3\u8ef8\u3067\u4f4f\u5b85\u9069\u5730\u3092\u7dcf\u5408\u8a55\u4fa1\u3002',
    '',
    '---',
    '',
    '### 4. \u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa\u6700\u9069\u5316',
    '```',
    'portfolio_optimizer({',
    '  "targets": [',
    '    { "prefecture": "\u6771\u4eac\u90fd", "city": "\u65b0\u5bbf\u533a", "propertyType": "office", "budgetManYen": 10000 },',
    '    { "prefecture": "\u5927\u962a\u5e9c", "city": "\u5927\u962a\u5e02\u5317\u533a", "propertyType": "commercial", "budgetManYen": 6000 },',
    '    { "prefecture": "\u57fc\u7389\u770c", "city": "\u3055\u3044\u305f\u307e\u5e02\u5927\u5bae\u533a", "propertyType": "residential", "budgetManYen": 4000 }',
    '  ],',
    '  "riskTolerance": "medium", "investmentHorizon": "5y", "optimizeFor": "risk_adjusted"',
    '})',
    '```',
    '> **\u7528\u9014**: 3\u30a8\u30ea\u30a2\u306e\u5c55\u958b\u6bd4\u7387\u30fb\u30b7\u30e3\u30fc\u30d7\u30ec\u30b7\u30aa\u30fb\u63a8\u5968\u914d\u5206\u3092Markdown\u30ec\u30dd\u30fc\u30c8\u3067\u51fa\u529b\u3002',
    '',
    '---',
    '',
    '### 5. What-If \u30b7\u30ca\u30ea\u30aa\u5206\u6790',
    '```',
    'scenario_what_if({ "prefecture": "\u5927\u962a\u5e9c", "city": "\u5927\u962a\u5e02\u4e2d\u592e\u533a", "scenario": "new_station", "scale": "large" })',
    '```',
    '> **\u7528\u9014**: \u65b0\u99c5\u8a2d\u7f6e\u30fb\u5927\u578b\u5546\u696d\u65bd\u8a2d\u306e\u5730\u4fa1\u30fb\u6295\u8cc7\u30b9\u30b3\u30a2\u3078\u306e\u5f71\u97ff\u3092\u8a66\u7b97\u3002',
    '',
    '---',
    '',
    '### 6. \u5e97\u8217\u51fa\u5e97\u9069\u5730\u8a55\u4fa1',
    '```',
    'evaluate_store_location({ "city": "\u798f\u5ca1\u5e02\u535a\u591a\u533a", "storeType": "cafe", "targetCustomer": "office_worker" })',
    '```',
    '> **\u7528\u9014**: \u4eba\u6d41\u30fb\u4ea4\u901a\u30fb\u7af6\u5408\u5e97\u5206\u5e03\u3092\u8003\u616e\u3057\u305f\u51fa\u5e97\u9069\u5730\u30b9\u30b3\u30a2\u3092\u7b97\u51fa\u3002',
    '',
    '---',
    '',
    '> **\u30d2\u30f3\u30c8**: cross_analyze_real_estate_market \u3067\u5730\u4fa1\u30fb\u4eba\u6d41\u30fb\u6559\u80b2\u30fb\u4f01\u696d\u30fb\u5bb6\u65cf\u30b9\u30b3\u30a2\u3092\u4e00\u62ec\u5206\u6790\u3067\u304d\u307e\u3059\u3002',
]

# Escape single quotes for use inside TS string literals
def esc(s):
    return s.replace("'", "\\'").replace('\\', '\\\\').replace('\r', '').replace('\n', '\\n')

# Build TS array literal: ['line1', 'line2', ...].join('\n')
ts_parts = ', '.join("'" + esc(p) + "'" for p in md_parts)
text_expr = '[' + ts_parts + "].join('\\n')"

lines = [
    "  server.prompt(",
    "    'quick_start_examples',",
    "    '" + prompt_desc + "',",
    "    {",
    "      goal: z.string().optional().describe('" + goal_desc + "'),",
    "    },",
    "    ({ goal: _goal }) => ({",
    "      messages: [{",
    "        role: 'user' as const,",
    "        content: {",
    "          type: 'text' as const,",
    "          text: " + text_expr + ",",
    "        },",
    "      }],",
    "    }),",
    "  );",
    "",
    "  return server;",
    "}",
]

prompt_text = '\r\n'.join(lines) + '\r\n'

with open('src/server.ts', 'rb') as f:
    content = f.read()

# Remove any previous failed injection (the marker may have been replaced already)
marker = b"  return server;\r\n}\r\n"

if b"'quick_start_examples'" in content:
    print('already present - skipping')
else:
    if marker in content:
        content = content.replace(marker, prompt_text.encode('utf-8'))
        with open('src/server.ts', 'wb') as f:
            f.write(content)
        print('Injected quick_start_examples prompt')
    else:
        print('ERROR: marker not found')
