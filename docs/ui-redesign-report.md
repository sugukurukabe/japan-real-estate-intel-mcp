# MCP App Widgets UI Redesign Report

This document reports the verification results for the redesigned 2D and 3D MCP App widgets in the `japan-real-estate-intel-mcp` repository.

---

## 1. Summary of Redesign Accomplishments

1.  **Dynamic Theme Support**:
    *   Added support for document-level themes (`[data-theme="dark"]` / `[data-theme="light"]`) via custom CSS properties in both `dashboard.html` and `dashboard-3d.html`.
    *   Implemented automatic map tile layer switching (Dark basemaps vs. Light Positron/Voyager basemaps) using a MutationObserver inside the 2D dashboard.
    *   Updated the WebGL 3D simulation to dynamically change scene backgrounds, fog colors, building outline grids, and ground styles in response to theme changes.
2.  **Mobile-Responsive Architecture**:
    *   **2D Dashboard**: Replaced the vertical-stack layout (which squished the map on screens <= 768px) with a fully absolute overlay drawer layout. The Left Filter sidebar and Right Insight sidebar slide in smoothly over the map when toggled.
    *   Added floating action buttons (`🔍 フィルター` and `📊 インサイト`) at the bottom of the viewport on mobile screens to toggle the draw panels.
    *   Integrated a blur backdrop overlay to close sidebars on click.
    *   **3D Dashboard**: Stretched control panels and legends horizontally across mobile viewports, stacking them top-to-bottom to prevent overlaps and keep the WebGL viewport visible.
3.  **Strict CSP Whitelisting**:
    *   Added `https://api.qrserver.com` to the allowed domains inside `src/server.ts` (`DASHBOARD_CSP.resourceDomains`) and Express server `src/http.ts` `imgSrc` CSP headers. Sharing QR codes are now fully allowed.
4.  **No Self-Branding**:
    *   Optimized header styles inside the iframe container: when embedded in a host iframe, the top header (branding text and logo titles) is hidden automatically via body `.in-iframe` class detection to make it feel native to the client interface.

---

## 2. Specification Compliance Self-Check

| Criteria | Target Requirement | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **MIME Type** | `text/html;profile=mcp-app` | **PASSED** | Declared in `RESOURCE_MIME_TYPE` metadata. Checked by `vitest` tests. |
| **Resource URI** | Nested `_meta.ui.resourceUri` | **PASSED** | Nested inside `_meta.ui` on both tool output payloads and resource records. |
| **CSP Configuration** | Declared `_meta.ui.csp` with minimal whitelist | **PASSED** | Connect and Resource domains declared explicitly. Added `api.qrserver.com`. |
| **postMessage** | Ignore non-JSON-RPC messages | **PASSED** | Handled in `mcp-bridge.js`. Ignores non-2.0 JSON-RPC messages. |
| **Themes** | Dynamic `[data-theme]` selectors | **PASSED** | Style sheets and WebGL renderers listen to document data-theme attribute modifications. |
| **Text Fallback** | Fallback text included in tools | **PASSED** | All tools return detailed markdown or text-based fallbacks. |
| **Responsiveness** | Collapsible drawer layout | **PASSED** | Overlay sidebars slide on mobile. Legends shifted up. |
| **Bundle Sizes** | Under 512KB | **PASSED** | 2D: ~226KB, 3D: ~22KB. |

---

## 3. Redesign Visual Verification Screenshots

### 2D Dashboard (Dark vs. Light Themes)

| Dark Mode (Default) | Light Mode |
| :---: | :---: |
| ![Dark Dashboard](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_dark_1782574125796.png) | ![Light Dashboard](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_light_1782574144584.png) |

### 2D Dashboard Mobile Drawers

| Filter Drawer Open | Insight Drawer Open |
| :---: | :---: |
| ![Mobile Filters](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/mobile_layout_fixed_filters_open_1782574981455.png) | ![Mobile Insights](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/mobile_insights_open_1782574405767.png) |

### 3D Shadow Simulation (Light Theme WebGL)

![3D Light Theme](/Users/kabe/.gemini/antigravity-ide/brain/e9219109-d163-4791-a5c8-eb01dc8b5445/dashboard_3d_light_1782574429659.png)
