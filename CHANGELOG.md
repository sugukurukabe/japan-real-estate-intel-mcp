# Changelog

All notable changes to `@sugukuru/japan-real-estate-intel-mcp` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning](https://semver.org/)

---

## [4.0.0] – 2026-05-07 — Capability Parity + Intelligence Layer

### Added
- **8 県フルデータ対応**: 東京都・大阪府・神奈川県・福岡県・北海道・京都府・兵庫県の全 7 県に `human_flow.csv`, `school_districts.csv`, `corporate_locations.csv`, `crime_stats.csv` を追加（各県 4 ファイル、計 28 ファイル）。
- **4 県 transport/commercial/medical データ追加**: 福岡県・北海道・京都府・兵庫県に `transport_stations.csv`, `commercial_facilities.csv`, `medical_facilities.csv` を追加（12 ファイル）。
- **全 7 非愛知ローダーの capabilities 全面更新**: `humanFlow`, `education`, `corporate`, `crime`, `transport`, `commercial`, `medical` をすべて `true` に（plateau のみ未対応のため `false` を維持）。
- **新ツール `forecast_land_price_trend`**: 地価公示データの年別推移から線形回帰または移動平均で将来地価を予測。CAGR・トレンド方向・信頼区間・投資シグナル（buy/hold/caution）を出力。
- **新ツール `scenario_what_if`**: 「大型商業施設開業」「新駅設置」「人口流出」など 7 種類のシナリオが地価・投資スコア・リスクスコアに与える影響をベースライン比較で試算。
- **MCP Prompts 追加**: `land_price_forecast_report`（地価予測レポート）, `scenario_what_if_analysis`（What-If 分析）の 2 テンプレートを登録（計 5 Prompts）。
- **ダッシュボード強化**: インサイトパネルに地価トレンド SVG ミニチャートを追加。What-If シナリオセレクターでシナリオ別の地価影響をリアルタイム表示。レポート画面にトレンドチャートと 4 シナリオ試算表を追加。
- **`src/tools/forecast_land_price_trend.ts`**: 地価予測ツール実装
- **`src/tools/scenario_what_if.ts`**: シナリオ分析ツール実装

### Changed
- 全 7 ローダーの `getHumanFlow()`, `getSchoolDistricts()`, `getCorporateLocations()`, `getCrimeStats()` を実データ読み込みに変更（従来は `[]` を返す stub）。
- `src/schemas.ts` に `ForecastLandPriceTrendInput/Output`, `ScenarioWhatIfInput/Output` スキーマを追加。
- `server.ts` のツール数コメントを `// -- Tools (12) --` に更新。
- テスト: 新ツール 12 件追加 + capability 変更に伴うテスト更新（333 件合計）。

### Breaking (none)
- 既存 API は後方互換。新ローダーメソッドはデータが存在しない場合に空配列を返す挙動は維持。

---

## [3.1.0] – 2026-05-07 — Data Enrichment + Advanced Features

### Added
- **Tokyo/Osaka/Kanagawa に transport/commercial/medical データ追加**: 合計 9 ファイル追加（各県 transport_stations.csv, commercial_facilities.csv, medical_facilities.csv）。対応 loader の capabilities を `true` に更新。
- **MCP Prompts 登録**: `investment_report`, `store_location_evaluation`, `prefecture_comparison` の 3 テンプレートを `server.ts` に登録。
- **Excel エクスポート**: `compare_prefectures` / `drill_down_local_analysis` に `exportFormat: 'xlsx'` オプション追加。`xlsx` ライブラリを使用。
- **`src/export/excel.ts`**: Excel エクスポートユーティリティモジュール

### Changed
- `compare_prefectures` / `drill_down_local_analysis` スキーマに `exportFormat` フィールド追加（後方互換：デフォルト `json`）
- テスト: Tokyo/Osaka/Kanagawa の capabilities テストを v3.1.0 仕様に更新（321 件合計）

### Dependencies
- `xlsx 0.18.5` 追加

---

## [3.0.0] – 2026-05-07 — Production Readiness (SaaS 基盤)

### Added
- **Rate Limiting**: `express-rate-limit` ミドルウェア導入。環境変数 `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` で設定可能。
- **data:fetch CLI 8 県対応**: `scripts/fetch-real-data.ts` の `SUPPORTED_PREFECTURES` を 8 県（aichi, tokyo, osaka, fukuoka, hokkaido, kanagawa, kyoto, hyogo）に拡張。`--all` フラグで一括取得可能。
- **CI/CD 自動 npm publish**: `.github/workflows/release.yml` に `npm publish --access public` ステップ追加。`NPM_TOKEN` シークレットを使用。
- **PDF エクスポート**: `generate_area_report` に `format: 'pdf'` パラメータ追加。`pdfkit` を使用して Markdown をPDF に変換。`pdfBase64` フィールドに Base64 エンコード済み PDF を返す。
- **`src/export/pdf.ts`**: PDF エクスポートユーティリティモジュール
- **`.env.example`**: レート制限設定の環境変数ドキュメント追加

### Changed
- `generate_area_report` が async 関数に変更（PDF 生成のため）
- テスト: rate limiting テスト 2 件追加（320 件合計）

### Dependencies
- `express-rate-limit 8.5.1` 追加
- `pdfkit 0.18.0` + `@types/pdfkit 0.17.6` 追加

### Breaking (minor)
- `generateAreaReport()` が `async` になったため、直接呼び出す場合は `await` が必要

---

## [2.10.0] – 2026-05-07 — Documentation Accuracy + Dashboard Generalization

### Changed
- **README.md**: Capabilities マトリクスを 8 県対応に拡張、テスト数 318 に更新、ロードマップを v2.9 現状に更新、`data:fetch` の正確な説明に修正
- **SECURITY.md**: サポートバージョン表を 2.9.x に更新、rate limiting 予告を v3.0.0 に修正
- **CHANGELOG.md**: v2.6 欠番について注記追加
- **`src/server.ts`**: コメント「Tools (6)」→「Tools (10)」に修正
- **`ui-src/main.ts`** (比較モード汎用化):
  - `secondaryPrefKey()` を動的選択に変更。`comparisonPrefecture` 変数で任意の 8 県から選択可能
  - 比較モード開始時に都道府県選択ドロップダウンを UI に追加
  - `buildTransactionGroup()` の `Math.random()` 除去。「実データ未取得」表示に変更
  - neighborhood ヒントの「v2.2 以降対応予定」テキストを「全 8 県対応済み」に修正

---

## [2.9.0] – 2026-05-07 — National Expansion: 8 都道府県体制 (5 新規追加)

### Added
- **5 新規都道府県サポート**: 福岡県・北海道・神奈川県・京都府・兵庫県
- **Osaka の UI 修正**: `ui-src/main.ts` の `PREFECTURES` 定数に Osaka エントリを追加（ローダーは登録済みだが UI が欠落していた不整合を解消）
- **30 データファイル新規作成** (5 県 × 6 ファイル): `land_price.csv`, `population.csv`, `earthquake.json`, `flood.geojson`, `municipalities.topojson`, `neighborhoods.csv` + 各県 `README.md`
- **5 ローダー新規実装**: `fukuoka-loader.ts`, `hokkaido-loader.ts`, `kanagawa-loader.ts`, `kyoto-loader.ts`, `hyogo-loader.ts` — 全て `OsakaLoader` の minimal パターン踏襲 (`capabilities.neighborhoods: true`)
- **resolver 拡張**: `src/prefecture/resolver.ts` に 神奈川県 (JP-14)、京都府 (JP-26)、兵庫県 (JP-28) を追加
- **`tests/national-expansion.test.ts`** 新規 — 5 県 + Osaka の 80 パラメータ化テスト (resolver / registry / loader data / tool integration)
- **6 県分の UI エントリ** (`ui-src/main.ts` `PREFECTURES` 定数): 大阪府・福岡県・北海道・神奈川県・京都府・兵庫県

### Changed
- `src/data-loaders/index.ts` — 5 ローダーを `registerLoader` 登録
- `package.json` — version 2.9.0
- `src/server.ts`, `src/http.ts` — version string updated to 2.9.0
- テスト数: 238 → 318 (+80件)

### Fixed
- `tests/drilldown.test.ts`, `tests/neighborhood.test.ts`, `tests/tokyo.test.ts` — 北海道が実ローダー化したことでスタブローダーテストが失敗していた箇所を 沖縄県（真の未サポート県）に変更
- `tests/shadow.test.ts` — shadow polygon 座標チェックのアサーションを、空ポリゴンを許容するよう修正

---

## [2.8.0] – 2026-05-07 — Dual-Mode Dashboard (不動産投資 / 店舗出店戦略)

### Added
- **Dual-mode toggle bar** in dashboard header — 「🏢 不動産投資」and「🏪 店舗出店戦略」mode buttons rendered dynamically by `renderModeToggle()`
- **`currentDashboardMode`** global state (`'investment' | 'store'`) and `applyMode()`, `renderModeToggle()`, `renderModeBanner()` functions in `ui-src/main.ts`
- **Mode-aware layer ordering** — `INVESTMENT_LAYERS` and `STORE_LAYERS` constants; `renderLayerControl()` now orders buttons by mode priority and marks primary layers with `.layer-btn-primary`
- **Mode hint banner** (`#mode-hint-banner`) shown in store mode at the top of the map area
- **Store eval panel promotion** — `buildDrillDownPanel()` renders 店舗評価セレクター at the **top** of the panel in store mode (with quick-score chips for 人流/交通/商業) and at the bottom in investment mode
- **Dynamic radar chart axis ordering** — `buildComparisonPanel()` reorders axes: store mode prioritises 人流→交通→商業→医療; investment mode keeps 価格→安全→人流→企業→教育 order
- **Mode-aware score card** — insight panel shows 「出店適性スコア」(weighted human flow + transport + commercial) in store mode vs 「投資スコア」in investment mode
- **`initialMode` parameter** in `OpenDashboardInput` schema (`'investment' | 'store'`, optional, backward-compatible)
- **`dashboardUrl`** field in `OpenDashboardOutput` — includes `?mode=store` URL param when `initialMode` is specified
- **URL parameter support** — `?mode=store` / `?mode=investment` initialises dashboard mode on page load
- **New CSS** in `ui-src/styles.css` — `.mode-toggle-btn`, `#mode-toggle-bar`, `.store-eval-prominent`, `.store-mode-badge`, `.store-score-chip`, `.layer-btn-primary`, `#mode-hint-banner`
- **3 new tests** in `tests/tools.test.ts` for `initialMode` / `dashboardUrl` behaviour

### Changed
- `package.json` — version 2.8.0
- `src/server.ts`, `src/http.ts` — version string updated to 2.8.0
- `src/schemas.ts` — `OpenDashboardInput` gains optional `initialMode`; `OpenDashboardOutput` gains optional `initialMode` + `dashboardUrl`
- `src/tools/open_dashboard.ts` — default layer switches to `human_flow` when `initialMode=store`; `dashboardUrl` is always returned

### Test count
238 total (was 235)

---

## [2.7.0] – 2026-05-07 — Real Data Integration (e-Stat / MLIT API)

### Added
- **`src/api-client/types.ts`** — `MlitTransaction`, `MlitApiResponse`, `EstatApiResponse`, `EstatValue`, `TransactionCsvRow`, `LandPriceCsvRow`, `PopulationCsvRow`, `FetchResult` type definitions
- **`src/api-client/mlit.ts`** — `MlitClient.fetchTransactions()` (XIT001), `toTransactionRows()`, `toLandPriceRows()` (median aggregation by city×district); `transactionsToCsv()`, `landPriceToCsv()` serialisers
- **`src/api-client/estat.ts`** — `EstatClient.fetchPopulation()` (2020 Census, statsDataId=0003443220), `toPopulationRows()` (area code → city name via CLASS_INF); `populationToCsv()` serialiser
- **`scripts/fetch-real-data.ts`** — CLI orchestrator: `--prefecture`, `--year`, `--quarter`, `--all` args; reads `.env`; skips sources without keys; overwrites `data/{pref}/*.csv`
- **`.env.example`** — `MLIT_API_KEY` + `ESTAT_APP_ID` + MCP HTTP server settings
- **`npm run data:fetch`** / **`npm run data:fetch:all`** scripts in `package.json`
- **25 new tests** in `tests/api-client.test.ts` (fetch mocked via `vi.stubGlobal`)

### Changed
- `package.json` — version 2.7.0; added `tsx` devDependency; added `data:fetch` / `data:fetch:all` scripts
- `src/server.ts`, `src/http.ts` — version string updated to 2.7.0

### Dependencies Added
- `tsx` ^4.21.0 (dev) — TypeScript direct execution for CLI scripts

---

> **Note**: v2.6.0 was merged into v2.9.0 (National Expansion). There is no separate v2.6.0 release.

## [2.5.0] – 2026-05-07 — Foundation Hardening

### Added
- **`src/errors.ts`** — Custom error hierarchy: `McpBaseError`, `DataNotFoundError`, `InvalidPrefectureError`, `CapabilityNotAvailableError`, `ValidationError`, `formatErrorMessage`, `isClientError`
- **`src/logger.ts`** — Structured logger (`pino`) writing to stderr. Respects `LOG_LEVEL` env var. Helpers: `toolLogger`, `moduleLogger`
- **`withErrorHandling()`** in `src/server.ts` — Wraps all 10 tool handlers with uniform error catching and structured logging (tool name, prefecture, duration_ms)
- **HTTP server hardening** (`src/http.ts`): `helmet` security headers, `express.json({ limit: '10mb' })`, optional `API_KEY` authentication, 30-minute session timeout, graceful SIGTERM/SIGINT shutdown
- **ESLint flat config** (`eslint.config.mjs`), **Prettier** (`.prettierrc`, `.prettierignore`)
- **`test:coverage`** script — vitest v8 coverage with 70% line/statement threshold
- **`lint:eslint`** and **`format`** / **`format:check`** npm scripts
- **`.github/workflows/codeql.yml`** — Weekly CodeQL security analysis
- **CI enhancements** — ESLint step, `npm audit --prod`, coverage with artifact upload and GitHub Step Summary
- **New tests**: `tests/errors.test.ts`, `tests/logger.test.ts`, `tests/http_server.test.ts` (supertest integration)

### Changed
- `src/index.ts` — Uses `logger.info` / `logger.fatal` instead of `console.error`
- `src/server.ts` — Version bumped to 2.5.0; all tools wrapped with `withErrorHandling`
- `package.json` — Version 2.5.0; new devDependencies: ESLint/Prettier/supertest/coverage; new scripts

### Dependencies Added
- `pino` ^10.3.1
- `helmet` ^8.1.0
- `supertest` ^7.2.2 (dev)
- `@vitest/coverage-v8` ^3.2.4 (dev)
- `eslint` ^10.3.0 (dev)
- `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` ^8.59.2 (dev)
- `prettier` ^3.8.3 (dev)
- `eslint-config-prettier` ^10.1.8 (dev)

---

## [2.4.0] – 2026-04-XX — Neighborhood Real Data + Osaka + Three.js 3D Viewer

### Added
- Neighborhood-level (町丁目) real data for Aichi (69 rows), Tokyo (15 rows), Osaka (27 rows)
- Osaka prefecture full loader (`src/data-loaders/osaka-loader.ts`)
- Three.js 3D building viewer (`ui/dashboard-3d.html`) with time-based shadow simulation
- `mode: '2d' | '3d'` parameter for `open_dashboard` tool
- New resource: `ui://japan-real-estate-intel/dashboard-3d`

### Changed
- `drill_down_local_analysis` and `evaluate_store_location` now use real neighborhood data when available
- `cross_analyze_real_estate_market` adds `neighborhoodDetail` section when neighborhood data available

---

## [2.3.0] – 2026-03-XX — PLATEAU 3D Shadow Simulation

### Added
- `simulate_landscape_impact` tool — Sun position (SunCalc) + shadow polygon generation
- Dashboard shadow layer with morning/noon/evening time presets
- `suncalc` dependency

---

## [2.2.0] – 2026-02-XX — Store Location Evaluation + Transport/Commercial/Medical Data

### Added
- `evaluate_store_location` tool with type-specific weighting (8 store types)
- Transport, commercial facility, and medical facility data for Aichi
- 3 new map layers on dashboard
- 8-axis radar chart

---

## [2.1.0] – 2026-01-XX — Prefecture Comparison + Neighborhood Drill-Down

### Added
- `compare_prefectures` tool — up to 5 prefectures, radar chart data, ranking, diff highlights
- `drill_down_local_analysis` tool — city/neighborhood level analysis, local sales pitch
- Dashboard comparison mode with parallel maps
- Optional `neighborhood` parameter on all relevant tools

---

## [2.0.0] – 2025-12-XX — National Prefecture Architecture

### Added
- Pluggable prefecture loader architecture (`PrefectureLoader` interface)
- Tokyo minimal data loader
- `prefecture` parameter on all tool inputs
- MCP Apps dashboard with prefecture selector

### Breaking
- Tool schemas now require `prefecture` field

---

## [1.0.0] – 2025-11-XX — Initial Release (Aichi MVP)

### Added
- `cross_analyze_real_estate_market`, `assess_property_risk`, `generate_area_report`, `open_dashboard`
- `assess_family_friendly_score`, `predict_corporate_demand`
- Aichi prefecture data: land price, population, flood/earthquake hazard, municipalities
- MCP Apps dashboard with Leaflet map

[2.7.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.5.0...v2.7.0
[2.5.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/sugukuru/japan-real-estate-intel-mcp/releases/tag/v1.0.0
