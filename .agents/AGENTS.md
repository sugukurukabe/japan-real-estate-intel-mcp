# Japan Real Estate Intel MCP - Development Rules

## 1. Code Quality & Linting
- **TypeScript First**: Do not use raw JavaScript files in `src/`. Always use TypeScript.
- **Strict Linting**: Strictly adhere to ESLint settings.
  - Never use `any` unless absolutely necessary (annotate with `@ts-expect-error` or `@ts-ignore` with a clear explanation if it's unavoidable, or use `unknown`).
  - Always use type imports: `import type { Foo } from './bar.js'`.
  - Use `const` over `let` and `var`. `var` is strictly forbidden.
- **Path Resolution**: All imports of local TS files must end in `.js` (due to ESM compatibility in Node.js, e.g., `import { crossAnalyze } from './tools/cross_analyze_real_estate_market.js'`).
- **No Console Logs**: Use the project's pino-based `logger` (imported from `../logger.js` or `./logger.js`) in application/tool code. Do not use `console.log` except in test files or script utilities.

## 2. MCP Tool Architecture
- **Schema Validation**: Every tool's input parameters and output structure must be declared in `src/schemas.ts` using `zod`.
- **Registration**: All tools must be registered in `src/server.ts`.
- **Safety & Error Handling**: Tool executions must wrap their core logic inside `withErrorHandling(toolName, prefecture, async () => { ... })` to ensure consistent logging, quota checking, and error capturing.
- **Tiers & Quotas**: Respect the tool access control tiers (`free`, `pro`, `enterprise`) defined in `src/tiers.ts`. Verify if the tool requires pro/enterprise settings before implementation.

## 3. UI Dashboard & Widgets
- **React + Vite, single bundle**: The frontend is a React + TypeScript app in `ui-src/src/`
  (see `.agents/skills/ui-widget-development/SKILL.md`), built with Vite into one MCP Apps
  resource: `ui/dashboard.html`. There is no separate 3D page — 2D map (`MapView`), 3D PLATEAU
  viewer (`PlateauView`), and per-tool result widgets (`ui-src/src/widgets/`) are all views of
  one unified app.
- **No Direct HTML/dist Editing**: Never edit `ui/dashboard.html` directly — it's a generated
  build artifact. Edit files under `ui-src/src/` and run `npm run build:ui`.
- **Official MCP Apps SDK**: The UI talks to the host via `@modelcontextprotocol/ext-apps`
  (`useApp()` / the `App` class), not a hand-rolled bridge. The legacy `window.__mcpBridge`
  API is preserved only as a compatibility shim (`ui-src/src/bridge/legacyBridgeShim.ts`) for
  the ported imperative 2D/3D code — new code should prefer `useApp()` directly.
- **No CDN dependencies**: Leaflet, Three.js, React, etc. must be npm dependencies bundled by
  Vite (`vite-plugin-singlefile`), not loaded from a CDN `<script>` tag.
- **Content Security Policy (CSP)**: If you call a new external domain from the browser (e.g.
  a new map tile provider or API), add it to the single `DASHBOARD_CSP` object in
  `src/server.ts` (`resourceDomains` / `connectDomains`).
- **App spec compliance**: Follow the latest Model Context Protocol Apps UI specification for
  components.

## 4. Database & External APIs
- **SQL Injection Prevention**: When querying SQLite database using `better-sqlite3`, always use parameterized queries with `?` or named parameters (e.g. `db.prepare('SELECT * FROM ... WHERE id = ?').all(id)`). Never interpolate strings directly into SQL queries.
- **Data Loaders**: Load local data through loaders in `src/data-loaders/` or `src/data/loader.js`.
- **Attribution**: Respect copyright and attribution terms. Keep `src/data/attribution.js` up to date if you ingest new datasets.

## 5. Test Requirements
- **Vitest Framework**: Use Vitest for all unit and integration tests. Test files must reside in `tests/`.
- **Mocking**: Mock external API calls (e.g. Google Cloud BigQuery, Gemini API) in tests to ensure they are fast, offline-capable, and deterministic.
- **Mandatory Validation**: Run `npm run lint` and `npm run test` before declaring a task complete.
