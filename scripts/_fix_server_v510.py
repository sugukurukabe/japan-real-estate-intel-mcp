"""Fix server.ts: add portfolio_optimizer tool registration + portfolio prompt"""

with open('src/server.ts', 'rb') as f:
    content = f.read()

# ── 1. Fix tool count comment ──────────────────────────────────────────────
if b'// -- Tools (12) --' in content:
    content = content.replace(b'// -- Tools (12) --', b'// -- Tools (13) --')
    print('Updated tool count to 13')

# ── 2. Inject portfolio_optimizer tool registration ────────────────────────
tool_desc = (
    '\u8907\u6570\u30a8\u30ea\u30a2\u306e\u4e0d\u52d5\u7523\u6295\u8cc7\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa'
    '\u3092\u6700\u9069\u5316\u3002\u6700\u59275\u30a8\u30ea\u30a2\u3092\u6bd4\u8f03\u3057\u3001\u671f\u5f85\u5e74'
    '\u7387\u30ea\u30bf\u30fc\u30f3\u30fb\u30ea\u30b9\u30af\u30b9\u30b3\u30a2\u30fb\u5206\u6563\u30b9\u30b3\u30a2'
    '\u30fb\u30b7\u30e3\u30fc\u30d7\u30ec\u30b7\u30aa\u3092\u7b97\u51fa\u3057\u5c55\u958b\u3059\u308b\u3002'
)

tool_registration = '\r\n'.join([
    "  server.tool(",
    "    'portfolio_optimizer',",
    "    '" + tool_desc + "',",
    "    PortfolioOptimizerInput.shape,",
    "    (args) => withErrorHandling('portfolio_optimizer', 'multi', async () => {",
    "      const input = PortfolioOptimizerInput.parse(args);",
    "      const result = portfolioOptimizer(input);",
    "      return {",
    "        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],",
    "        structuredContent: { ...result, attribution: ATTRIBUTION },",
    "      };",
    "    }),",
    "  );",
    "",
]) + '\r\n'

# ── 3. portfolio_optimization prompt ──────────────────────────────────────
prompt_desc = (
    '\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa\u6700\u9069\u5316\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3002'
    'portfolio_optimizer \u30c4\u30fc\u30eb\u3067\u8907\u6570\u30a8\u30ea\u30a2\u3092\u6bd4\u8f03\u3057'
    '\u6700\u9069\u914d\u5206\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3059\u308b'
)
pref_desc = '\u5bfe\u8c61\u90fd\u9053\u5e9c\u770c\uff08\u4f8b: \u6771\u4eac\u90fd,\u5927\u962a\u5e9c,\u57fc\u7389\u770c\uff09'
budget_desc = '\u5404\u30a8\u30ea\u30a2\u306e\u4e88\u7b97\uff08\u4e07\u5186\u3001\u30ab\u30f3\u30de\u533a\u5207\u308a\uff09'
risk_desc = '\u30ea\u30b9\u30af\u8a31\u5bb9\u5ea6 low/medium/high'
pref_default = '\u6771\u4eac\u90fd,\u5927\u962a\u5e9c,\u57fc\u7389\u770c'

prompt_registration = '\r\n'.join([
    "  server.prompt(",
    "    'portfolio_optimization',",
    "    '" + prompt_desc + "',",
    "    {",
    "      prefectures: z.string().optional().describe('" + pref_desc + "'),",
    "      budget_man_yen: z.string().optional().describe('" + budget_desc + "'),",
    "      risk_tolerance: z.string().optional().describe('" + risk_desc + "'),",
    "    },",
    "    ({ prefectures, budget_man_yen, risk_tolerance }) => ({",
    "      messages: [{",
    "        role: 'user' as const,",
    "        content: {",
    "          type: 'text' as const,",
    "          text: [",
    "            `\u30dd\u30fc\u30c8\u30d5\u30a9\u30ea\u30aa\u6700\u9069\u5316\u30ec\u30dd\u30fc\u30c8\u3092\u4f5c\u6210\u3057\u3066\u304f\u3060\u3055\u3044\u3002`,",
    "            `\u5bfe\u8c61\u90fd\u9053\u5e9c\u770c: ${prefectures ?? '" + pref_default + "'}`,",
    r"            `\u4e88\u7b97(\u4e07\u5186): ${budget_man_yen ?? '10000,5000,5000'}`,",
    "            `\u30ea\u30b9\u30af\u8a31\u5bb9\u5ea6: ${risk_tolerance ?? 'medium'}`,",
    "            ``,",
    "            `portfolio_optimizer \u30c4\u30fc\u30eb\u3067\u5404\u30a8\u30ea\u30a2\u306e\u30ea\u30bf\u30fc\u30f3\u30fb\u30ea\u30b9\u30af\u30fb\u63a8\u5968\u914d\u5206\u3092\u7b97\u51fa\u3057Markdown\u30ec\u30dd\u30fc\u30c8\u3092\u751f\u6210\u3002`,",
    r"          ].join('\n'),",
    "        },",
    "      }],",
    "    }),",
    "  );",
    "",
    "  return server;",
    "}",
]) + '\r\n'

marker = b"  return server;\r\n}\r\n"

if b"'portfolio_optimizer'" not in content:
    if marker in content:
        content = content.replace(
            marker,
            tool_registration.encode('utf-8') + marker
        )
        print('Injected portfolio_optimizer tool')
    else:
        print('ERROR: marker not found for tool')
else:
    print('portfolio_optimizer tool already present')

if b"'portfolio_optimization'" not in content:
    if marker in content:
        content = content.replace(
            marker,
            prompt_registration.encode('utf-8')
        )
        print('Injected portfolio_optimization prompt')
    else:
        print('ERROR: marker not found for prompt')
else:
    print('portfolio_optimization prompt already present')

with open('src/server.ts', 'wb') as f:
    f.write(content)
print('Saved server.ts')
