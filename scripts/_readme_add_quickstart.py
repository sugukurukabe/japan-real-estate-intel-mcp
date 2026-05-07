"""Add First-time Users Quick Start section to README.md"""

quickstart_section = """## はじめての方へ — クイックスタート

### ダッシュボード（ブラウザ）で試す

`open_dashboard` ツールでダッシュボードを開くと、**初回起動時に「クイックスタート」ポップアップが自動表示**されます。
6 つのサンプルシナリオをワンクリックで試せます。

| カード | 内容 |
|---|---|
| 地価トレンド予測 | 新宿区の5年後地価をAI予測。CAGR・投資シグナル付き |
| 企業立地需要分析 | 名古屋市中区のオフィス・工場需要スコアを算出 |
| ファミリー向け適性評価 | 横浜市西区の教育・安全・医療スコアを総合評価 |
| ポートフォリオ最適化 | 東京・大阪・埼玉の3エリアに投資配分を最適化 |
| What-If シナリオ分析 | 大阪市中央区で新駅開設シナリオを試算 |
| 店舗出店適地評価 | 福岡市博多区の人流・商業施設・交通データで出店適性を判定 |

> 次回から表示しない場合は「次回から表示しない」をクリック。
> いつでも右パネルの「クイック事例を見る →」リンクで再表示できます。

---

### Claude / Cursor チャットで試す

MCP Prompt `quick_start_examples` を呼び出すと、コピー＆ペーストできるサンプルコードを一覧表示します。

```
# Cursor または Claude でプロンプトを呼び出す
quick_start_examples
```

または 6 つのサンプルをそのままチャットに貼り付けて実行:

```
# 1. 地価トレンド予測
forecast_land_price_trend({ "prefecture": "東京都", "city": "新宿区", "horizon": "5y" })

# 2. 企業立地需要分析
predict_corporate_demand({ "prefecture": "愛知県", "city": "名古屋市中区", "industryType": "manufacturing" })

# 3. ファミリー向け適性評価
assess_family_friendly_score({ "prefecture": "神奈川県", "city": "横浜市西区" })

# 4. ポートフォリオ最適化（3エリア比較）
portfolio_optimizer({
  "targets": [
    { "prefecture": "東京都", "city": "新宿区", "propertyType": "office", "budgetManYen": 10000 },
    { "prefecture": "大阪府", "city": "大阪市北区", "propertyType": "commercial", "budgetManYen": 6000 },
    { "prefecture": "埼玉県", "city": "さいたま市大宮区", "propertyType": "residential", "budgetManYen": 4000 }
  ],
  "riskTolerance": "medium",
  "investmentHorizon": "5y",
  "optimizeFor": "risk_adjusted"
})

# 5. What-If シナリオ分析
scenario_what_if({ "prefecture": "大阪府", "city": "大阪市中央区", "scenario": "new_station", "scale": "large" })

# 6. 店舗出店適地評価
evaluate_store_location({ "city": "福岡市博多区", "storeType": "cafe", "targetCustomer": "office_worker" })
```

---

"""

with open('README.md', 'rb') as f:
    content = f.read().decode('utf-8')

marker = '## v5.0.0 What\'s New'
if '## はじめての方へ' not in content:
    content = content.replace(marker, quickstart_section + marker)
    print('Inserted Quick Start section')
else:
    print('Quick Start section already present')

# Update prompt count references
content = content.replace('計 6 プロンプト', '計 7 プロンプト')

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(content)
print('Saved README.md')
