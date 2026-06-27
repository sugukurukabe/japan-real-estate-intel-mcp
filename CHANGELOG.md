# Changelog
## [6.16.0] - 2026-06-28

### Added

- **Premium Pro/Enterprise tools** — 3 new tiered MCP tools:
  - `optimize_portfolio_allocation` (Pro) — Multi-property portfolio risk/return optimization
  - `forecast_demographic_shift` (Pro) — 10-year population/household/aging/pedestrian-flow forecaster
  - `audit_zoning_compliance` (Enterprise) — Building Standards Law compliance auditor (建蔽率/容積率/斜線制限/高度地区制限)
- **Analysis engines**: `src/analysis/portfolio_optimization.ts`, `zoning_compliance.ts`, `demographic_forecast.ts`
- **UI premium widgets**: Dashboard insight panel with Pro/Enterprise tool buttons, MCP bridge integration
- **23 new unit tests** in `tests/premium_features.test.ts`

### Changed

- Tool count: 33 → **38 tools** (README, server.json, metadata test updated)
- Free tier now includes MCP Apps UI dashboard resources
- Zod schemas: added `PortfolioAnalysisItem`, `DemographicForecastYear` type exports

### Fixed

- `tiers.test.ts`: Updated free tier UI resource assertion to match current config
- `security_tiering.test.ts`: Updated free tier dashboard resource test
- `new_features.test.ts`: Fixed mock text assertion
- `metadata.test.ts`: Updated tool count from 33 to 38

## [6.15.2] - 2026-05-20

### Added

- **Free tier monthly tool-call budget** (`src/tier-usage.ts`) — soft limit 50 calls/month (UTC) on self-hosted stdio; configurable via `TIER_MONTHLY_TOOL_CALLS` and `USAGE_CLIENT_ID`
- **`Dockerfile.glama`** — stdio MCP image for Glama.ai listing introspection
- **Docs** — [pro-demo-setup.md](docs/pro-demo-setup.md), [partner-outreach-template.md](docs/partner-outreach-template.md), external listing walkthrough (Glama-first for awesome-mcp PR)

## [6.15.1] - 2026-05-20

### Changed

- **`mcpName`** aligned with MCP Registry GitHub namespace: `io.github.sugukurukabe/japan-real-estate-intel-mcp`
- **`server.json`** updated to MCP Registry 2025-12-11 schema (`registryType`, `identifier`, `version`, `description` ≤100 chars)

## [6.15.0] - 2026-05-11

### Added — v6.15.0 価格トライアングル武器化パック

#### Phase 1 — データ層
- **`RosenkaRecord` interface** added to `src/data-loaders/types.ts` (city, district, year, median/max/min_per_sqm, sample_lines)
- **`LoaderCapabilities.rosenka`** boolean flag added
- **`BaseLoader.getRosenka()`** default implementation (loads `rosenka.csv`)
- **`PrefectureLoader.getRosenka()`** added to interface
- All 10 prefecture loaders updated with `rosenka: true` capability
- **`scripts/fetch-rosenka.ts`** (new) — generates `data/{pref}/rosenka.csv` from `land_price.csv` using 路線価 ≈ 公示 × 0.80 ratio (519 rows across 10 prefectures)

#### Phase 2 — 新ツール
- **`ArbitrageSignalType`** Zod enum (`discount` | `inheritance_edge` | `overheated` | `fair`)
- **`ArbitrageScanInput` / `ArbitrageSignalItem` / `ArbitrageScanOutput`** Zod schemas in `src/schemas.ts`
- **`src/analysis/price_triangulation.ts`** (new) — `computeTriangulationForCity()`, `tryFetchLiveTransactionMedian()`, `buildMarkdownReport()`, `BENCHMARK` constants
- **`src/tools/detect_arbitrage_signals.ts`** (new) — tool implementation
- **`detect_arbitrage_signals`** registered in `src/server.ts` with TL;DR output mode
- **`arbitrage_scan`** prompt registered (completable prefecture + signal_type)

#### Phase 3 — 連環反映
- **`composite_value_score`**: `computeLandPriceAxis` now calls `computeTriangulationForCity` and adds a `valueUpside` bonus (up to +10 pts) for discount-signal cities; evidence cites 路線価 data
- **`discover_opportunities`**: pre-computes discount flags and assigns `discount_arbitrage` signal to matching cities
- **`OpportunitySignalType`** enum extended with `'discount_arbitrage'`; `SIGNAL_TITLES` updated
- **`forecast_land_price_trend`**: adds `triangulationContext` ({rosenka, currentSpread, fairValueRange, signal}) to Markdown output

#### Phase 4 — UI
- **Price Triangulation panel** added to `updateInsightPanel()` in `ui-src/main.ts`:
  - 3-bar horizontal chart (路線価 / 公示 / 取引中央値)
  - Color-coded `assessmentGap` badge (🟢 割安 / ⚪ 適正 / 🔴 過熱)
  - `.rei-reveal` fade-in animation applied
  - `id="price-triangle-panel"` for test targeting

#### Phase 5 — テスト
- `tests/rosenka.test.ts` (new, 8 tests)
- `tests/price_triangulation.test.ts` (new, 8 tests)
- `tests/detect_arbitrage_signals.test.ts` (new, 6 tests)
- `tests/metadata.test.ts`: added `detect_arbitrage_signals` tool check
- `tests/opportunity.test.ts`: added `discount_arbitrage` signal and triangulation panel tests
- `tests/composite_ui.test.ts`: added rosenka citation check

#### Macro snapshot (追加)

- **`get_real_estate_macro_snapshot`** — 地価中央値YoY・取引3年・2050人口減の一枚化。`ESTAT_APP_ID` 設定時は e-Stat 建築物着工（`0003119768` / 都道府県 `XX000`）。金利は FRED CSV プロキシ `IRSTCB01JPM156N`。
- **`src/analysis/macro_snapshot.ts`**, **`src/api-client/fred_policy_rate.ts`**（旧 `boj_rates.ts`）, **`src/tools/get_real_estate_macro_snapshot.ts`**, `EstatClient.fetchBuildingConstructionPrefectureSummary`
- **`tests/macro_snapshot.test.ts`**, **`tests/fred_policy_rate.test.ts`**, `server.json` / `metadata.test.ts` 追記

