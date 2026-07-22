# 競合ポジショニング — Japan Real Estate Intel MCP

## 1行で

**10都道府県の地価・災害・人流・教育をクロス分析。名古屋町丁目・リノベ利回り・ブランドPDF・契約支援まで MCP 一連。**

---

## この MCP が向いている人

| ペルソナ | 典型ユースケース |
|----------|------------------|
| 不動産仲介・投資営業 | 初回面談前のエリア整理、客前説明、都道府県比較 |
| 経営者・仕入担当 | 愛知 vs 他県、Opportunity Radar、レバレッジCF試算 |
| 開発者・AI 担当 | Claude / ChatGPT / Cursor から不動産データをツール化 |
| 名古屋・愛知の現場 | 町丁目プロファイル、将来タイムライン、リノベランキング |

---

## よくある「別 MCP」との違い

| 観点 | MLIT API 系（例: reinfolib-mcp, real-estate-mcp） | Japan Real Estate Intel |
|------|--------------------------------------------------|-------------------------|
| 主目的 | 国交省 **不動産情報ライブラリ API** のラッパー | **業者ワークフロー**（分析→レポート→契約→ダッシュボード） |
| データ | ライブ API 中心（要 API キー） | **10都道府県の同梱CSV** + 任意で MLIT / e-Stat |
| クロス分析 | 単一データ種別が多い | 地価×リスク×人流×教育×企業を **1ツールで統合** |
| 名古屋 | 汎用 | **町丁目・計画JSON・リノベ・契約** まで特化 |
| UI | なし or 最小 | **PWA ダッシュボード** + MCP Apps |
| 出力 | JSON / テキスト | Markdown / **PDF(Base64)** / Excel(比較) |

補足: 国交省 API 系と **併用** する価値はあります（本 MCP の `includeLive` 等）。

---

## Free / Pro の目安（[`src/tiers.ts`](../src/tiers.ts) 準拠）

### Free で使える主なツール

`cross_analyze_real_estate_market`, `assess_property_risk`, `compare_prefectures`, `discover_opportunities`, `forecast_land_price_trend`, `scenario_what_if`, `get_chochou_profile`, `get_future_timeline`, `detect_arbitrage_signals`, `simulate_leveraged_cashflow`, `get_zoning_info`, `get_vacancy_stats`, `get_population_outlook`, `get_real_estate_macro_snapshot`, `quick_visual_summary`, `composite_value_score`

### Pro で追加される主なツール

`generate_area_report`（**PDF**）, `open_dashboard`, `simulate_aichi_future`, `assess_family_friendly_score`, `drill_down_local_analysis`, `evaluate_store_location`, `analyze_renovation_yield`, `recommend_renovation_targets`, `generate_contract_support_package`, `assess_contract_risk`, `portfolio_optimizer`, `simulate_landscape_impact`, ほか

サーバー既定は `DEFAULT_TIER=free`。デモ・本番のプラン設定に注意。

---

## 信頼・法務

| 項目 | URL / 備考 |
|------|------------|
| ライセンス | AGPL-3.0-only |
| 本番 | https://realestate-mcp.jp |
| プライバシー | https://realestate-mcp.jp/privacy-policy.html |
| 利用規約 | https://realestate-mcp.jp/terms.html |
| 変更履歴 | [CHANGELOG.md](../CHANGELOG.md) |

---

## 掲載・発見経路

進捗チェックリスト: [listing-checklist.md](./listing-checklist.md)  
Registry 手順: [registry-submission.md](./registry-submission.md)  
成長プレイブック: [growth-playbook.md](./growth-playbook.md)  
事例: [customer-stories.md](./customer-stories.md)
