"""Update README with v5.0.0 What's New section and bump test count"""

with open('README.md', 'rb') as f:
    content = f.read().decode('utf-8')

v500_section = """## v5.0.0 What's New — 10 都道府県体制 + ポートフォリオ最適化

| 都道府県 | 取引 | 人口・災害 | 人流 | 教育 | 企業 | 犯罪 | 交通 | 商業 | 医療 | 3D PLATEAU |
|---|---|---|---|---|---|---|---|---|---|---|
| 愛知県 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 東京都 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 大阪府 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 神奈川県 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 福岡県 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 北海道 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 京都府 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 兵庫県 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 埼玉県 🆕 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| 千葉県 🆕 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |

### 新ツール（v5.0）

| ツール | 概要 |
|---|---|
| `portfolio_optimizer` | 最大 5 エリアを比較し、期待リターン・リスクスコア・流動性・分散スコア・シャープレシオを算出。最適配分比率を提案 |

```
portfolio_optimizer({
  targets: [
    { prefecture: "東京都", city: "新宿区", propertyType: "office", budgetManYen: 10000 },
    { prefecture: "埼玉県", city: "さいたま市大宮区", propertyType: "residential", budgetManYen: 5000 },
    { prefecture: "千葉県", city: "千葉市中央区", propertyType: "commercial", budgetManYen: 3000 }
  ],
  riskTolerance: "medium",
  investmentHorizon: "5y",
  optimizeFor: "risk_adjusted"
})
```

### v5.1.0 完成度向上パッチ

- `LoaderCapabilities` に `transactions: boolean` フィールドを追加（全 10 ローダー対応）
- `portfolio_optimization` MCP Prompt を追加（計 6 プロンプト）
- ダッシュボードに「ポートフォリオ最適化」ボタン + JSON 生成 UI を追加
- 埼玉・千葉の earthquake/flood/municipalities データを loader 互換形式に変換
- national-expansion.test.ts に埼玉・千葉のパラメータ化テストを追加（計 421 テスト）
- schemas.test.ts に `PortfolioOptimizerInput` バリデーションテスト 7 件を追加

---

"""

# Insert v5.0 section before v4.0 section
marker = "## v4.0.0 What's New"
if "## v5.0.0 What's New" not in content:
    content = content.replace(marker, v500_section + marker)
    print('Inserted v5.0.0 section')
else:
    print('v5.0.0 section already present, updating')
    start = content.find("## v5.0.0 What's New")
    end = content.find("## v4.0.0 What's New")
    if start < end:
        content = content[:start] + v500_section + content[end:]
        print('Updated v5.0.0 section')

# Update test count in README (update 382 → 421)
content = content.replace('382 テスト', '421 テスト')
content = content.replace('382 tests', '421 tests')
# Update version references
content = content.replace('13 ツール', '13 ツール')  # idempotent

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(content)
print('Saved README.md')
