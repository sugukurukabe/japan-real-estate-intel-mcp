"""Bump version to 6.1.0 and update CHANGELOG"""

OLD = b'6.0.0'
NEW = b'6.1.0'

for path in ['package.json', 'src/http.ts', 'src/server.ts']:
    with open(path, 'rb') as f:
        content = f.read()
    updated = content.replace(OLD, NEW)
    if updated != content:
        with open(path, 'wb') as f:
            f.write(updated)
        print(f'Bumped {path}')
    else:
        print(f'No change in {path}')

# Update CHANGELOG
changelog_entry = (
    "\r\n## [6.1.0] - 2026-05-08\r\n"
    "\r\n### Fixed\r\n"
    "- **PDF Japanese font rendering**: Bundle IPAex Gothic (IPA License) in `assets/fonts/ipaexg.ttf`;\r\n"
    "  register via `doc.registerFont()` in `src/export/pdf.ts` so all Japanese text renders correctly\r\n"
    "- Graceful fallback to Helvetica if font file is absent (non-fatal)\r\n"
    "\r\n### Added\r\n"
    "- **PWA support**: `ui/manifest.webmanifest`, `ui/sw.js` service worker (cache-first for static + Aichi data),\r\n"
    "  icons (192/512/180px). Dashboard now installs on iPad Safari and Android Chrome\r\n"
    "- **Docker deployment**: `Dockerfile` (multi-stage, non-root, healthcheck), `docker-compose.yml`\r\n"
    "  (MCP + Caddy auto-HTTPS), `Caddyfile`, `.dockerignore`, `.env.production.example`\r\n"
    "- **`docs/deployment.md`**: 10-minute self-hosted VPS deploy guide with ChatGPT/Cursor integration,\r\n"
    "  PWA install steps, update procedure, troubleshooting table\r\n"
    "- **`scripts/download-fonts.js`**: standalone font download script (`npm run fonts:download`)\r\n"
    "- **`tests/simulate_aichi_future.test.ts`**: 20 tests for all simulate_aichi_future scenarios\r\n"
    "- **`tests/branded_pdf.test.ts`**: 12 tests for markdownToPdfBase64 (branding, comparables, edge cases)\r\n"
    "- 4 new `GenerateReportInput` schema tests (companyName, agentName, includeLinearImpact, disclaimer)\r\n"
    "\r\n### Changed\r\n"
    "- `package.json`: added `assets/` and `config/` to `files` field; added `fonts:download` script\r\n"
    "- Test count: 421 -> 458 (all passing)\r\n"
)

with open('CHANGELOG.md', 'rb') as f:
    cl = f.read()
cl = cl.replace(b'# Changelog', b'# Changelog' + changelog_entry.encode('utf-8'))
with open('CHANGELOG.md', 'wb') as f:
    f.write(cl)
print('Updated CHANGELOG.md')
