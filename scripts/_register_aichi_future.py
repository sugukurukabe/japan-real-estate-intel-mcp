"""Register simulate_aichi_future tool in server.ts"""

tool_desc = (
    '\u611b\u77e5\u770c\u56fa\u6709\u30a4\u30f3\u30d5\u30e9\u306b\u57fa\u3065\u304f\u5c06\u6765\u4fa1\u5024\u30b7\u30df\u30e5\u30ec\u30fc\u30bf\u30fc\u3002'
    '\u30ea\u30cb\u30a2\u4e2d\u592e\u65b0\u5e39\u7dda\u30fb\u30bb\u30f3\u30c8\u30ec\u30a2\u7b2c2\u6ed1\u8d70\u8def\u30fb\u30c8\u30e8\u30bf\u96fb\u52d5\u5316\u6295\u8cc7'
    '\u30fb\u4e07\u535a\u30ec\u30ac\u30b7\u30fc\u306e\u5730\u4fa1\u5f71\u97ff\u3092\u6570\u5024\u304c\u8a71\u3059\u30de\u30fc\u30af\u30c0\u30a6\u30f3\u30ec\u30dd\u30fc\u30c8\u3067\u51fa\u529b\u3002'
)

import_line = "import { simulateAichiFuture, AichiFutureInput } from './tools/simulate_aichi_future.js';"
tool_block = '\r\n'.join([
    "  server.tool(",
    "    'simulate_aichi_future',",
    "    '" + tool_desc + "',",
    "    AichiFutureInput.shape,",
    "    (args) => withErrorHandling('simulate_aichi_future', 'aichi', async () => {",
    "      const input = AichiFutureInput.parse(args);",
    "      const result = simulateAichiFuture(input);",
    "      return {",
    "        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],",
    "        structuredContent: { ...result, attribution: result.attribution },",
    "      };",
    "    }),",
    "  );",
    "",
]) + '\r\n'

with open('src/server.ts', 'rb') as f:
    content = f.read()

# Add import after the last import block
import_marker = b"import { portfolioOptimizer } from './tools/portfolio_optimizer.js';"
if import_line.encode('utf-8') not in content:
    content = content.replace(
        import_marker,
        import_marker + b'\r\n' + import_line.encode('utf-8')
    )
    print('Added import')
else:
    print('Import already present')

# Add tool registration before return server
marker = b"  return server;\r\n}\r\n"
if b"'simulate_aichi_future'" not in content:
    content = content.replace(marker, tool_block.encode('utf-8') + marker)
    print('Added tool registration')
else:
    print('Tool already registered')

with open('src/server.ts', 'wb') as f:
    f.write(content)
print('Saved server.ts')
