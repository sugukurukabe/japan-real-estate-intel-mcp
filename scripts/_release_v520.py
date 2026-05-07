"""Bump version to 5.2.0 and add CHANGELOG entry"""

# ── Version bump ───────────────────────────────────────────────────────────
files = [
    ('package.json', b'"version": "5.1.0"', b'"version": "5.2.0"'),
    ('src/server.ts', b"version: '5.1.0'", b"version: '5.2.0'"),
    ('src/http.ts', b"version: '5.1.0'", b"version: '5.2.0'"),
]
for path, old, new in files:
    with open(path, 'rb') as f:
        c = f.read()
    if old in c:
        with open(path, 'wb') as f:
            f.write(c.replace(old, new))
        print(f'Bumped {path}')
    elif new in c:
        print(f'Already 5.2.0: {path}')
    else:
        print(f'WARNING: version not found in {path}')

# ── CHANGELOG ──────────────────────────────────────────────────────────────
entry = """## [5.2.0] - 2026-05-08

### Added
- **First-time user onboarding** (dashboard): `showQuickStartExamples()` modal with 6 clickable example cards
  - Shown automatically on first visit (gated by `localStorage.rei-seen`)
  - Cards: 地価トレンド予測 / 企業立地需要分析 / ファミリー適性評価 / ポートフォリオ最適化 / What-If 分析 / 店舗出店評価
  - Clicking a card auto-selects the prefecture + area or opens the relevant helper
  - Empty-state insight panel now shows "クイック事例を見る →" link to reopen at any time
- **`quick_start_examples` MCP Prompt** (7th prompt): returns 6 copy-paste-ready tool call examples in Markdown — for Claude/Cursor chat-first users
- **README: "はじめての方へ" section**: Quick Start table, 6 example code blocks, prompt usage guide

### Tests
- 421 tests passing (no regressions)

---

"""

with open('CHANGELOG.md', 'rb') as f:
    content = f.read().decode('utf-8')

marker = '## [5.1.0]'
if '## [5.2.0]' not in content:
    content = content.replace(marker, entry + marker)
    print('Inserted CHANGELOG entry')
else:
    print('CHANGELOG already updated')

with open('CHANGELOG.md', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
