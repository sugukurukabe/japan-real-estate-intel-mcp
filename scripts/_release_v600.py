"""
Release v6.0.0 - Aichi Gold Standard
- Bump version in package.json, src/http.ts, src/server.ts
- Add aichi_future_value prompt in server.ts
- Update CHANGELOG
"""

import re

def bump_version(content: bytes, old: str, new: str) -> bytes:
    return content.replace(old.encode('utf-8'), new.encode('utf-8'))

OLD = '5.2.0'
NEW = '6.0.0'

# Bump package.json
with open('package.json', 'rb') as f:
    pkg = f.read()
pkg = bump_version(pkg, f'"version": "{OLD}"', f'"version": "{NEW}"')
with open('package.json', 'wb') as f:
    f.write(pkg)
print('Bumped package.json')

# Bump src/http.ts
with open('src/http.ts', 'rb') as f:
    http = f.read()
http = bump_version(http, OLD, NEW)
with open('src/http.ts', 'wb') as f:
    f.write(http)
print('Bumped src/http.ts')

# Bump src/server.ts version comment/string
with open('src/server.ts', 'rb') as f:
    srv = f.read()
srv = bump_version(srv, OLD, NEW)

# Add new prompt for aichi_future if not present
prompt_block = b'''  server.prompt(
    'aichi_future_value',
    {
      city: z.string().describe('\\u5e02\\u533a\\u753a\\u6751\\u540d'),
      horizon: z.enum(['3y', '5y', '10y']).default('10y').describe('\\u8a66\\u7b97\\u671f\\u9593'),
    },
    (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            '\\u611b\\u77e5\\u770c\\u5c06\\u6765\\u4fa1\\u5024\\u30b7\\u30df\\u30e5\\u30ec\\u30fc\\u30bf\\u30fc\\u3092\\u5b9f\\u884c\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002',
            JSON.stringify({ city: args.city, horizon: args.horizon, scenarios: ['all'], includeMarkdown: true }),
          ].join('\\n'),
        },
      }],
    }),
  );

'''

if b"'aichi_future_value'" not in srv:
    # Insert before return server
    srv = srv.replace(b'  return server;\r\n}\r\n', prompt_block + b'  return server;\r\n}\r\n')
    print('Added aichi_future_value prompt')
else:
    print('aichi_future_value prompt already present')

with open('src/server.ts', 'wb') as f:
    f.write(srv)
print('Saved server.ts')

# Update CHANGELOG
changelog_entry = (
    "\r\n## [6.0.0] - 2026-05-08\r\n"
    "\r\n### Added\r\n"
    "- **Aichi Gold Standard**: Branded PDF reports (`companyName`, `agentName`, `disclaimer`, `footerContact`) via `generate_area_report`\r\n"
    "- **`simulate_aichi_future` tool**: Linear Chuo Shinkansen, Centrair expansion, Toyota EV, Expo legacy future value engine\r\n"
    "- **Field/Presentation Mode** (`?mode=field`): Large-font tablet UI, QR code share button, deep-link URL\r\n"
    "- **Transaction comparables in PDF**: `includeTransactionComparables=true` renders past deals table\r\n"
    "- **`includeLinearImpact` flag**: Adds Linear impact analysis section to reports\r\n"
    "- `data/aichi/future_infrastructure.json`: 5 major Aichi infra projects with impact data\r\n"
    "- `data/aichi/neighborhoods.json`: 10 hyper-local neighborhood profiles (cho-me level)\r\n"
    "- `config/aichi-branding.example.json`: Sample branding config file\r\n"
    "- `docs/aichi-agent-guide.md`: Full agent guide for Aichi realtors\r\n"
    "- `docs/prefecture-completion-kit.md`: Nationwide rollout template\r\n"
    "- `scripts/prefecture-setup.py`: Auto-generates stub data files for new prefectures\r\n"
    "\r\n### Changed\r\n"
    "- `GenerateReportInput` schema extended with 6 branding/content fields\r\n"
    "- `pdf.ts` completely redesigned: branded header band, section styles, comparables table, disclaimer\r\n"
    "- Mode toggle bar now includes a 'Field Mode' button\r\n"
    "- Aichi transactions.csv expanded to ~170 rows covering Nagoya districts, Toyoda, Okazaki, Tokoname, etc.\r\n"
)

with open('CHANGELOG.md', 'rb') as f:
    cl = f.read()
cl = cl.replace(b'# Changelog', b'# Changelog' + changelog_entry.encode('utf-8'))
with open('CHANGELOG.md', 'wb') as f:
    f.write(cl)
print('Updated CHANGELOG.md')