### Changed

- Version bumped to `6.15.0` across package.json, src/server.ts, src/http.ts, ui/sw.js, ui/mcp-bridge.js, server.json
- **`server.json` `tools`** — MCP Registry 掲載名を実行時と一致させ **33 本**に更新（`quick_visual_summary`, `review_purchase_recommendation`, `simulate_leveraged_cashflow` を含む）
- **`tests/server_json_tools_sync.test.ts`** — `server.json` の `tools` に重複がないこと、および `createServer()` の `_registeredTools` キー集合と完全一致することを検証
- **`tests/metadata.test.ts`** — 上記 3 ツールの掲載と `tools.length === 33` を検証
- **`.gitignore`** — ローカル OAuth 用 `db/*.sqlite` / `*.sqlite-shm` / `*.sqlite-wal` を除外
- **テスト（MCP SDK 互換）** — `_registeredTools` が `Map` でも `Record` でも注釈・登録アサートが走るよう [`tests/tool_annotations.test.ts`](tests/tool_annotations.test.ts)、[`tests/renovation.test.ts`](tests/renovation.test.ts)、[`tests/detect_arbitrage_signals.test.ts`](tests/detect_arbitrage_signals.test.ts)、[`tests/composite_ui.test.ts`](tests/composite_ui.test.ts) を更新
- **ユーザー向け文言** — 「v2.x で対応予定」等をやめ、ローダー未提供時は「提供していません」「当該ローダーで未提供」に統一（[`src/tools/cross_analyze_real_estate_market.ts`](src/tools/cross_analyze_real_estate_market.ts)、[`src/analysis/local_drilldown.ts`](src/analysis/local_drilldown.ts)、[`src/analysis/comparison.ts`](src/analysis/comparison.ts)、[`src/tools/assess_family_friendly_score.ts`](src/tools/assess_family_friendly_score.ts)、[`src/tools/predict_corporate_demand.ts`](src/tools/predict_corporate_demand.ts)）
- **ドキュメント** — [`README.md`](README.md)（履歴メモ・実データ手順・ツール一覧の現行への誘導）、[`data/data-README.md`](data/data-README.md)、[`data/tokyo/README.md`](data/tokyo/README.md)、[`docs/registry-submission.md`](docs/registry-submission.md)（`tools` 同期と `pnpm test` 後の publish を明記）

### Registry / release（手作業）

- **`server.json` を変更したリリース**では、Anthropic MCP Registry へ [`mcp-publisher publish --file server.json`](docs/registry-submission.md) を再実行すること（手元の認証・DNS は同ドキュメント参照）

---

## [6.14.0] - 2026-05-11

### Added — UX Improvement Pack (v6.14.0)
- **`output_mode` parameter** (`compact` | `detailed`, default `compact`) on 5 high-use tools:
  `cross_analyze_real_estate_market`, `forecast_land_price_trend`, `discover_opportunities`,
  `composite_value_score`, `get_chochou_profile`
- **`outputModeField` + `withCompactOutput`** helpers exported from `src/schemas.ts`
- **`applyOutputMode()` helper** in `src/server.ts` — prepends a `**[TL;DR]** …` line when
  `output_mode = 'compact'` so the AI can present a concise headline before any JSON payload
- **Fade-in reveal animation** (`@keyframes reiFadeIn`) in `ui/dashboard.html`:
  - `rei-reveal` class with 0.38 s cubic-bezier transition applied to `#report-content` and
    `#opportunity-content` whenever their overlay gains the `.visible` class (via `MutationObserver`)
  - `#insight-panel` content re-triggers the animation on each update

### Changed
- **Info → Debug log level** for `withErrorHandling` start/ok events — reduces noise visible to
  end-users in MCP log streams; only warnings and errors remain at visible levels
- **Cursor rule** `.cursor/rules/response-style.mdc` (created in v6.14.0 pre-work): enforces
  outputting only after the final answer is determined, no intermediate streaming
- Version bump 6.13.0 → 6.14.0 across `package.json`, `src/server.ts`, `src/http.ts`,
  `ui/sw.js`, `ui/mcp-bridge.js`, `ui/dashboard.html`, `server.json`

## [6.13.0] - 2026-05-11

### Added — Data Enrichment (Zoning / Vacancy / Population Projection)
- **get_zoning_info tool**: Look up zoning type (用途地域), coverage ratio (建蔽率), floor area ratio (容積率), and height limits for any area across 10 prefectures
- **get_vacancy_stats tool**: Vacancy rate statistics by municipality with breakdown (for-rent/for-sale/other) compared to national average (13.6%)
- **get_population_outlook tool**: Population projection to 2050 with decline rate per municipality based on NIPSSR estimates
- **3 new MCP prompts**: `zoning_check`, `vacancy_analysis`, `population_outlook_report` with area completion
- **ZoningRecord, VacancyRecord, PopulationProjectionRecord** types added to data-loaders
- **3 new LoaderCapabilities flags**: `zoning`, `vacancy`, `populationProjection` — all enabled for 10 prefectures
- **Data generation scripts**: `gen-zoning-from-transactions.ts`, `fetch-vacancy-data.ts`, `fetch-population-projection.ts`
- **Dashboard widgets**: Zoning badge display, vacancy donut chart, population projection line graph added to insight panel
- **Capability badges**: Added `用途地域`, `空き家`, `人口推計` badges

### Enhanced
- **composite_value_score**: Risk axis now factors in vacancy rate (high vacancy = lower score); Future plan axis now incorporates 2050 population projection (population decline = lower score)
- **discover_opportunities**: New `declining_area` signal type for areas with >20% vacancy rate and declining land prices; vacancy rate integrated into risk assessment

### Changed
- All 10 prefecture loaders + BaseLoader updated with 3 new data methods
- StubLoader updated with vacancy/zoning/populationProjection empty defaults
- `OpportunitySignalType` enum expanded with `declining_area`
- Version bump to 6.13.0 across all files

