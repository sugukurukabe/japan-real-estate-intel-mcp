#!/usr/bin/env python3
"""Replace the prompts section in server.ts with correct Zod schema args."""
import sys

with open('src/server.ts', 'rb') as f:
    content = f.read()

marker_start = b'  // -- Prompts --'
marker_end = b'  return server;\r\n}\r\n'

idx_start = content.find(marker_start)
idx_end = content.find(marker_end, idx_start)

if idx_start == -1 or idx_end == -1:
    print('Markers not found!', idx_start, idx_end)
    sys.exit(1)

new_prompts = (
    "  // -- Prompts --\r\n"
    "\r\n"
    "  server.prompt(\r\n"
    "    'investment_report',\r\n"
    "    '\u4e0d\u52d5\u7523\u6295\u8cc7\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3059\u308b\u30d7\u30ed\u30f3\u30d7\u30c8\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8',\r\n"
    "    {\r\n"
    "      prefecture: z.string().optional().describe('\u90fd\u9053\u5e9c\u770c\u540d\uff08\u4f8b: \u611b\u77e5\u770c, \u6771\u4eac\u90fd\uff09'),\r\n"
    "      area: z.string().optional().describe('\u5206\u6790\u30a8\u30ea\u30a2\uff08\u4f8b: \u540d\u53e4\u5c4b\u5e02\u4e2d\u533a\uff09'),\r\n"
    "      property_type: z.string().optional().describe('\u7269\u4ef6\u7a2e\u5225\uff08residential/commercial/office/logistics/mixed\uff09'),\r\n"
    "    },\r\n"
    "    (args) => ({\r\n"
    "      messages: [\r\n"
    "        {\r\n"
    "          role: 'user' as const,\r\n"
    "          content: {\r\n"
    "            type: 'text' as const,\r\n"
    "            text: `\u4ee5\u4e0b\u306e\u6761\u4ef6\u3067\u4e0d\u52d5\u7523\u6295\u8cc7\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002\\n\\n\u90fd\u9053\u5e9c\u770c: ${args.prefecture ?? '\u611b\u77e5\u770c'}\\n\u30a8\u30ea\u30a2: ${args.area ?? '\u540d\u53e4\u5c4b\u5e02\u4e2d\u533a'}\\n\u7269\u4ef6\u7a2e\u5225: ${args.property_type ?? 'mixed'}\\n\\n\u624b\u9806:\\n1. cross_analyze_real_estate_market \u30c4\u30fc\u30eb\u3067\u4fa1\u683c\u30c8\u30ec\u30f3\u30c9\u30fb\u9700\u7d66\u30fb\u30ea\u30b9\u30af\u3092\u5206\u6790\\n2. assess_property_risk \u30c4\u30fc\u30eb\u3067\u707d\u5bb3\u30ea\u30b9\u30af\u3092\u8a55\u4fa1\\n3. generate_area_report \u30c4\u30fc\u30eb\u3067\u7dcf\u5408\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\uff08format: \"markdown\"\uff09\\n4. \u6295\u8cc7\u5224\u65ad\u306e\u30b5\u30de\u30ea\u30fc\u3068\u63a8\u5968\u30a2\u30af\u30b7\u30e7\u30f3\u3092\u65e5\u672c\u8a9e\u3067\u307e\u3068\u3081\u3066\u304f\u3060\u3055\u3044`,\r\n"
    "          },\r\n"
    "        },\r\n"
    "      ],\r\n"
    "    }),\r\n"
    "  );\r\n"
    "\r\n"
    "  server.prompt(\r\n"
    "    'store_location_evaluation',\r\n"
    "    '\u5e97\u8217\u51fa\u5e97\u5019\u88dc\u5730\u3092\u8a55\u4fa1\u3059\u308b\u30d7\u30ed\u30f3\u30d7\u30c8\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8',\r\n"
    "    {\r\n"
    "      prefecture: z.string().optional().describe('\u90fd\u9053\u5e9c\u770c\u540d'),\r\n"
    "      area: z.string().optional().describe('\u51fa\u5e97\u5019\u88dc\u30a8\u30ea\u30a2'),\r\n"
    "      store_type: z.string().optional().describe('\u5e97\u8217\u30bf\u30a4\u30d7\uff08convenience/restaurant/cafe/pharmacy/gym/beauty/supermarket/specialty\uff09'),\r\n"
    "    },\r\n"
    "    (args) => ({\r\n"
    "      messages: [\r\n"
    "        {\r\n"
    "          role: 'user' as const,\r\n"
    "          content: {\r\n"
    "            type: 'text' as const,\r\n"
    "            text: `\u4ee5\u4e0b\u306e\u6761\u4ef6\u3067\u5e97\u8217\u51fa\u5e97\u9069\u5730\u8a55\u4fa1\u3092\u884c\u3063\u3066\u304f\u3060\u3055\u3044\u3002\\n\\n\u90fd\u9053\u5e9c\u770c: ${args.prefecture ?? '\u611b\u77e5\u770c'}\\n\u30a8\u30ea\u30a2: ${args.area ?? '\u540d\u53e4\u5c4b\u5e02\u4e2d\u533a'}\\n\u5e97\u8217\u30bf\u30a4\u30d7: ${args.store_type ?? 'restaurant'}\\n\\n\u624b\u9806:\\n1. evaluate_store_location \u30c4\u30fc\u30eb\u3067\u51fa\u5e97\u30b9\u30b3\u30a2\u3092\u7b97\u51fa\\n2. drill_down_local_analysis \u30c4\u30fc\u30eb\u3067\u753a\u4e01\u76ee\u30ec\u30d9\u30eb\u306e\u8a73\u7d30\u5206\u6790\u3092\u5b9f\u65bd\\n3. \u30b9\u30b3\u30a2\u4e0a\u4f4d\u30a8\u30ea\u30a2\u3068\u305d\u306e\u7406\u7531\u3092\u65e5\u672c\u8a9e\u3067\u8aac\u660e\u3057\u3066\u304f\u3060\u3055\u3044\\n4. \u61f8\u5ff5\u70b9\u3068\u5bfe\u7b56\u3082\u5408\u308f\u305b\u3066\u307e\u3068\u3081\u3066\u304f\u3060\u3055\u3044`,\r\n"
    "          },\r\n"
    "        },\r\n"
    "      ],\r\n"
    "    }),\r\n"
    "  );\r\n"
    "\r\n"
    "  server.prompt(\r\n"
    "    'prefecture_comparison',\r\n"
    "    '\u8907\u6570\u90fd\u9053\u5e9c\u770c\u306e\u4e0d\u52d5\u7523\u5e02\u5834\u3092\u6bd4\u8f03\u5206\u6790\u3059\u308b\u30d7\u30ed\u30f3\u30d7\u30c8\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8',\r\n"
    "    {\r\n"
    "      prefectures: z.string().optional().describe('\u6bd4\u8f03\u3059\u308b\u90fd\u9053\u5e9c\u770c\uff08\u30ab\u30f3\u30de\u533a\u5207\u308a\u3001\u6700\u592745\u770c\u3002\u4f8b: \u611b\u77e5\u770c,\u6771\u4eac\u90fd,\u5927\u962a\u5e9c\uff09'),\r\n"
    "      metrics: z.string().optional().describe('\u6bd4\u8f03\u6307\u6a19\uff08\u30ab\u30f3\u30de\u533a\u5207\u308a\u3002\u4f8b: land_price,population,risk\uff09'),\r\n"
    "    },\r\n"
    "    (args) => {\r\n"
    "      const prefList = args.prefectures ?? '\u611b\u77e5\u770c,\u6771\u4eac\u90fd,\u5927\u962a\u5e9c';\r\n"
    "      const metricList = args.metrics ?? 'land_price,population,risk';\r\n"
    "      return {\r\n"
    "        messages: [\r\n"
    "          {\r\n"
    "            role: 'user' as const,\r\n"
    "            content: {\r\n"
    "              type: 'text' as const,\r\n"
    "              text: `\u4ee5\u4e0b\u306e\u6761\u4ef6\u3067\u90fd\u9053\u5e9c\u770c\u6bd4\u8f03\u5206\u6790\u3092\u884c\u3063\u3066\u304f\u3060\u3055\u3044\u3002\\n\\n\u6bd4\u8f03\u5bfe\u8c61: ${prefList}\\n\u6bd4\u8f03\u6307\u6a19: ${metricList}\\n\\n\u624b\u9806:\\n1. compare_prefectures \u30c4\u30fc\u30eb\u3092\u4f7f\u7528\u3057\u3066\u6307\u5b9a\u3057\u305f\u90fd\u9053\u5e9c\u770c\u3068\u6307\u6a19\u3067\u30af\u30ed\u30b9\u6bd4\u8f03\u3092\u5b9f\u65bd\\n2. \u30ec\u30fc\u30c0\u30fc\u30c1\u30e3\u30fc\u30c8\u30c7\u30fc\u30bf\u3092\u6d3b\u7528\u3057\u3066\u5404\u770c\u306e\u5f37\u307f\u30fb\u5f31\u307f\u3092\u53ef\u8996\u5316\\n3. \u30e9\u30f3\u30ad\u30f3\u30b0\u3068\u5dee\u5206\u30cf\u30a4\u30e9\u30a4\u30c8\uff08\u4f8b: \u611b\u77e5\u6bd4 +15%\uff09\u3092\u65e5\u672c\u8a9e\u3067\u89e3\u8aac\\n4. \u6295\u8cc7\u5bb6\u8996\u70b9\u3067\u306e\u63a8\u5968\u30a8\u30ea\u30a2\u3068\u7406\u7531\u3092\u307e\u3068\u3081\u3066\u304f\u3060\u3055\u3044`,\r\n"
    "            },\r\n"
    "          },\r\n"
    "        ],\r\n"
    "      };\r\n"
    "    },\r\n"
    "  );\r\n"
    "\r\n"
).encode('utf-8')

new_content = content[:idx_start] + new_prompts + marker_end

with open('src/server.ts', 'wb') as f:
    f.write(new_content)

print('Done, written', len(new_content), 'bytes')
