---
name: ui-widget-development
description: Instructions for modifying, testing, and building the interactive UI dashboard and 3D visualization widgets.
---
# UI Widget Development Skill

Use this skill when modifying the user interface widgets in the `ui-src/` directory.

## Workflow

1. **Locate Source Files**:
   - `ui-src/index.html`: Base layout, HTML skeleton.
   - `ui-src/main.ts`: Application logic, Leaflet map renders, Plateu 3D integration, API responses rendering.
   - `ui-src/styles.css`: Component styles, charts, dashboard layout.

2. **Make Changes**:
   - Follow standard modern CSS and TypeScript practices.
   - For UI elements, use premium dark themes, smooth transitions, and charts.

3. **Build UI**:
   - Run `npm run build` or `node scripts/build-ui.js`.
   - This script generates `ui/dashboard.js`, `ui/dashboard.css`, and inlines them into `ui/dashboard.html`.

4. **Verify CSP and External Resources**:
   - Check if you loaded any new JS library CDN or external assets. If so, update the Content Security Policy (CSP) in `src/server.ts` under `DASHBOARD_CSP` / `DASHBOARD_3D_CSP`.

5. **Testing**:
   - Run Playwright tests or inspect the compiled `ui/dashboard.html` in browser.