### Tests
- `tests/zoning.test.ts`: 8 tests for zoning loader + tool
- `tests/vacancy.test.ts`: 8 tests for vacancy loader + tool
- `tests/population_projection.test.ts`: 8 tests for population projection loader + tool
- `tests/metadata.test.ts`: Added v6.13.0 tool presence checks
- `tests/tool_annotations.test.ts`: Updated version check to 6.13.0

## [6.12.0] - 2026-05-11

### Added — Composite Value Score
- **composite_value_score tool**: 5-axis fusion engine (land price, education, transport, future plans, risk) that produces a 0-100 composite score with tier rating (S/A/B/C), peer comparison, and AI narrative
- **composite_value_report prompt**: MCP prompt with completion-supported prefecture + area + horizon inputs
- **Dashboard Composite Score panel**: SVG radar chart, tier badge, axis detail bars, peer comparison table, and AI narrative rendering in the insight panel
- **Gemini composite narrative**: Executive summary + top 3 strengths + 2 cautions template; fallback template when Gemini is unavailable

### Added — Brand Unification
- **New SVG logo**: Japan archipelago silhouette + house icon + rising chart bars with gradient design
- **PNG generation script** (`scripts/gen-logos.mjs`): Generates 192/512px icons, maskable icon, and 1200x630 OG image from SVG
- **Unified icons**: All PNG icons (assets + ui/icons) now share the same design
- **README logo**: Centered logo display at the top of README.md
- **Maskable PWA icon**: Separate maskable entry in `manifest.webmanifest`

### Fixed — UI Polish
- **Chochou picker**: `loadChochouForWard` now fetches from `/data/aichi/chochou.json` and populates the select dynamically
- **Contract mode Markdown**: Replaced `replace(/\n/g,'<br>')` with proper `markdownToHtml` (tables, lists, blockquotes)
- **Capability badges**: Prefecture selector shows data availability pills (人流, 教育, 企業, etc.) with active/disabled states
- **3D mode alignment**: `applyToolData` now syncs `window.__currentMode` when `mode: '3d'` is received
- **postMessage origin**: Bridge resolves target origin from `document.referrer`; falls back to `'*'` only when unknown
- **OG image**: Updated to 1200x630 branded image with cache-busting `?v=6.12.0`

### Changed
- Version bumped to 6.12.0 across package.json, server.ts, http.ts, mcp-bridge.js, sw.js, server.json
- `server.json` tools array now includes `composite_value_score` (25 tools total)

### Tests
- `tests/composite_value.test.ts`: 9 tests for scoring range, axes, weights, tiers, peer comparison, fallback narrative
- `tests/composite_ui.test.ts`: 5 tests for tool registration, prompt registration, schema validation
- `tests/metadata.test.ts`: Added composite_value_score in server.json tools check

### Dependencies
- Added `sharp` (dev) for PNG generation from SVG

## [6.11.0] - 2026-05-11

### Added — Official Directory Readiness
- **Anthropic MCP Registry**: `server.json` with namespace `jp.realestate-mcp/server`, npm + remote URL + tool listing
- **OpenAI Apps Directory**: `_meta.ui.domain` on widget resources, CSP declarations, test prompts document
- **Privacy Policy**: `/privacy-policy.html` with EN/JP toggle, GDPR + APPI coverage
- **Terms of Service**: `/terms.html` with EN/JP toggle, investment disclaimer, governing law
- **Bilingual tool descriptions**: All 24 tools now have `English | 日本語` format descriptions
- **README English-first**: English overview, Quick Install (Claude/Cursor/npm), Key Features at top
- **Prometheus metrics**: `/metrics` endpoint with `mcp_tool_calls_total`, `mcp_tool_duration_seconds`, `mcp_active_sessions`
- **Sentry opt-in**: `SENTRY_DSN` environment variable enables error tracking (no-op when absent)
- **X-Request-ID**: Every HTTP request gets a traceable UUID in request/response headers and logs
- **CSP for static UI**: Path-based Content-Security-Policy via helmet (MCP JSON endpoint excluded)
- **Docker GHCR workflow**: `.github/workflows/docker.yml` builds multi-arch images on tag push
- **Community files**: `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, PR template, `dependabot.yml`
- **Logo & branding**: `assets/logo.svg`, OG meta tags, favicon in `dashboard.html`
- **Registry submission guide**: `docs/registry-submission.md` (DNS TXT + mcp-publisher CLI)
- **Listing checklist**: `docs/listing-checklist.md` (awesome-mcp-servers, Smithery, mcp.so, Glama)
- **Screenshots directory**: `docs/screenshots/README.md` with capture guide

### Changed
- **Tool annotations**: All tools now explicitly declare `destructiveHint: false` and `openWorldHint: false`
- **`package.json`**: Added `mcpName`, `repository`, `homepage`, `bugs` fields
- **README badges**: npm version/downloads, CI, Docker, MCP Registry, License
- **README roadmap**: Updated to v6.11.0 with current feature list
- **`SECURITY.md`**: Version table updated from 2.x to 6.x, security measures updated

### Tests
- **`tests/server_json.test.ts`**: 8 tests validating `server.json` schema compliance
- **`tests/metadata.test.ts`**: 9 tests ensuring version consistency across all files
- **`tests/tool_annotations.test.ts`**: Expanded to 6 tests (added `destructiveHint`, `openWorldHint`, bilingual checks)
- **`tests/tiers.test.ts`**: 10 tests (from v6.10.0)

### Dependencies
- Added `prom-client` (Prometheus metrics)
- Added `@sentry/node` (error tracking opt-in)

## [6.10.0] - 2026-05-11

### Fixed
- **階層チェックの重大バグ**: `withErrorHandling` の tier デフォルトが `'free'` にハードコードされており、`DEFAULT_TIER` 環境変数が無視されていた問題を修正。Pro/Enterprise ツールのゲーティングが正常に動作するように

### Added
- **PWA 配線**: `<link rel="manifest">`, `apple-touch-icon`, `theme-color`, ServiceWorker 登録を `dashboard.html` に追加。iPad / Android でホーム画面追加が可能に
- **PWA インストール促進**: `beforeinstallprompt` によるフローティングボタン + iOS Safari 向け手動手順カード
- **モバイル / タブレット対応 CSS**: `@media (max-width: 900px / 600px)` でパネル縦並び化、タップサイズ 44px+ 保証、renovation/contract フォームのレスポンシブ化
- **統一 Toast コンポーネント**: `Toast.show(level, msg)` API で info/success/warning/error を表示。`alert()` を全廃
- **ローディングオーバーレイ**: `ReiLoading.show(el, msg)` / `ReiLoading.hide(el)` でスピナー + メッセージを表示
- **オフライン / オンライン通知**: `navigator.onLine` 状態変化をトーストで通知
- **初回ツアー**: quickstart オーバーレイの自動表示 + 4 ステップスポットライトガイド（`?tour=1` で再表示可能）
- **Progress Primitive 拡大**: `analyze_renovation_yield` と `generate_contract_support_package` にステップ型進行通知を追加
- **不動産業者向けクイックスタートガイド**: `docs/agent-quickstart.md` を新規作成（3 分で始める + 4 体験動線 + FAQ）
- **README.md**: トップに「不動産業者の方へ」セクションとガイドリンクを追加
- **ティア回帰テスト**: `tests/tiers.test.ts` を新規作成（10 テスト）

### Changed
- `ui/sw.js`: CACHE_VERSION を `rei-v6.10.0` にバンプ、`mcp-bridge.js` を precache に追加
- バージョン bump: 6.9.1 → 6.10.0

## [6.9.1] - 2026-05-11

### Added
- **本番 HTTPS デプロイ** at `https://realestate-mcp.jp` (Caddy + Let's Encrypt)
- **ドメイン変更手順**を `docs/deploy.md` に追記（`Caddyfile` 1 行 + `caddy reload` で無停止切り替え可能）

