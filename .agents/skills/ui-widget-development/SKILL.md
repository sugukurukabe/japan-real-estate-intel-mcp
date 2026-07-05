---
name: ui-widget-development
description: Instructions for modifying, testing, and building the interactive UI dashboard, 3D visualization, and per-tool result widgets.
---
# UI Widget Development Skill

Use this skill when modifying the user interface in the `ui-src/` directory. As of v7 the UI
is a **React + Vite + TypeScript** app compiled to a single MCP Apps resource
(`ui/dashboard.html`) that embeds the official `@modelcontextprotocol/ext-apps` SDK. There is
no separate 3D page anymore — 2D map, 3D PLATEAU viewer, and tool-result widgets are all part
of one unified app with client-side view switching.

## Architecture overview

- `ui-src/src/main.tsx` — React entry point, mounts `AppShell`.
- `ui-src/src/app/AppShell.tsx` — root component. Connects to the MCP host via `useApp()`
  (official SDK), listens for `tool-input` / `tool-result` / `host-context-changed`
  notifications, and routes between `MapView` (2D) and `PlateauView` (3D). Renders
  `WidgetOverlay` on top when a tool result has a registered widget config.
- `ui-src/src/bridge/legacyBridgeShim.ts` — wraps the official `App` instance to expose the
  legacy `window.__mcpBridge` API (`callServerTool`, `updateContext`, `sendMessage`) that the
  ported imperative dashboard code still calls. Do not remove this unless `dashboard-core.ts`
  is fully rewritten to use `useApp()` directly.
- `ui-src/src/core/dashboard-core.ts` — the original 2D dashboard logic (formerly
  `ui-src/main.ts`), kept as an **imperative module** for risk/scope reasons. It exports
  `initDashboardCore()`, called once from `MapView.tsx` inside a `useEffect`. Prefer editing
  this file directly for 2D map/filter/insight-panel changes rather than rewriting it in JSX.
- `ui-src/src/core/plateau-scene.ts` — Three.js scene class (imperative, same rationale as
  above), driven by `ui-src/src/views/PlateauView.tsx` which owns the React-based overlay UI
  (time controls, stats, legend, tooltip) and lifecycle.
- `ui-src/src/styles/` — `dashboard.css` (2D), `plateau.css` (3D).
- `ui-src/src/widgets/` — the extensible tool-result widget system (see below).

## Adding a new tool-result widget

The widget registry maps an MCP tool name to a declarative `WidgetConfig` rendered by the
generic `AutoWidget` component — no per-tool React component needed for typical KPI/list
result cards.

1. Create `ui-src/src/widgets/configs/{toolName}.ts` exporting a `WidgetConfig` (see
   `ui-src/src/widgets/types.ts` for the shape: `title`, `icon`, `summaryPath`, `kpis`,
   `lists`). Use `getByPath` dot-paths into the tool's `structuredContent` shape (check the
   Zod output schema in `src/schemas.ts` for the exact field names/paths).
2. Register it in `ui-src/src/widgets/registry.ts` by importing it and adding it to the map
   keyed by the exact tool name.
3. If a KPI needs custom coloring/tone (good/warning/bad), set the `tone` field per KPI
   pointing at a thresholds function, following the pattern in existing configs (e.g.
   `compositeValueScore.ts`).
4. For anything the declarative config can't express (charts, custom layout), write a
   dedicated `.tsx` component instead and branch on it in `WidgetOverlay.tsx`.

`AppShell` already dispatches every `tool-result` notification through the registry — no
server-side changes are required to add a widget for a tool that already has
`_meta.ui.resourceUri` pointing at the dashboard.

## Making changes

- Follow standard modern React/TypeScript/CSS practices. `ui-src/tsconfig.json` type-checks
  the whole UI — keep it clean (`npm run lint:ui`).
- For new UI elements, match the existing dark/glassmorphism theme and use
  `useDocumentTheme()` / `useHostStyleVariables()` (from `@modelcontextprotocol/ext-apps/react`)
  rather than hand-rolled `prefers-color-scheme` checks where possible.
- Never add a `<script src="https://cdn...">` tag or dynamic CDN import. All runtime
  dependencies (Leaflet, Three.js, React, etc.) must be npm packages bundled by Vite so the
  final resource stays a single, offline-capable HTML file with a minimal CSP.

## Build UI

- `npm run build` (full project) or `npm run build:ui` (UI only) — runs
  `scripts/build-ui.js`, which:
  1. Regenerates `ui-src/generated-prefectures.json` from `data/` via
     `scripts/generate-ui-prefecture-data.ts`.
  2. Runs `vite build` (config: `ui-src/vite.config.ts`) with `vite-plugin-singlefile`, which
     inlines all JS/CSS into one file.
  3. Renames Vite's output to `ui/dashboard.html` and removes the now-empty assets directory.
- `npm run dev:ui` — Vite dev server for fast iteration (note: the MCP bridge won't have a
  real host to talk to outside an actual MCP Apps iframe; use the legacy shim's
  `connected === false` fallback paths, or the smoke test below, to verify standalone).

## Verify CSP and external resources

- If you add a new external domain (e.g. a new tile provider or API called from the browser),
  update `DASHBOARD_CSP` (`resourceDomains` / `connectDomains`) in `src/server.ts`. There is
  only **one** CSP object now — the old `DASHBOARD_3D_CSP` was removed when the 3D viewer was
  merged into the unified app.
- Do not reintroduce CDN domains for bundled libraries (Leaflet, Three.js, React) — they must
  stay in the JS bundle, not the CSP allowlist.

## Testing

1. `npm run lint:ui` — type-checks `ui-src/`.
2. `npm test` — runs `tests/mcp_apps.test.ts` (resource/tool metadata, CSP, embedded bridge
   strings) plus the rest of the suite.
3. `npm run verify:ui` — real headless-Chromium smoke test
   (`scripts/verify-dashboard-smoke.mjs`): boots a static server over `ui/`, loads
   `dashboard.html`, and asserts React mounts, the Leaflet map renders, the 3D switch button
   works and renders a Three.js canvas, the legacy bridge shim installs, and there are zero
   console/page errors. Run this after any UI change before considering it done.
4. `npm run screenshots` — regenerates the marketing screenshots in `docs/screenshots/`
   (requires `npx playwright install chromium` once).
5. Manually verify in Claude (Web/Desktop) and ChatGPT developer mode when possible — these
   are the two priority MCP Apps hosts for this project.
