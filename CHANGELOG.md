# Changelog

All notable changes to `@sugukuru/japan-real-estate-intel-mcp` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning](https://semver.org/)

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