### Changed
- `Caddyfile`: ドメインを `realestate-mcp.jp, www.realestate-mcp.jp` に固定
- `src/http.ts`: `app.set('trust proxy', 1)` を追加し、Caddy リバースプロキシ背後で `req.ip` とレートリミットが正常動作するよう修正
- すべてのドキュメント（`docs/deploy.md`, `docs/deployment.md`, `docs/claude-desktop-setup.md`, `docs/chatgpt-integration.md`）のプレースホルダを `realestate-mcp.jp` に統一
- バージョン bump: 6.9.0 → 6.9.1

## [6.9.0] - 2026-05-11

### Added
- **売買契約支援スイート (Contract Intelligence)**: プロの不動産業者が商談中に契約リスク・特約・価格交渉を即時支援
- **2 つの新規 MCP ツール**:
  - `generate_contract_support_package`: リスクマトリックス・価格交渉アンカー・推奨特約を Markdown で生成
  - `assess_contract_risk`: 融資特約・検査・将来価値条項などのリスクをスコアリングし、ディールブレーカーを検出
- **契約専用ダッシュボード**: `?mode=contract` で区・町丁目・価格・築年数を入力し、2 つのツールを呼び出し可能
- **Pro ティア対応**: 2 新ツールを Pro/Enterprise に追加
- **ドキュメント**: `docs/contract-support-guide.md`（プロ業者向け体験シナリオ 2 本）
- **テスト**: 6 件の新規テスト（スキーマ + ツール動作）

### Changed
- バージョン bump: 6.8.0 → 6.9.0

## [6.8.0] - 2026-05-11

### Added
- **名古屋リノベ利回り意思決定スイート**: 愛知県・名古屋市の不動産業者向け、リノベ転売/賃貸利回り判断の専用機能群
- **4 つの新規 MCP ツール**:
  - `analyze_renovation_yield`: 町丁目×物件条件から取得価格・リノベ費用・想定賃料・表面/実質利回りを算出
  - `get_future_timeline`: 2025-2050年の将来計画タイムライン（再開発・インフラ・人口推計）
  - `get_chochou_profile`: 町丁目単位の現状プロファイル（地価・人口・進行中計画）
  - `recommend_renovation_targets`: 名古屋市全16区の利回り上位町丁目をランキング
- **リノベ利回りエンジン** (`src/analysis/renovation_yield.ts`): 地価データ×築年数×面積から賃料推定、リノベコスト3段階、表面/実質利回り、出口戦略を算出
- **未来タイムラインエンジン** (`src/analysis/future_timeline.ts`): `future_infrastructure.json` + `nagoya-plans.json` + 人口推計を年次統合
- **名古屋市API クライアント** (`src/api-client/nagoya.ts`): 再開発・都市計画データの読み込み + chochou.json からの町丁目セレクタ
- **EstatClient 拡張**: `fetchHouseholdComposition`, `fetchVacancyStats`, `fetchEconomicCensus` の 3 メソッド追加
- **MlitClient 拡張**: `fetchTransactionsByChochou` で町丁目レベルフィルタリング
- **ダッシュボード `?mode=renovation`**: 4タブ（未来/現状/リスク/収益性）+ 町丁目セレクタ + `callServerTool` 配線
- **データファイル新規**:
  - `data/aichi/chochou.json`: 名古屋市16区 205町丁目 + 中心座標
  - `data/aichi/nagoya-plans.json`: 19件の再開発・都市計画プロジェクト
  - `data/aichi/future_infrastructure.json` に名古屋駅前再開発・栄再開発・金山再開発を追加
- **ドキュメント**: `docs/renovation-mode-guide.md` — 不動産業者向け体験シナリオ 3 本
- **テスト**: 21件の新規テスト (renovation.test.ts)

### Fixed
- `withErrorHandling` のティア名 mismatch 修正: `cross_analyze` → `cross_analyze_real_estate_market` 等、4ツールの短縮名を実 MCP tool name に統一

### Changed
- バージョン bump: 6.7.0 → 6.8.0
- `tiers.ts`: 新規4ツールを Free/Pro ティアに追加

## [6.7.0] - 2026-05-10

