import subprocess

msg = (
    "feat: v6.1.0 Production Hardening -- JP font, PWA, Docker, tests\n"
    "\n"
    "Raises v6.0.0 Aichi Gold Standard to production quality.\n"
    "\n"
    "Fixed:\n"
    "- PDF Japanese font: bundle IPAex Gothic (IPA License) in assets/fonts/ipaexg.ttf\n"
    "  All Japanese text now renders correctly in client PDFs\n"
    "  Graceful fallback to Helvetica if font file absent\n"
    "\n"
    "Added:\n"
    "- PWA: manifest.webmanifest + sw.js service worker (offline cache) + icons\n"
    "  Dashboard installs on iPad Safari / Android Chrome via 'Add to Home Screen'\n"
    "- Docker: multi-stage Dockerfile (non-root, healthcheck), docker-compose.yml\n"
    "  (MCP + Caddy auto-HTTPS), Caddyfile, .dockerignore, .env.production.example\n"
    "- docs/deployment.md: 10-min self-hosted VPS guide, ChatGPT/Cursor integration\n"
    "- scripts/download-fonts.js: npm run fonts:download\n"
    "- tests/simulate_aichi_future.test.ts: 20 tests (Linear, Centrair, Toyota, signals)\n"
    "- tests/branded_pdf.test.ts: 12 tests (branding, comparables, edge cases)\n"
    "- 4 new GenerateReportInput schema tests\n"
    "- package.json: assets/ and config/ in files; fonts:download script\n"
    "\n"
    "Tests: 421 -> 458 (all passing). Version: 6.0.0 -> 6.1.0\n"
)

subprocess.run(['git', 'add', '-A'], check=True)
subprocess.run(['git', 'commit', '-m', msg], check=True)
print('Committed v6.1.0')
