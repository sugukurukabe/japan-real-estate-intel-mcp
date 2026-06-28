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
- **No Direct HTML Editing**: The frontend resides in `ui-src/index.html`, `ui-src/main.ts`, and `ui-src/styles.css`.
- **Inline Compilation**: When modifying the UI, always run `npm run build` to compile, minify, and inline the resources into `ui/dashboard.html`. Do not edit `ui/dashboard.html` or `ui/dashboard-3d.html` directly.
- **Content Security Policy (CSP)**: If you load external resources (e.g. Leaflet CDN, OpenStreetMap tiles, new CSS fonts), ensure the domain is added to `DASHBOARD_CSP` or `DASHBOARD_3D_CSP` in `src/server.ts`.
- **App spec compliance**: Follow the latest Model Context Protocol Apps UI specification for components.

## 4. Database & External APIs
- **SQL Injection Prevention**: When querying SQLite database using `better-sqlite3`, always use parameterized queries with `?` or named parameters (e.g. `db.prepare('SELECT * FROM ... WHERE id = ?').all(id)`). Never interpolate strings directly into SQL queries.
- **Data Loaders**: Load local data through loaders in `src/data-loaders/` or `src/data/loader.js`.
- **Attribution**: Respect copyright and attribution terms. Keep `src/data/attribution.js` up to date if you ingest new datasets.

## 5. Test Requirements
- **Vitest Framework**: Use Vitest for all unit and integration tests. Test files must reside in `tests/`.
- **Mocking**: Mock external API calls (e.g. Google Cloud BigQuery, Gemini API) in tests to ensure they are fast, offline-capable, and deterministic.
- **Mandatory Validation**: Run `npm run lint` and `npm run test` before declaring a task complete.