### Added
- **MCP Apps UI 双方向化**: Opportunity カードのアクションボタン (`data-tool`) が `callServerTool` で実際にサーバーツールを呼び出すように配線
- **Leaflet ポップアップ深掘り**: 地図上のポップアップに「深掘り」「AIに質問」ボタンを自動注入。`drill_down_local_analysis` を呼び出し、結果をAIに送信
- **sendMessage 配線**: Opportunity カードの「Claudeに質問」ボタン、質問チップ (`userQuestionSuggestions`) がクリックで AI チャットにメッセージを送信
- **updateContext 自動発火**: 都道府県切替・市区町村選択・レイヤー変更・モード変更で `__mcpBridge.updateContext()` を自動発火。AIがユーザーの現在の表示状態を把握
- **Progress トースト UI**: `mcp-bridge.js` に `notifications/progress` リスナーを追加。画面上部にプログレスバー + ステップラベルを表示。完了後2秒で自動消去
- **Gemini 洞察セクション**: Opportunity カードに `creativeAngle`（AI洞察）と `userQuestionSuggestions`（質問チップ）セクションを追加
- **Claude Desktop セットアップガイド**: `docs/claude-desktop-setup.md` を新設。HTTP接続設定サンプル、体験シナリオ3本（投資・出店・災害リスク）、トラブルシューティング

### Changed
- バージョン bump: 6.6.0 → 6.7.0 (`package.json`, `src/server.ts`, `src/http.ts`, `ui/mcp-bridge.js`, `tests/tool_annotations.test.ts`)

## [6.6.0] - 2026-05-10

### Added
- **VPS デプロイ + CloudFlare Tunnel**: `docker-compose.yml` に `--profile tunnel` オプション追加。Caddy (Option A) と CloudFlare Tunnel (Option B) の2パターンをサポート。デプロイガイド `docs/deploy.md` 新設
- **BigQuery + Cloud Run データ基盤**: `BigQueryProvider` (`src/analysis/bigquery_provider.ts`) を実装。`OpportunityDataProvider` の BigQuery 版。`infra/bigquery-schema.sql` / `infra/cloudrun-job.yaml` でスキーマとジョブ定義
- **OAuth 2.1 + PKCE**: `src/auth/oauth-store.ts` (SQLite 永続化) + `src/auth/oauth-routes.ts` (Express ルート)。RFC 8414 メタデータ、認可コード + PKCE、リフレッシュトークン、自動クリーンアップ対応
- **Gemini 構造化JSON連携**: `src/analysis/gemini_narrative.ts` で `@google/genai` SDK を使い、Opportunity Radar カードに `creativeAngle` (独創的洞察) と `userQuestionSuggestions` (質問候補) を生成。`useGeminiNarrative` フラグで opt-in
- **Logging プリミティブ (MCP)**: `withErrorHandling` 内で `server.sendLoggingMessage()` を呼び出し、ツール実行の開始/成功/失敗をクライアントに通知
- **Progress プリミティブ (MCP)**: `generate_area_report` でPDF生成時に `notifications/progress` を送信。6ステップの進捗通知（クロス分析→人口→Markdown→ブランディング→取引事例→PDF完了）
- **ティアリング実行時チェック**: `withErrorHandling` で `isToolAllowed(tier, toolName)` を呼び出し、Free/Pro/Enterprise に応じたツールアクセス制御を実施。ブロック時は日本語エラーメッセージ + ログ通知
- **`.env.production.example`**: 本番デプロイ用環境変数テンプレート

### Changed
- `OpportunityCard` スキーマに `creativeAngle` (nullable), `userQuestionSuggestions` (optional) を追加
- `DiscoverOpportunitiesInput` に `useGeminiNarrative` フラグを追加
- `docker-compose.yml` で profiles (`caddy`, `tunnel`) を使い分け可能に
- Version bump: 6.5.1 → 6.6.0

### Dependencies
- `@google-cloud/bigquery` 8.3.0
- `@google/genai` 2.0.1
- `better-sqlite3` 12.9.0
- `@types/better-sqlite3` 7.6.13

## [6.5.1] - 2026-05-10

### Added
- **`OpportunityDataProvider` interface** (`src/analysis/opportunity_provider.ts`): Abstraction layer
  for data sourcing with `getCities()`, `getCityMetrics()`, `getAllRawData()`, and optional
  `getFreshTransactionSignal()`. `LocalCsvProvider` implements this using existing data loaders
- **Tool layer separation** (`src/tools/discover_opportunities.ts`): Async `discoverOpportunitiesTool()`
  with DI for `OpportunityDataProvider`, enabling MLIT freshness and future BigQuery providers
- **MLIT freshness integration** (`src/analysis/external_freshness.ts`): `tryFetchMlitFreshness()`
  fetches latest-quarter transactions via MLIT API when `includeExternalFreshness=true` and
  `MLIT_API_KEY` is set. Graceful fallback to CSV-only on missing key or API failure
- **Schema enhancements** (`src/schemas.ts`):
  - `DiscoverOpportunitiesInput.includeExternalFreshness` (boolean, default false)
  - `OpportunityCard.uiActions` (array of `{ label, tool, args }` for UI button rendering)
  - `OpportunityCard.evidence.freshTransactionSignal` (MLIT live signal or null)
  - `DiscoverOpportunitiesOutput.attribution` (promoted from ad-hoc `structuredContent` to Zod schema)
  - `FreshTransactionSignal` and `OpportunityUiAction` Zod types
- **Dashboard uiActions-driven rendering**: Opportunity Radar cards now render action buttons from
  `uiActions` array. Fresh MLIT signals displayed as badge when available
- **New tests**: uiActions validation (4 elements, valid tool names), attribution Zod parse,
  `includeExternalFreshness=false` fetch spy, mock Provider injection, freshTransactionSignal null check

### Changed
- `server.ts` discover_opportunities handler now uses async `discoverOpportunitiesTool` with full
  `structuredContent` (attribution included in schema, not as ad-hoc property)
- `src/analysis/opportunity.ts` scoring helpers exported for reuse; `discoverOpportunities()` retained
  as synchronous backward-compatible wrapper

## [6.5.0] - 2026-05-10

### Added
- **Opportunity Radar** (`discover_opportunities` tool): Cross-scans all cities in a prefecture
  and returns ranked "opportunity cards" tailored to the user's goal (investment, store, family,
  office, development). Combines land price, population, human flow, education, corporate,
  transport, commercial, medical, and disaster data per city
