"""Audit project for completeness gaps"""

issues = []

# 1. Check LoaderCapabilities has transactions field
with open('src/data-loaders/types.ts', 'rb') as f:
    types_content = f.read()
if b'transactions: boolean' in types_content:
    issues.append(('OK', 'LoaderCapabilities has transactions field'))
else:
    issues.append(('MISSING', 'LoaderCapabilities missing transactions boolean'))

# 2. Check server.ts
with open('src/server.ts', 'rb') as f:
    srv = f.read()
tool_count = srv.count(b'server.tool(')
issues.append(('INFO', f'server.tool() calls: {tool_count}'))

# 3. Check portfolio MCP prompt
prompt_count = srv.count(b'server.prompt(')
has_portfolio_prompt = b'portfolio_optim' in srv[srv.find(b'server.prompt('):]
issues.append(('INFO', f'server.prompt() count: {prompt_count}'))
if has_portfolio_prompt:
    issues.append(('OK', 'portfolio prompt exists'))
else:
    issues.append(('MISSING', 'portfolio_optimization MCP Prompt missing'))

# 4. Check schemas.test.ts
with open('tests/schemas.test.ts', 'rb') as f:
    schemas_test = f.read()
if b'PortfolioOptimizer' in schemas_test:
    issues.append(('OK', 'schemas.test.ts has PortfolioOptimizer'))
else:
    issues.append(('MISSING', 'schemas.test.ts missing PortfolioOptimizer tests'))

# 5. Check national-expansion parameterized test
with open('tests/national-expansion.test.ts', 'rb') as f:
    natexp = f.read()
saitama_in_array = b'saitama' in natexp[:natexp.find(b'NEW_PREFECTURES')]
if saitama_in_array or (b"key: 'saitama'" in natexp):
    issues.append(('OK', 'national-expansion has saitama in parameterized array'))
else:
    issues.append(('MISSING', 'national-expansion.test.ts missing saitama/chiba in NEW_PREFECTURES array'))

# 6. Check dashboard UI
with open('ui-src/main.ts', 'rb') as f:
    ui = f.read()
if b'portfolio' in ui.lower():
    issues.append(('OK', 'dashboard has portfolio reference'))
else:
    issues.append(('MISSING', 'dashboard missing portfolio_optimizer UI'))

# 7. Check README v5.0 section
with open('README.md', 'rb') as f:
    readme = f.read()
if b'v5.0.0 What' in readme:
    issues.append(('OK', 'README has v5.0.0 What section'))
else:
    issues.append(('MISSING', 'README missing v5.0.0 What New section'))

# 8. Check TransactionRecord quarter type
if b'quarter: number' in types_content:
    issues.append(('INFO', 'TransactionRecord.quarter typed as number but CSV uses Q1 string'))
elif b'quarter: string' in types_content:
    issues.append(('OK', 'TransactionRecord.quarter typed as string'))

# 9. Check if saitama/chiba loaders register in data-loaders/index.ts
with open('src/data-loaders/index.ts', 'rb') as f:
    idx = f.read()
if b'SaitamaLoader' in idx and b'ChibaLoader' in idx:
    issues.append(('OK', 'SaitamaLoader + ChibaLoader registered in index.ts'))
else:
    issues.append(('MISSING', 'Loaders not registered'))

# 10. fetch-real-data should derive supported prefectures from listAvailable(), not a hardcoded list
with open('scripts/fetch-real-data.ts', 'rb') as f:
    frd = f.read()
if b'listAvailable()' in frd and b'SUPPORTED_PREFECTURES = listAvailable()' in frd:
    issues.append(('OK', 'fetch-real-data uses listAvailable for SUPPORTED_PREFECTURES'))
else:
    issues.append(('MISSING', 'fetch-real-data should set SUPPORTED_PREFECTURES from listAvailable()'))

for status, msg in issues:
    print(f'[{status}] {msg}')
