"""Add v5.1.0 entry to CHANGELOG.md"""

with open('CHANGELOG.md', 'rb') as f:
    content = f.read().decode('utf-8')

v510_entry = """## [5.1.0] - 2026-05-07

### Added
- `LoaderCapabilities.transactions: boolean` フィールドを追加 — 全 10 ローダーで `true` に設定
- `portfolio_optimization` MCP Prompt を追加（計 6 プロンプト体制）
- ダッシュボードに「📊 ポートフォリオ最適化」ボタン + インタラクティブ JSON 生成 UI を追加
- `national-expansion.test.ts` に埼玉・千葉のパラメータ化テストを追加
- `schemas.test.ts` に `PortfolioOptimizerInput` バリデーションテスト 7 件を追加
- README.md に v5.0.0 10 都道府県対応能力マトリクスを正式掲載

### Fixed
- `server.ts` の `portfolio_optimizer` ツール登録が欠落していた問題を修正（12 → 13 ツール）
- 埼玉・千葉の `earthquake.json` / `flood.geojson` / `municipalities.topojson` を生成し
  ローダーの `getEarthquakeData()` / `getFloodZones()` / `getMunicipalities()` が空を返す
  問題を解消

### Tests
- **421 テスト** (20 テストファイル) — 前バージョン比 +39 テスト

---

"""

marker = "## [5.0.0]"
if "## [5.1.0]" not in content:
    content = content.replace(marker, v510_entry + marker)
    print('Inserted v5.1.0 entry')
else:
    print('v5.1.0 already present')

with open('CHANGELOG.md', 'w', encoding='utf-8') as f:
    f.write(content)
print('Saved CHANGELOG.md')