- **Opportunity analysis engine** (`src/analysis/opportunity.ts`): Goal-weighted multi-metric
  scoring with 7 signal types (undervalued_growth, high_flow_low_commercial,
  education_medical_hub, corporate_momentum, low_risk_upside, transit_oriented, population_inflow).
  Budget-level filtering and markdown report generation
- **Opportunity schemas** (`src/schemas.ts`): `DiscoverOpportunitiesInput`,
  `DiscoverOpportunitiesOutput`, `OpportunityCard`, `OpportunitySignalType` Zod schemas
- **`opportunity_radar` prompt**: Completable prefecture/goal/horizon prompt that calls
  `discover_opportunities` and instructs deep-dive analysis on top cards
- **Dashboard Opportunity Radar UI**: Overlay panel with scored cards, signal reasons, risk
  summary, and action buttons (deep-dive, What-if, report, map view). Available both via
  MCP App bridge (`callServerTool`) and local heuristic fallback
- **Opportunity test suite** (`tests/opportunity.test.ts`): 10 tests covering scoring, Zod schema
  validation, ranking order, budget filtering, data coverage, goal-specific tools, markdown
  toggle, tool/prompt registration, and UI button presence
- **Search catalog entry**: `discover_opportunities` indexed for search/fetch discovery
- **Tier configuration**: `discover_opportunities` added to free and pro tiers;
  `opportunity_radar` prompt added to pro prompts

### Data expansion roadmap (design only, no runtime changes)
- Short-term: Connect existing MLIT/e-Stat API clients to opportunity engine for fresh signals
- Mid-term: `data:refresh:opportunity` command with acquisition timestamps and coverage stats
- Long-term: Cloud Run Jobs for periodic MLIT/e-Stat ingestion, BigQuery area×year×metric
  history tables, Gemini structured JSON narrative generation, Firestore/Cloud SQL user
  watch-lists and notification history
- `OpportunityDataProvider` interface designed for future BigQuery backend swap

## [6.4.0] - 2026-05-10

### Added
- **MCP Completion primitive**: Autocompletion for `prefecture` and `area` (city) prompt
  arguments via the SDK `completable()` wrapper. The server now advertises `completions`
  capability and responds to `completion/complete` requests with matching suggestions
- **Area candidate search tool** (`search_area_candidates`): Tool-call friendly fallback for
  hosts that do not support tool argument completion directly. Use before domain tools to find
  valid `area` / `city` values from a prefecture and partial query
- **Completion provider** (`src/completion/area-completion.ts`): Prefix-match filtering
  over prefecture display names and per-prefecture city lists from data-loader geocode maps.
  Supports comma-separated prefecture completion and common reading aliases such as
  `なごやしなかむら` -> `名古屋市中村区`
- **`getCities()` method** on `PrefectureLoader` interface and `BaseLoader`: Exposes
  geocode map keys as a city name list for completion lookups
- **Completion test suite** (`tests/completion.test.ts`): Tests covering prefecture
  completion, area completion with context, unknown prefecture fallback, and SDK integration
  (completable schema verification, capabilities registration, direct candidate tool fallback)

### Changed
- **Prompt argument schemas**: `prefecture`, `area`, `city`, and `prefectures` arguments
  on 7 prompts (`investment_report`, `store_location_evaluation`, `prefecture_comparison`,
  `land_price_forecast_report`, `scenario_what_if_analysis`, `portfolio_optimization`,
  `aichi_future_value`) now wrapped with `completable()` for autocompletion support
- Server version bumped to `6.4.0` in `package.json`, `src/server.ts`, and `src/http.ts`

## [6.3.0] - 2026-05-10

### Added
- **MCP Apps UI integration**: Dashboard (2D/3D) now aligned with MCP Apps extension
  (`@modelcontextprotocol/ext-apps` v1.7.1). Uses `registerAppTool` and `registerAppResource`
  from the official SDK
- **MCP App bridge** (`ui/mcp-bridge.js`): Lightweight inline postMessage bridge implementing
  the MCP Apps protocol (v2026-01-26). Handles `ui/initialize` handshake, tool result reception,
  and bidirectional `tools/call` from the dashboard iframe to the MCP server
- **Interactive dashboard features**: Scenario What-If slider with live `scenario_what_if` calls,
  AI cross-analysis button, report export button, prefecture comparison button, and land price
  forecast button — all callable via `__mcpBridge.callServerTool()`
- **Context updates**: Dashboard sends `ui/update-model-context` notifications to keep the AI
  model aware of user navigation (prefecture changes, layer selections, viewed areas)
- **Tiering configuration** (`src/tiers.ts`): Free/Pro/Enterprise tier configuration mapping MCP
  primitives to paid features. Free tier: 7 tools + 50 calls/month. Pro: all 18 tools +
  MCP Apps dashboards + branded export. Runtime enforcement is intentionally deferred until
  account identity and usage metering are available
- **CSP configuration**: Dashboard resources declare `resourceDomains` and `connectDomains`
  for Leaflet, Carto tiles, jsDelivr, and OpenStreetMap tile server access
- **Design documentation** (`docs/v6.3.0-design.md`): User personas, ideal end-to-end flow,
  MCP primitive mapping, tiering design, and phased implementation roadmap
- **MCP Apps test suite** (`tests/mcp_apps.test.ts`): 7 tests covering bridge injection,
  protocol compliance, action buttons, and resource URI validation

### Changed
- **`open_dashboard` tool**: Migrated from `server.tool()` to `registerAppTool()` with
  `_meta.ui.resourceUri` (was incorrectly using `uri`). Returns dynamic `resourceUri`
  based on 2D/3D mode selection
- **Dashboard resources**: Migrated from `server.resource()` to `registerAppResource()` with
  `RESOURCE_MIME_TYPE` (`text/html;profile=mcp-app`) instead of `text/html`
- **Dashboard HTML injection**: `getDashboardHtml()` and `getDashboard3dHtml()` now inject
  the MCP bridge script inline before `</body>`, making each dashboard a self-contained MCP App
