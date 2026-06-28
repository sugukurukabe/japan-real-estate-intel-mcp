# MCP App Widgets UI Audit Report

This document audits the two MCP App widgets in the `japan-real-estate-intel-mcp` repository before redesigning them.

---

## 1. 2D Real Estate Dashboard (`ui://japan-real-estate-intel/dashboard`)

### Audit Criteria

*   **(a) MIME Type**: `text/html;profile=mcp-app` (declared as `RESOURCE_MIME_TYPE` from `@modelcontextprotocol/ext-apps/server` and resolved inside resource read callback).
*   **(b) `_meta.ui.resourceUri` Format**:
    *   **Nested**: Yes, `_meta: { ui: { resourceUri: DASHBOARD_URI } }` is returned dynamically by both `open_dashboard` and `quick_visual_summary` tool handlers.
    *   **Flat**: Yes, also returns the legacy flat key `_meta: { 'ui/resourceUri': DASHBOARD_URI }` for backward compatibility in tool definitions.
*   **(c) `_meta.ui.csp` Configuration**:
    *   **Declared**: Yes, on both the resource registration and the returned content.
    *   **Content**:
        ```json
        {
          "resourceDomains": ["https://unpkg.com", "https://cdnjs.cloudflare.com", "https://*.basemaps.cartocdn.com"],
          "connectDomains": ["https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.basemaps.cartocdn.com"]
        }
        ```
    *   **Missing Whitelists**: `https://api.qrserver.com` is used in the sharing QR code generator (`main.ts` line 2274) but is **missing** from `resourceDomains`. This causes the sharing QR code to be blocked in host environments with strict CSP enforcement.
*   **(d) postMessage Protocol Handling**:
    *   Implemented in `ui/mcp-bridge.js`.
    *   Successfully filters out non-JSON-RPC messages:
        ```javascript
        window.addEventListener('message', function (event) {
          if (!event.data || typeof event.data !== 'object') return;
          var msg = event.data;
          if (msg.jsonrpc !== '2.0') return; // Early exit / silent ignore
          ...
        ```
    *   This prevents iframe crashes from Claude's authentication message injections.
*   **(e) Dark Mode Support**:
    *   **Status**: Hardcoded to a dark theme layout (e.g. background `#0f1419`).
    *   **Host Dynamic Selector**: Does not support host-provided theme classes or `[data-theme="light"]` / `[data-theme="dark"]` dynamic selector switching.
*   **(f) Text Fallback Presence**:
    *   Yes, both tools return a text-based/markdown report summary alongside the widget metadata.
*   **(g) Key UX Issues**:
    *   **Not Responsive**: The Left and Right sidebars have fixed widths (`280px`). In narrow viewports (e.g., `800x600`), the center map squeezes to a thin strip, and Leaflet controls overlay improperly or overflow.
    *   **Excessive Branding**: The header includes a prominent "日本不動産インテリジェンス" brand title and subtitle. Host containers already display the app name/logo, so this duplicate branding should be removed or made subtle.
    *   **Crowded Actions**: Several widgets have many buttons and complex inputs (e.g. cashflow mini table, multiple action triggers on a single card), violating the "max 2 actions per card/focus area" rule.

### Screenshots

![2D Dashboard Initial Load](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/initial_dashboard_load_1782573420261.png)

![2D Dashboard Modal Closed](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_modal_closed_1782573431642.png)

![2D Dashboard Resized (800x600)](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_resized_800_600_1782573461984.png)

---

## 2. 3D Building Shadow Simulation (`ui://japan-real-estate-intel/dashboard-3d`)

### Audit Criteria

*   **(a) MIME Type**: `text/html;profile=mcp-app` (via `RESOURCE_MIME_TYPE`).
*   **(b) `_meta.ui.resourceUri` Format**:
    *   **Nested**: Yes, returned dynamically on tool invocation and resource declarations.
*   **(c) `_meta.ui.csp` Configuration**:
    *   **Declared**: Yes.
    *   **Content**:
        ```json
        {
          "resourceDomains": ["https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
          "connectDomains": ["https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org"]
        }
        ```
*   **(d) postMessage Protocol Handling**:
    *   Uses the same `ui/mcp-bridge.js` injected at body end. Filters non-JSON-RPC messages correctly.
*   **(e) Dark Mode Support**:
    *   Hardcoded dark layout (`--bg: #0f0f23`). No support for dynamic `[data-theme]` changes.
*   **(f) Text Fallback Presence**:
    *   Yes, returns text overview on the tool invocation level.
*   **(g) Key UX Issues**:
    *   **Fixed Layout Collision**: Four independent floating panels are placed in fixed absolute positions (top-left, top-right, bottom-left, bottom-right). On mobile screens or narrow iframe widths, these panels overlap with each other, completely obscuring the 3D canvas viewport.
    *   **Static Assets Navigation**: The "← 2D ダッシュボードへ" link is a standard `<a>` pointing directly to `dashboard.html`. Direct routing transitions inside sandboxed iframes can fail or trigger security alerts in some hosts.

### Screenshots

![3D Dashboard Initial Load (Noon)](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_3d_initial_1782573517249.png)

![3D Dashboard Morning Simulation](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_3d_morning_1782573796855.png)

![3D Dashboard Evening Simulation](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_3d_evening_1782573804909.png)
