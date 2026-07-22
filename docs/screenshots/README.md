# Screenshots

Place screenshots and demo GIFs here for README and directory submissions.

## Required for OpenAI Apps Directory

| File | Description | Size |
|------|-------------|------|
| `dashboard-overview.png` | Main dashboard with map and panels | 1280x800 recommended |
| `investment-mode.png` | 不動産投資 (investment) mode — area drilldown with investment score | 1280x800 |
| `cashflow-mode.png` | 融資CF (leveraged cashflow) mode — loan/rent/vacancy 10-year simulation | 1280x800 |
| `comparison-mode.png` | Prefecture comparison with radar chart | 1280x800 |
| `3d-view.png` | PLATEAU 3D building visualization | 1280x800 |
| `demo-preview.webm` | ~45s dashboard demo (`pnpm run demo:record`) | 1280x800 |

## How to Capture

**Automated (recommended):**

```bash
pnpm run build:ui
pnpm run screenshots
```

Uses Playwright at 1280×800 against the local `ui/` build (comparison mode, cashflow panel, 3D view).

**Manual:**

1. Open `https://realestate-mcp.jp/dashboard.html`
2. Use browser DevTools to set viewport to 1280x800
3. Capture with `Cmd+Shift+4` (macOS) or `Win+Shift+S` (Windows)
4. Save as PNG in this directory

## For README

Add to README with relative paths:

```markdown
![Dashboard Overview](docs/screenshots/dashboard-overview.png)
```