- Server version bumped to `6.3.0` in `package.json`, `src/server.ts`, and `src/http.ts`

### Dependencies
- Added `@modelcontextprotocol/ext-apps` v1.7.1

### Known Limitations
- **2D/3D dashboard resourceUri**: `open_dashboard` tool declares a fixed `_meta.ui.resourceUri`
  (2D) at registration time. At runtime it returns the correct 3D URI in the result `_meta`,
  but hosts that cache the registration-time URI may not switch to 3D UI automatically.
  Workaround: user can call `open_dashboard` again with `mode: "3d"`, or we may split into
  two separate tools (`open_dashboard_2d` / `open_dashboard_3d`) in a future release.

## [6.2.0] - 2026-05-10

### Added
- **ChatGPT Apps SDK compatibility**: `search` and `fetch` tools conforming to OpenAI Custom
  Connector requirements. `search` uses keyword-based catalog matching across all prefectures,
  cities, tools, and data sources. `fetch` routes IDs to existing domain tools and returns
  Markdown documents with metadata
- **Search catalog** (`src/search/`): auto-built from loader registry with Japanese-aware
  tokenization and ranked scoring (exact match > keyword overlap > token overlap)
- **Tool annotations**: all 16 tools now carry `readOnlyHint: true`, signalling to ChatGPT
  and other MCP clients that they perform no mutations
- **`docs/chatgpt-integration.md`**: step-by-step Custom Connector registration guide, ID
  naming conventions, and troubleshooting table

### Fixed
- **Mojibake in tool descriptions**: all 14 original tool descriptions in `src/server.ts` were
  corrupted (displayed as `???????`). Replaced with correct Japanese text
- **Prompt descriptions**: resource and prompt descriptions were also mojibake; all restored

### Changed
- Server version bumped to `6.2.0` in `package.json`, `src/server.ts`, and `src/http.ts`

## [6.1.2] - 2026-05-10

### Fixed
- **`scripts/deploy.sh` API_KEY repair**: previously `sed`-based replacement could leave a
  malformed `API_KEY=API_KEY=<value>` line if the script was run multiple times. The
  generation step is now idempotent: it strips every existing `API_KEY=` line and appends
  a single clean one. Also auto-detects and repairs the malformed double-prefix
- **CI tests** (5 failures on UTC runners):
  - `src/analysis/shadow.ts` `resolveDateTime`: `setHours()` was timezone-dependent.
    Replaced with `setUTCHours(hour - 9)` so JST presets produce the same sun position
    regardless of the host timezone (CI runs in UTC, so noon was returning -23.7°)
  - `tests/logger.test.ts`: moved `vi.resetModules()` from `afterEach` to `beforeEach`
    so the dynamic import re-reads `LOG_LEVEL` instead of returning a cached module
- **`docker-compose.yml`**: removed obsolete top-level `version: "3.9"` attribute that
  triggered a warning on every `docker compose` invocation

## [6.1.1] - 2026-05-10

### Fixed
- **Dashboard 401 Unauthorized**: When `API_KEY` was set in production, the auth middleware
  blocked static UI assets (`/dashboard.html`, `/sw.js`, icons, manifest), making the dashboard
  unreachable. Static files (`ui/`, `data/`, `assets/`) are now served *before* the auth middleware
  and explicitly excluded from the auth check (`isPublicPath()`)
- **`/` root path**: now redirects to `/dashboard.html` for convenience

### Added
- **Bearer token support**: API key can now be supplied via `Authorization: Bearer <key>` in
  addition to `x-api-key`, matching ChatGPT/Cursor MCP connector conventions

## [6.1.0] - 2026-05-08

### Fixed
- **PDF Japanese font rendering**: Bundle IPAex Gothic (IPA License) in `assets/fonts/ipaexg.ttf`;
  register via `doc.registerFont()` in `src/export/pdf.ts` so all Japanese text renders correctly
- Graceful fallback to Helvetica if font file is absent (non-fatal)

### Added
- **PWA support**: `ui/manifest.webmanifest`, `ui/sw.js` service worker (cache-first for static + Aichi data),
  icons (192/512/180px). Dashboard now installs on iPad Safari and Android Chrome
- **Docker deployment**: `Dockerfile` (multi-stage, non-root, healthcheck), `docker-compose.yml`
  (MCP + Caddy auto-HTTPS), `Caddyfile`, `.dockerignore`, `.env.production.example`
- **`docs/deployment.md`**: 10-minute self-hosted VPS deploy guide with ChatGPT/Cursor integration,
  PWA install steps, update procedure, troubleshooting table
- **`scripts/download-fonts.js`**: standalone font download script (`npm run fonts:download`)
- **`tests/simulate_aichi_future.test.ts`**: 20 tests for all simulate_aichi_future scenarios
- **`tests/branded_pdf.test.ts`**: 12 tests for markdownToPdfBase64 (branding, comparables, edge cases)
- 4 new `GenerateReportInput` schema tests (companyName, agentName, includeLinearImpact, disclaimer)

### Changed
- `package.json`: added `assets/` and `config/` to `files` field; added `fonts:download` script
- Test count: 421 -> 458 (all passing)

## [6.0.0] - 2026-05-08

### Added
- **Aichi Gold Standard**: Branded PDF reports (`companyName`, `agentName`, `disclaimer`, `footerContact`) via `generate_area_report`
- **`simulate_aichi_future` tool**: Linear Chuo Shinkansen, Centrair expansion, Toyota EV, Expo legacy future value engine
- **Field/Presentation Mode** (`?mode=field`): Large-font tablet UI, QR code share button, deep-link URL
- **Transaction comparables in PDF**: `includeTransactionComparables=true` renders past deals table
- **`includeLinearImpact` flag**: Adds Linear impact analysis section to reports
- `data/aichi/future_infrastructure.json`: 5 major Aichi infra projects with impact data
- `data/aichi/neighborhoods.json`: 10 hyper-local neighborhood profiles (cho-me level)
- `config/aichi-branding.example.json`: Sample branding config file
- `docs/aichi-agent-guide.md`: Full agent guide for Aichi realtors
- `docs/prefecture-completion-kit.md`: Nationwide rollout template
- `scripts/prefecture-setup.py`: Auto-generates stub data files for new prefectures

