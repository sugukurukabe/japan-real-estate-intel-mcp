# @sugukuru/japan-real-estate-intel-mcp

[![npm version](https://img.shields.io/npm/v/@sugukuru/japan-real-estate-intel-mcp)](https://www.npmjs.com/package/@sugukuru/japan-real-estate-intel-mcp)
[![CI](https://github.com/sugukuru/japan-real-estate-intel-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sugukuru/japan-real-estate-intel-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js ≥ 20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org)

日本の不動産投資・仲介・開発・管理向けに、**地価・取引価格・人口統計・災害リスク・人流・教育環境・企業立地・交通・商業施設・医療福祉・3D 日照シミュレーション・町丁目実データ** をクロス分析する MCP サーバー。

**v2.5** で本番品質の土台を完成。エラーハンドリング・構造化ロギング(pino)・HTTP サーバー堅牢化(helmet/API key/タイムアウト)・ESLint/Prettier・CI/CD 強化を実施。

## v2.5.0 What's New

| 追加/変更 | 詳細 |
|---|---|
| **カスタムエラー層** | `McpBaseError` 継承: `DataNotFoundError`, `InvalidPrefectureError`, `CapabilityNotAvailableError`, `ValidationError` |
| **構造化ロギング (pino)** | `src/logger.ts` — stderr 書き込み、`LOG_LEVEL` env 対応、`toolLogger` (tool/prefecture/duration_ms) |
| **`withErrorHandling()` ラッパー** | 全 10 ツールに適用。エラー時 `isError: true` レスポンス + 構造化ログ |
| **HTTP サーバー堅牢化** | `helmet` セキュリティヘッダー、10MB ボディ制限、`API_KEY` 認証、30分タイムアウト、SIGTERM/SIGINT グレースフルシャットダウン |
| **ESLint + Prettier** | `eslint.config.mjs` (flat config) + `.prettierrc` 導入 |
| **カバレッジ計測** | `pnpm test:coverage` — vitest v8 coverage (70% 閾値) |
| **CodeQL セキュリティ分析** | `.github/workflows/codeql.yml` — 週次実行 |
| **CI 拡張** | ESLint ステップ + `npm audit` + カバレッジアーティファクト + Step Summary |
| **ドキュメント** | `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` 追加 |
| テスト総数 | **174 → 185+ テスト** |

## v2.4.0 What's New

| 追加/変更 | 詳細 |
|---|---|
| **町丁目実データ対応** | `NeighborhoodRecord`（人口・世帯・年齢構成・昼夜間人口比）を愛知 70+・東京 15+・大阪 25+ 町丁目で搭載 |
| **drill_down 実データ昇格** | `neighborhood` 指定時に町丁目レベルの人口・世帯・高齢化率・昼夜間人口比を実データで返却 |
| **store_location 町丁目精度** | 町丁目データがある場合、人口・昼夜間人口比を実データベースでスコアリング |
| **大阪府ローダー追加** | 地価・人口・浸水・地震・自治体境界・町丁目データ（3 都府県体制） |
| **Three.js 3D ビューア** | `ui/dashboard-3d.html` — 名駅周辺の建物を 3D 描画。OrbitControls + 朝/正午/夕方の影シミュレーション |
| **3D ダッシュボードリソース** | `ui://japan-real-estate-intel/dashboard-3d` で 3D ビューアにアクセス |
| 合計ツール数 | **10 ツール** |
| 対応都府県 | **3（愛知・東京・大阪）** |
| テスト総数 | **149 → 174 テスト** |

## v2.3.0 What's New

| 追加/変更 | 詳細 |
|---|---|
| **`simulate_landscape_impact` ツール新設** | SunCalc 太陽位置計算 + PLATEAU 3D 建物データから影ポリゴンを生成。日照時間推定・影面積・高影響建物リスト・Markdown レポート |
| **影レイヤー追加** | ダッシュボードに 🌑影 レイヤー。建物ごとの影ポリゴンを半透明で描画 |
| **時刻プリセット** | 朝 8:00 / 正午 12:00 / 夕方 17:00 の 3 プリセットで時刻別影シミュレーション |
| **日照推定アルゴリズム** | 8:00〜16:00 の 5 時点で太陽高度 > 10° & 影外判定 → 日照時間概算 |
| 合計ツール数 | **9 → 10 ツール** |
| テスト総数 | **130 → 149 テスト** |

## v2.2.0 What's New

| 追加/変更 | 詳細 |
|---|---|
| **`evaluate_store_location` ツール新設** | コンビニ/ファミレス/カフェ/ドラッグストア/スーパーの出店適地評価。店舗タイプ別重み付け・競合分析・差別化提案・Markdown レポート |
| **3 データソース統合** | 交通利便性（駅・路線・乗降客数）、商業施設（SC/CVS/飲食等）、医療福祉（病院/クリニック/薬局等）を全ツールに統合 |
| **`cross_analyze` に 3 フラグ追加** | `includeTransport` / `includeCommercial` / `includeMedical` でオプトイン |
| **比較メトリクス 8 軸化** | `compare_prefectures` の metrics に `transport` / `commercial` / `medical` を追加。レーダーチャート 8 軸対応 |
| **ドリルダウン拡張** | `drill_down_local_analysis` に交通スコア・商業密度・医療充実度を追加 |
| **ダッシュボード 3 新レイヤー** | 交通（🚉 teal）/ 商業施設（🏬 amber）/ 医療（🏥 pink）レイヤー追加 |
| **店舗評価モード** | ドリルダウンパネルに storeType セレクタ付き店舗評価モードトグル追加 |
| 合計ツール数 | **8 → 9 ツール** |
| テスト総数 | **93 → 130 テスト** |

### 店舗タイプ別重み付け表

| 指標 | コンビニ | ファミレス | カフェ | ドラッグストア | スーパー |
|---|:---:|:---:|:---:|:---:|:---:|
| 人流 | 35% | 20% | 40% | 25% | 25% |
| 人口密度 | 25% | 30% | 20% | 35% | 35% |
| 災害リスク | 15% | 20% | 10% | 15% | 20% |
| 競合密度 | 20% | 15% | 20% | 15% | 10% |
| 交通利便性 | 5% | 10% | 10% | 10% | 10% |
| 教育環境 | - | 5% | - | - | - |

## v2.1.0 What's New

| 追加/変更 | 詳細 |
|---|---|
| **`compare_prefectures` ツール追加** | 2〜5 都道府県を価格・リスク・人流・教育・企業で比較。レーダーチャートデータ・ランキング・差分ハイライト・Markdown レポート出力 |
| **`drill_down_local_analysis` ツール追加** | 市区町村・町丁目レベルのドリルダウン。地価・人口・リスク・人流・競合密度をローカル不動産屋向けにまとめる |
| **全ツールに `neighborhood` フィールド追加** | 町丁目名をラベルとしてレポートに反映（v2.1 は label only、実データ対応は v2.2 以降） |
| **比較モードダッシュボード** | 比較モード ON で地図を 2 分割。SVG レーダーチャート・ランキングテーブル・bestFor が insight パネルに表示される |
| **市区町村クリック → ドリルダウンパネル** | 地図上クリックで詳細メトリクスパネルが展開。町丁目入力欄も搭載 |
| 合計ツール数 | **6 → 8 ツール** |

## v2.0.0 Breaking Changes

| 変更 | 詳細 |
|---|---|
| 全ツールに `prefecture` パラメータ追加 | デフォルト: `"愛知県"` |
| `cross_analyze_with_human_flow` 廃止 | `cross_analyze_real_estate_market` に `includeHumanFlow` フラグとして統合 |
| Resource URI 変更 | `realestate://land-price/{prefecture}/{area}` 形式に |
| データディレクトリ変更 | `data/aichi/`, `data/tokyo/` に分離 |
| 出力に optional フィールド追加 | `humanFlow`, `realDemandScore`, `educationSummary`, `corporateSummary` |

## 「今までなかった」独自価値

| データ×データ | 実現する分析 | 業界インパクト |
|---|---|---|
| 地価 × 人流 × 災害リスク | 実需要に基づく空室リスク予測 | 「人が本当に来るか？」を数値化 |
| 住宅価格 × 学区偏差値 × 犯罪統計 | ファミリー物件の真の資産価値 | 子育て世帯向け最強の投資判断 |
| オフィス価格 × 企業集積 × 通勤時間 | 法人需要の精密予測 | オフィス・物流投資で差別化 |
| 地価 × PLATEAU 3D建物高さ × 影 | 景観・日照シミュレーション | 開発事業者への視覚的説得力 |

## 都道府県 Capabilities マトリクス

| 機能 | 愛知県 | 東京都 | 大阪府 |
|---|:---:|:---:|:---:|
| 地価公示 | YES | YES | YES |
| 不動産取引 | YES | - | - |
| 人口統計 | YES | YES | YES |
| 浸水想定 | YES | YES | YES |
| 土砂災害 | YES | - | - |
| 地震想定 | YES | YES | YES |
| 市区町村境界 | YES | YES | YES |
| 人流データ | YES | - | - |
| 教育環境 | YES | - | - |
| 企業立地 | YES | - | - |
| 犯罪統計 | YES | - | - |
| PLATEAU 3D | YES | - | - |
| 交通利便性 | YES | - | - |
| 商業施設 | YES | - | - |
| 医療福祉 | YES | - | - |
| **町丁目データ** | **YES** | **YES** | **YES** |

## 特徴

- **10 ツール**: 市場クロス分析 / リスク評価 / ファミリー評価 / 法人需要予測 / レポート生成 / ダッシュボード / 都道府県比較 / ローカルドリルダウン / 出店適地評価 / 日照・影シミュレーション
- **12 レイヤーダッシュボード + 3D ビューア**: 地価 / 災害リスク / 取引 / 人口 / 人流 / 学区 / 企業密度 / 3D 建物 / 交通 / 商業施設 / 医療 / 影 + **Three.js 3D ビューア（v2.4 new）**
- **3 都府県対応**: 愛知県（フル機能）/ 東京都 / **大阪府（v2.4 new）**
- **町丁目実データ**: 愛知 70+ / 東京 15+ / 大阪 25+ 町丁目の人口・世帯・年齢構成・昼夜間人口比
- **都道府県セレクタ**: ダッシュボード上で Aichi ↔ Tokyo を切り替え
- **比較モード（v2.1 フル機能）**: 地図 2 分割 + SVG レーダーチャート + ランキングテーブル + bestFor 表示
- **ドリルダウンパネル（v2.1 new）**: 市区町村クリックで詳細パネル展開。町丁目ラベル入力対応
- **stdio + Streamable HTTP**: 両トランスポート対応
- **TypeScript strict + Zod**: 型安全な入出力スキーマ
- **プラガブル**: `BaseLoader` を継承して新県を追加

## クイックスタート

```bash
git clone https://github.com/sugukuru/japan-real-estate-intel-mcp.git
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

## ツール一覧（v2.3: 10 本）

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

capabilities がない都道府県では該当フィールドが `undefined` になり、`keyInsights` に「v2.x で対応予定」と表示されます。

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

## Resources（v2.0 URI パターン）

| URI | 説明 |
|---|---|
| `realestate://land-price/{prefecture}/{area}` | 地価公示データ |
| `hazard://flood/{prefecture}/{area}` | 浸水想定区域 GeoJSON |
| `stats://population-trend/{prefecture}/{area}` | 人口統計 |
| `ui://japan-real-estate-intel/dashboard` | ダッシュボード HTML |

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

**注意**: データは MVP デモ用のサンプルスナップショットです。投資判断には最新の公開データを直接ご確認ください。

## 開発

```bash
pnpm install
pnpm dev          # TypeScript watch
pnpm build:ui     # ダッシュボード再ビルド
pnpm test         # Vitest (174 tests)
pnpm lint         # 型チェック
```

## ロードマップ

### v2.4.0（本バージョン）
- 町丁目（neighborhood）実データ対応（愛知 70+ / 東京 15+ / 大阪 25+ 町丁目）
- drill_down / store_location / cross_analyze で町丁目レベル精度を実現
- 大阪府ローダー追加（3 都府県体制）
- Three.js 3D ビューア（`ui/dashboard-3d.html`）

### v2.5.0（予定）: 全国拡張 + Freemium 基盤
- 福岡県・北海道ローダー追加（5 都道府県体制）
- API キー認証 + レート制限ミドルウェア
- Freemium SaaS 基盤（無料: 愛知県のみ / Pro: 全国比較 + API）
- Zenn 連載用サンプルプロンプト集

## ライセンス

MIT
