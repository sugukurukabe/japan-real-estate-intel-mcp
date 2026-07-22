<p align="center">
  <a href="https://realestate-mcp.jp/dashboard.html?prefecture=aichi">
    <img src="docs/screenshots/dashboard-overview.png" width="900" alt="Japan Real Estate Intel dashboard — land price map and investment score for Aichi">
  </a>
</p>

<p align="center">
  <img src="assets/logo.svg" width="120" alt="RE Intel JP Logo">
</p>

# Japan Real Estate Intel MCP

[![npm version](https://img.shields.io/npm/v/@sugukuru/japan-real-estate-intel-mcp)](https://www.npmjs.com/package/@sugukuru/japan-real-estate-intel-mcp) [![npm downloads](https://img.shields.io/npm/dm/@sugukuru/japan-real-estate-intel-mcp)](https://www.npmjs.com/package/@sugukuru/japan-real-estate-intel-mcp) [![CI](https://github.com/sugukurukabe/japan-real-estate-intel-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sugukurukabe/japan-real-estate-intel-mcp/actions/workflows/ci.yml) [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg)](LICENSE) [![Node.js >= 20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org) [![Docker](https://img.shields.io/badge/GHCR-available-blue)](https://github.com/sugukurukabe/japan-real-estate-intel-mcp/pkgs/container/japan-real-estate-intel-mcp) [![MCP Registry](https://img.shields.io/badge/MCP_Registry-listed-blueviolet)](https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel) [![awesome-mcp PR](https://img.shields.io/badge/awesome--mcp-PR_%236630-green)](https://github.com/punkpeye/awesome-mcp-servers/pull/6630)

**Cross-analyze Japanese real estate data across 10 prefectures via MCP.** Land prices, disaster risk, population, foot traffic, education, corporate presence, PLATEAU 3D buildings, renovation yield, and contract support — all accessible through Claude, ChatGPT, Cursor, or any MCP client.

**Registry:** `io.github.sugukurukabe/japan-real-estate-intel-mcp` · **Growth / listings:** [docs/growth-playbook.md](docs/growth-playbook.md)

## Try in 60 seconds (Free tier — safe for demos)

Copy into Claude, Cursor, or ChatGPT after `npx @sugukuru/japan-real-estate-intel-mcp`:

```
discover_opportunities で愛知県の investment 向けエリアを探して。limit=5
```

More copy-paste prompts (3 demos, no Pro tools): **[docs/free-demo-prompts.md](docs/free-demo-prompts.md)**  
Map only: [Dashboard (Aichi)](https://realestate-mcp.jp/dashboard.html?prefecture=aichi)

> **Do not demo** PDF reports, Linear numeric sim, or contract tools on the default Free plan — they require Pro. See [tiers](src/tiers.ts) and [pro-demo-setup.md](docs/pro-demo-setup.md).

## Data freshness & trust

| Item | Detail |
|------|--------|
| **Coverage** | 10 prefectures (bundled CSV); not all 47 prefectures |
| **Update** | Run `npm run data:fetch` (requires `MLIT_API_KEY` / `ESTAT_APP_ID` for live sources) — recommend **quarterly** refresh for production |
| **Free tier** | ~50 tool calls / month (UTC), applies to both the public `https://realestate-mcp.jp` connector (per MCP session) and self-hosted stdio (per client) — see `TIER_MONTHLY_TOOL_CALLS`. Pro/Enterprise unlock via license key, no relation to `API_KEY` |
| **Live MLIT** | Optional `MLIT_API_KEY` for fresher transactions in tools like `detect_arbitrage_signals` |

## Quick Install

**Claude Desktop (stdio):**
```bash
npx @sugukuru/japan-real-estate-intel-mcp
```

**Claude Desktop (remote — no login/API key required):**
```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "url": "https://realestate-mcp.jp/mcp"
    }
  }
}
```
> `https://realestate-mcp.jp` is an authless public connector — no headers needed. `X-Api-Key` only applies if *you* self-host with `API_KEY` set (see [docs/deploy.md](docs/deploy.md)); `X-License-Key` / `_licenseKey` unlocks Pro/Enterprise tiers on any instance (see [pro-demo-setup.md](docs/pro-demo-setup.md)) — the two are unrelated.

**Cursor (`.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "command": "npx",
      "args": ["@sugukuru/japan-real-estate-intel-mcp"]
    }
  }
}
```

## Key Features

- **38 tools** covering market analysis, risk assessment, forecasts, renovation yield, contract support, zoning, vacancy, population outlook, macro snapshots, price triangulation arbitrage, portfolio optimization, demographic forecasting, and building code compliance audit
- **10 prefectures**: Aichi, Tokyo, Osaka, Fukuoka, Hokkaido, Kanagawa, Kyoto, Hyogo, Saitama, Chiba
- **17+ data sources**: land prices, 路線価 (rosenka), disaster hazards (earthquake + flood), population, zoning, vacancy, population projection, foot traffic, education, corporate, transport, commercial, medical, PLATEAU 3D
- **Interactive dashboard** with 2D map, 3D PLATEAU view, responsive PWA, and price triangulation panel
- **Bilingual** English + Japanese tool descriptions and UI
- **MCP Apps UI** for Claude Desktop and Cursor
- **Tiered access** (free / pro / enterprise)

**Links:** [Dashboard](https://realestate-mcp.jp/dashboard.html) | [Privacy Policy](https://realestate-mcp.jp/privacy-policy.html) | [Terms](https://realestate-mcp.jp/terms.html) | [API Docs](docs/test-prompts.md) | [Demo script](docs/demo-video-script.md)

## Author & community

| | |
|---|---|
| **Maintainer** | [@sugukurukabe](https://github.com/sugukurukabe) · npm [`@sugukuru`](https://www.npmjs.com/~sugukuru) |
| **Story** | [Implementation story (JA)](docs/implementation-story.md) · [Registry publish blog (EN)](docs/blog/registry-publish-story-en.md) |
| **Industry (Nagoya)** | [Pitch scenarios](docs/nagoya-dealer-pitch-scenarios.md) · [Follow-up sheet](docs/nagoya-pitch-followup.md) |
| **Customer stories** | [customer-stories.md](docs/customer-stories.md) _(seeking first published case)_ |
| **Contribute** | [CONTRIBUTING.md](CONTRIBUTING.md) · [Good first issues](docs/contributing-first-issues.md) |

---

## 日本語セクション (Japanese)

日本の不動産投資・仲介・開発・管理向けに、**地価・取引価格・路線価・人口統計・災害リスク・人流・教育環境・企業立地・交通・商業施設・医療福祉・3D 日照シミュレーション・町丁目実データ** をクロス分析する MCP サーバー。

**v8.0.0** — Claude公式ディレクトリ審査対応。**OAuth撤去、認証不要（authless）の公開コネクタに単純化**（Pro/Enterprise はECDSA署名ライセンスキーのみで解放）。`getRequestTier`の署名なしバイパス除去・`/api/license`のStripeセッションID化・`/metrics`鍵保護など各種セキュリティ修正。全38ツールにtitle・`idempotentHint`を付与。生成レポート/CSV/Excelを`resource_link`（HTTP: `/artifacts/:id`、stdio: `artifact://`）でダウンロード可能に。ダッシュボードのウィジェットカードにCSV/PNGエクスポートツールバーを追加。

**v7.0.0** — MCP Apps 公式SDK(`@modelcontextprotocol/ext-apps`)へ移行。2D地図・3D PLATEAUビューア・ツール別ウィジェットを React + Vite の単一ダッシュボードに統合。

**v6.15.4** — セキュリティ強化（秘密鍵除去・デモキー本番ガード・`/metrics` 認証保護）、Tier 設定補完、MCP 仕様準拠監査合格（4プリミティブ + MCP Apps + OAuth 2.1）、Glama 掲載。

**v6.15.2** — Free プラン月間ツール上限（50回/月 UTC）、Glama 用 `Dockerfile.glama`、外部掲載手順更新。

**v6.15.1** — 公式 MCP Registry 掲載（`io.github.sugukurukabe/japan-real-estate-intel-mcp`）。npm `mcpName` 整合。

**v6.15.0** — 路線価（NTA）×公示地価×取引価格の三角測量で「割安物件・相続有利エリア・市場過熱」をスキャンする `detect_arbitrage_signals` を追加。総合価値スコアにアービトラージ補正を加味。あわせて県単位マクロを一枚にまとめる `get_real_estate_macro_snapshot`（地価YoY・取引件数・人口減、任意で e-Stat 建築着工・金利プロキシ）を追加。

**v6.13.0** — 用途地域・空き家率・将来人口推計データを追加、総合価値スコア 5 軸融合、Opportunity Radar 強化、全 10 都道府県の災害リスクCSV完備。Anthropic MCP Registry / OpenAI Apps Directory 対応。


## 不動産業者の方へ

**3 分で始められるガイドはこちら: [不動産業者向けクイックスタート](docs/agent-quickstart.md)**

ダッシュボード: `https://realestate-mcp.jp/dashboard.html`

---

## はじめての方へ — クイックスタート

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

MCP Prompt `quick_start_examples` を呼び出すと、コピー＆ペーストできるサンプルコード（Free / Pro・Enterprise 別）を一覧表示します。

```
# Cursor または Claude でプロンプトを呼び出す
quick_start_examples
```

または、ライセンスキー不要で今すぐ動く Free tier の例をそのままチャットに貼り付けて実行:

```
# 1. Opportunity Radar（次に見るべきエリア発見）
discover_opportunities({ "prefecture": "愛知県", "goal": "investment", "horizon": "3y", "limit": 5 })

# 2. 地価トレンド予測
forecast_land_price_trend({ "prefecture": "東京都", "city": "新宿区", "horizon": "5y" })

# 3. 価格の歪み検出（路線価×公示地価×取引価格）
detect_arbitrage_signals({ "prefecture": "愛知県", "signalType": "discount" })
```

> **Pro/Enterprise限定**（`predict_corporate_demand` / `assess_family_friendly_score` / `portfolio_optimizer` / `scenario_what_if` / `evaluate_store_location` 等）を試す場合は、`_licenseKey` 引数または `X-License-Key` ヘッダーにライセンスキーを渡してください。デモキーの入手方法は [docs/pro-demo-setup.md](docs/pro-demo-setup.md) を参照。

---

> **履歴メモ**: v1.0（2025年11月、愛知県6ツール）から段階的に全国展開・機能拡張してきました。詳細な変遷は [docs/implementation-story.md](docs/implementation-story.md)（v6.15.0時点のスナップショット）と [CHANGELOG.md](CHANGELOG.md) を参照してください。**現行（v8.0.0）の正**は文書冒頭（Key Features）、`server.json` の `tools`、`pnpm test` の結果です。10都道府県すべてが地価・災害リスク・人口・町丁目データを含む主要機能に対応しています。データソース別の詳細な対応可否は `src/data-loaders/` 各ローダーの `capabilities` フィールドを参照してください。

## 特徴



- **38 ツール**: 市場クロス分析 / リスク / ファミリー / 法人需要 / レポート / ダッシュボード / 都道府県比較 / ドリルダウン / 出店 / 日照シミュ / 予測・What-If / PF 最適化 / リノベ・契約・用途地域・空き家率・人口推計・マクロ・アービトラージ / 人口動態予測 / 建築基準適合監査 等（詳細は冒頭 Key Features）

- **12 レイヤーダッシュボード + 3D ビューア**: 地価 / 災害リスク / 取引 / 人口 / 人流 / 学区 / 企業密度 / 3D 建物 / 交通 / 商業施設 / 医療 / 影 + **Three.js 3D ビューア**

- **10 都道府県対応**: 愛知県（フル機能・名古屋市町丁目データ）/ 東京都・大阪府・福岡県・北海道・神奈川県・京都府・兵庫県・埼玉県・千葉県（標準対応）

- **町丁目実データ**: 名古屋市を中心に、町丁目レベルの人口・世帯・計画データ等（対象エリアはデータソースに依存）

- **都道府県セレクタ**: ダッシュボード上で **10 都道府県**を切り替え、比較モードで任意の 2 エリアを並列表示

- **比較モード（v2.1 フル機能）**: 地図 2 分割 + SVG レーダーチャート + ランキングテーブル + bestFor 表示

- **ドリルダウンパネル（v2.1 new）**: 市区町村クリックで詳細パネル展開。町丁目ラベル入力対応

- **stdio + Streamable HTTP**: 両トランスポート対応

- **TypeScript strict + Zod**: 型安全な入出力スキーマ

- **プラガブル**: `BaseLoader` を継承して新県を追加



## クイックスタート



```bash

git clone https://github.com/sugukurukabe/japan-real-estate-intel-mcp.git

cd japan-real-estate-intel-mcp

pnpm install

pnpm build

```



### stdio（ローカル）



```bash

node dist/index.js

```



### Streamable HTTP（リモート）



```bash

node dist/http.js

# → http://0.0.0.0:3100/mcp

```



## クライアント設定



### Claude Desktop



```json

{

  "mcpServers": {

    "japan-real-estate-intel": {

      "command": "node",

      "args": ["dist/index.js"],

      "cwd": "/path/to/japan-real-estate-intel-mcp"

    }

  }

}

```



### Cursor (`.cursor/mcp.json`)



```json

{

  "mcpServers": {

    "japan-real-estate-intel": {

      "command": "node",

      "args": ["dist/index.js"],

      "cwd": "/path/to/japan-real-estate-intel-mcp"

    }

  }

}

```



## ツール一覧（参考: v2.3 時点の 10 本）

> **現行**は **38 ツール**です。完全な一覧はリポジトリ直下の `server.json` の `tools` 配列、または `pnpm test` が通る `tests/server_json_tools_sync.test.ts` を参照してください。

### `cross_analyze_real_estate_market`



都道府県内エリアの不動産市場をクロス分析。`includeHumanFlow` / `includeEducation` / `includeCorporate` / `includeTransport` / `includeCommercial` / `includeMedical` フラグで付加情報をオプトイン。



| パラメータ | 型 | デフォルト | 説明 |

|---|---|---|---|

| `prefecture` | string | `"愛知県"` | 都道府県名 |

| `area` | string | - | エリア名 |

| `propertyType` | enum | - | residential / commercial / logistics / office / mixed |

| `timeRange` | enum | - | 1y / 3y / 5y |

| `includeRisk` | boolean | `true` | 災害リスクを含むか |

| `includeHumanFlow` | boolean | `true` | 人流データを含むか |

| `includeEducation` | boolean | `false` | 教育データを含むか |

| `includeCorporate` | boolean | `false` | 企業データを含むか |

| `includeTransport` | boolean | `false` | 交通利便性データを含むか *(v2.2)* |

| `includeCommercial` | boolean | `false` | 商業施設データを含むか *(v2.2)* |

| `includeMedical` | boolean | `false` | 医療施設データを含むか *(v2.2)* |



ローダーがデータセットを提供しない場合、該当フィールドは `undefined` になり、`keyInsights` 等に **「当該都道府県では未提供」** の旨が表示されます。



### `assess_property_risk`



特定住所の浸水・土砂・地震リスクを評価し、リスクスコアと価格調整率を算出。



### `assess_family_friendly_score`



学区・教育環境・犯罪統計を加味したファミリー物件評価。子育て世帯向け資産価値を算出。



### `predict_corporate_demand`



企業立地・事業所統計・通勤データで法人需要を予測。



### `generate_area_report`



投資/開発/賃貸/管理レポートを Markdown 形式で生成。



### `open_dashboard`



12 レイヤーの不動産ダッシュボードを起動。比較モード（地図 2 分割 + SVG レーダー）、ドリルダウンパネル、影シミュレーション（時刻プリセット）を搭載。



### `compare_prefectures` *(v2.1 新設)*



2〜5 都道府県を複数メトリクスで比較分析。レーダーチャート・ランキング・差分ハイライト・bestFor を返す。



| パラメータ | 型 | デフォルト | 説明 |

|---|---|---|---|

| `prefectures` | string[] (2-5) | - | 比較対象都道府県名リスト |

| `area` | string | optional | 代表エリア（省略時: 愛知→名古屋市中区、東京→千代田区） |

| `neighborhood` | string | optional | 町丁目ラベル（v2.1 はレポートへの反映のみ） |

| `propertyType` | enum | `"mixed"` | residential / commercial / logistics / office / mixed |

| `metrics` | enum[] | `["price","risk","investment"]` | 比較指標（price/risk/humanFlow/education/corporate/investment/transport/commercial/medical） |

| `includeMarkdown` | boolean | `true` | Markdown レポートを含むか |



**出力**: `scores[]`（各都道府県スコア）, `ranking[]`, `radarData[]`（SVG 用正規化値）, `diffs[]`（差分ハイライト）, `bestFor`（投資/安全/成長別おすすめ）, `markdownReport`



### `drill_down_local_analysis` *(v2.1 新設)*



市区町村・町丁目レベルのドリルダウン分析。ローカル不動産屋向けセールスピッチと Markdown レポートを生成。



| パラメータ | 型 | デフォルト | 説明 |

|---|---|---|---|

| `prefecture` | string | `"愛知県"` | 都道府県名 |

| `city` | string | - | 市区町村名（例: `"名古屋市中村区"`） |

| `neighborhood` | string | optional | 町丁目（例: `"名駅南1丁目"`）。v2.1 はラベルのみ |

| `focus` | enum | `"all"` | price / risk / demand / all |



**出力**: `pricePerSqm`, `population`, `riskScore`, `floodLevel`, `humanFlowScore`, `transportScore`, `commercialDensity`, `medicalDensity`, `competitorDensity`, `localPitch`（セールスピッチ文）, `keyInsights[]`, `markdownReport`, `households?`, `avgAge?`, `childRatio?`, `elderlyRatio?`, `daytimePopRatio?`, `popDensity?`, `neighborhoodDataAvailable?`



> **v2.4 新機能**: `neighborhood` 指定時に町丁目実データ（人口・世帯・年齢構成・昼夜間人口比）を返却します。データが無い場合は市区町村レベルの推定値を使用します。



### `evaluate_store_location` *(v2.2 新設)*



コンビニ・ファミレス・カフェ・ドラッグストア・スーパーの出店適地評価。店舗タイプ別に重み付けを自動調整し、人口・人流・リスク・競合・交通・教育・商業施設・医療の 8 軸でスコアリング。



| パラメータ | 型 | デフォルト | 説明 |

|---|---|---|---|

| `prefecture` | string | `"愛知県"` | 都道府県名 |

| `city` | string | - | 市区町村名 |

| `neighborhood` | string | optional | 町丁目ラベル |

| `storeType` | enum | - | convenience / family_restaurant / cafe / drugstore / supermarket |

| `radiusM` | number | `500` | 競合・施設検索半径（m） |

| `customWeights` | Record | optional | カスタム重み付け（省略時はタイプ別デフォルト） |

| `includeMarkdown` | boolean | `true` | Markdown レポートを含むか |



**出力**: `overallScore (0-100)`, `breakdown`（8 軸スコア）, `keyCompetitors[]`（距離・チェーン名・強度・弱点）, `differentiationSuggestions[]`（AI 差別化提案）, `keyInsights[]`, `markdownReport`



### `simulate_landscape_impact` *(v2.3 新設)*



SunCalc 太陽位置計算 + PLATEAU 3D 建物データから指定地点の日照・影をシミュレーション。影ポリゴン（[lat,lng][] 配列）を返すため、ダッシュボードや GIS に直接描画可能。



| パラメータ | 型 | デフォルト | 説明 |

|---|---|---|---|

| `prefecture` | string | `"愛知県"` | 都道府県名 |

| `lat` | number | - | 対象地点の緯度 |

| `lng` | number | - | 対象地点の経度 |

| `dateTime` | string | 現在時刻 | シミュレーション日時（ISO 8601） |

| `timePreset` | enum | optional | morning(8:00) / noon(12:00) / evening(17:00) |

| `radiusM` | number | `500` | 建物検索半径（m） |

| `includeMarkdown` | boolean | `true` | Markdown レポートを含むか |



**出力**: `sunPosition`（方位角・高度）, `nearbyBuildingCount`, `maxHeight`, `avgHeight`, `totalShadowAreaSqm`, `sunlightHoursEstimate`, `shadowPolygons[]`（建物名・高さ・影長・ポリゴン座標）, `highImpactBuildings[]`, `keyInsights[]`, `markdownReport`



## Resources（現行 URI パターン）



| URI | 説明 |

|---|---|

| `realestate://land-price/{prefecture}/{area}` | 地価公示データ |

| `hazard://flood/{prefecture}/{area}` | 浸水想定区域 GeoJSON |

| `stats://population-trend/{prefecture}/{area}` | 人口統計 |

| `ui://japan-real-estate-intel/dashboard` | ダッシュボード HTML（MCP Apps） |

| `artifact://{id}` | `generate_area_report` 等が生成したPDF/Excel/CSV/Markdownのダウンロード（stdio）。HTTPトランスポートでは代わりに `resource_link` として `GET /artifacts/:id/:filename` を返す |



例: `realestate://land-price/aichi/名古屋市中区`, `realestate://land-price/tokyo/世田谷区`



## 都道府県の追加手順



新しい県を追加する場合:



1. `data/<key>/` に最低限のファイルを配置:

   - `land_price.csv`, `population.csv`, `flood.geojson`, `earthquake.json`, `municipalities.topojson`

2. `src/data-loaders/<key>-loader.ts` を作成（`BaseLoader` を継承、`capabilities` を宣言）

3. `src/data-loaders/index.ts` で `registerLoader(new XxxLoader())` を 1 行追加

4. `src/prefecture/resolver.ts` の `PREFECTURE_KEYS` にエイリアスを追加



それだけで `prefecture: "大阪府"` が全ツールで動作します。



## データ出典



| データ | 出典 | 取得日 |

|---|---|---|

| 地価公示 | 国土交通省 | 2025-12-01 |

| 不動産取引価格 | 国土交通省 | 2025-12-01 |

| 浸水・土砂災害 | 国土交通省ハザードマップ | 2025-12-01 |

| 地震想定 | 内閣府 | 2025-12-01 |

| 人口統計 | 総務省 e-Stat | 2025-12-01 |

| 人流統計 | 国土交通省「全国うごき統計」| 2025-12-01 |

| 教育データ | 愛知県教育委員会 + e-Stat | 2025-12-01 |

| 事業所統計 | 総務省 e-Stat | 2025-12-01 |

| 犯罪統計 | 愛知県警察オープンデータ | 2025-12-01 |

| 3D都市モデル | 国土交通省 PLATEAU | 2025-12-01 |

| 交通利便性 | 国土交通省交通データ + JR/私鉄/市営地下鉄 | 2026-05-01 |

| 商業施設 | 商業統計 + チェーン店立地データ | 2026-05-01 |

| 医療福祉施設 | 厚労省オープンデータ | 2026-05-01 |



**データについて**: 各データは上記の取得日時点の本番データです。投資判断・契約判断には専門家へのご相談を併せてお願いします。



## 開発



```bash

pnpm install

pnpm dev          # TypeScript watch

pnpm build:ui     # ダッシュボード再ビルド

pnpm test         # Vitest (800+ tests, 59 files)

pnpm lint         # 型チェック

```



## ロードマップ

### v8.0.0（現バージョン）

- OAuth撤去 → authless公開コネクタ化（Pro/Enterprise は `X-License-Key` / `_licenseKey` のECDSA署名済みライセンスキーで解放）
- `generate_area_report` 等5ツールがPDF/Excel/CSV/Markdownを `resource_link` アーティファクトとしてダウンロード可能に
- ダッシュボードの各ウィジェットにCSV/PNGエクスポート機能を追加
- 全38ツールに `title` / `outputSchema` / 正確な `idempotentHint` 等のアノテーションを完備
- 10 都道府県 / 38 ツール（`server.json` と実行時で一致） / 800+ テスト（59 ファイル）

詳細は [CHANGELOG.md](CHANGELOG.md#800---2026-07-22) と [docs/releases/v8.0.0.md](docs/releases/v8.0.0.md) を参照。

## ライセンス

AGPL-3.0-only（[LICENSE](LICENSE) 参照）