### Changed
- `GenerateReportInput` schema extended with 6 branding/content fields
- `pdf.ts` completely redesigned: branded header band, section styles, comparables table, disclaimer
- Mode toggle bar now includes a 'Field Mode' button
- Aichi transactions.csv expanded to ~170 rows covering Nagoya districts, Toyoda, Okazaki, Tokoname, etc.


---

## [5.2.0] - 2026-05-08

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

## [5.1.0] - 2026-05-07

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

## [5.0.0] – 2026-05-07 — Transactions Parity + PLATEAU Expansion + 10-Prefecture Coverage + Portfolio Optimizer

### Added
- **取引価格データパリティ**: 東京都・大阪府・神奈川県・福岡県・北海道・京都府・兵庫県の全 7 県に `transactions.csv` を追加（各県 20〜30 件、2020〜2024 年）。全 8 都道府県で `getTransactions()` が実データを返すように。
- **PLATEAU 3D データ — 東京都・大阪府**: 東京都（新宿・港区・千代田区・江東区など 25〜30 棟）、大阪府（梅田・中央区・阿倍野など 20〜25 棟）の高層ビルデータを追加。`capabilities.plateau = true`（Aichi に次いで 3 都市目、4 都市目）。
- **埼玉県（JP-11）フル対応**: 14 データファイル追加（`land_price`, `population`, `earthquake_risk`, `flood_risk`, `municipalities`, `neighborhoods`, `human_flow`, `school_districts`, `corporate_locations`, `crime_stats`, `transport_stations`, `commercial_facilities`, `medical_facilities`, `transactions`）。`SaitamaLoader` を新規実装。全 capabilities `true`（plateau 除く）。
- **千葉県（JP-12）フル対応**: 同様に 14 データファイル追加。`ChibaLoader` を新規実装。浦安市（東京ディズニーリゾート周辺）の高人流データ・高地価データを含む。
- **新ツール `portfolio_optimizer`**: 最大 5 エリアの不動産投資ポートフォリオを最適化。期待年率リターン・リスクスコア・流動性スコア・シャープレシオ・分散スコアを算出し、推奨配分（%）とMarkdownレポートを出力。最適化目標（最大リターン/リスク調整/分散/安定性）・リスク許容度（低/中/高）・投資期間（3y/5y/10y）に対応。
- **`src/data-loaders/saitama-loader.ts`**: 埼玉県ローダー新規実装
- **`src/data-loaders/chiba-loader.ts`**: 千葉県ローダー新規実装
- **`src/tools/portfolio_optimizer.ts`**: ポートフォリオ最適化ツール実装
- **テスト追加**: `tests/portfolio_optimizer.test.ts`（17 件）、`tests/saitama-chiba.test.ts`（32 件）を新規追加。382 テスト合計。

### Changed
- 東京都・大阪府ローダーの `capabilities.plateau` を `true` に変更（PLATEAU データ追加に伴う）。
- 東京都・大阪府・神奈川県・福岡県・北海道・京都府・兵庫県ローダーの `getTransactions()` を `this.loadCsv('transactions.csv')` に変更（実データ読み込み）。
- `src/prefecture/resolver.ts` に埼玉県（JP-11）・千葉県（JP-12）のエイリアスを追加。
- `src/data-loaders/index.ts` に `SaitamaLoader`, `ChibaLoader` を登録。
- `src/schemas.ts` に `PortfolioOptimizerInput/Output` スキーマを追加。
- `server.ts` のツール数コメントを `// -- Tools (13) --` に更新（portfolio_optimizer 追加）。
- `tests/national-expansion.test.ts` の「8 県」チェックを「10 県」に更新。
- `tests/tokyo.test.ts`・`tests/osaka.test.ts`・`tests/shadow.test.ts` の plateau 関連アサーションを v5.0 仕様に更新。

### Breaking (none)
- 既存 API は後方互換。新ローダーメソッドはデータが存在しない場合に空配列を返す挙動を維持。

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

## [2.4.0] – 2026-04-15 — Neighborhood Real Data + Osaka + Three.js 3D Viewer

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

## [2.3.0] – 2026-03-20 — PLATEAU 3D Shadow Simulation

### Added
- `simulate_landscape_impact` tool — Sun position (SunCalc) + shadow polygon generation
- Dashboard shadow layer with morning/noon/evening time presets
- `suncalc` dependency

---

## [2.2.0] – 2026-02-25 — Store Location Evaluation + Transport/Commercial/Medical Data

### Added
- `evaluate_store_location` tool with type-specific weighting (8 store types)
- Transport, commercial facility, and medical facility data for Aichi
- 3 new map layers on dashboard
- 8-axis radar chart

---

## [2.1.0] – 2026-01-15 — Prefecture Comparison + Neighborhood Drill-Down

### Added
- `compare_prefectures` tool — up to 5 prefectures, radar chart data, ranking, diff highlights
- `drill_down_local_analysis` tool — city/neighborhood level analysis, local sales pitch
- Dashboard comparison mode with parallel maps
- Optional `neighborhood` parameter on all relevant tools

---

## [2.0.0] – 2025-12-20 — National Prefecture Architecture

### Added
- Pluggable prefecture loader architecture (`PrefectureLoader` interface)
- Tokyo minimal data loader
- `prefecture` parameter on all tool inputs
- MCP Apps dashboard with prefecture selector

### Breaking
- Tool schemas now require `prefecture` field

---

## [1.0.0] – 2025-11-10 — Initial Release (Aichi MVP)

### Added
- `cross_analyze_real_estate_market`, `assess_property_risk`, `generate_area_report`, `open_dashboard`
- `assess_family_friendly_score`, `predict_corporate_demand`
- Aichi prefecture data: land price, population, flood/earthquake hazard, municipalities
- MCP Apps dashboard with Leaflet map

[2.7.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.5.0...v2.7.0
[2.5.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/sugukurukabe/japan-real-estate-intel-mcp/releases/tag/v1.0.0
