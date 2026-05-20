# 外部掲載用コピー（コピペ集）

## 推奨順序（awesome-mcp PR 対策）

1. **Glama** — PR [#6630](https://github.com/punkpeye/awesome-mcp-servers/pull/6630) の bot が Glama 掲載を要求。先に完了する。
2. **Smithery** / **mcp.so** — 認知導線
3. **awesome-mcp** — Glama 掲載後、PR 説明文にスコアバッジを追記（下記）

掲載後の Glama バッジ（PR / README 用）:

```markdown
[![sugukurukabe/japan-real-estate-intel-mcp MCP server](https://glama.ai/mcp/servers/sugukurukabe/japan-real-estate-intel-mcp/badges/score.svg)](https://glama.ai/mcp/servers/sugukurukabe/japan-real-estate-intel-mcp)
```

---

統一文言（100字以内推奨）:

> Cross-analyze Japanese real estate across 10 prefectures: land price, risk, foot traffic, Nagoya workflows, renovation, PDF, contracts.

日本語:

> 10都道府県の地価・災害・人流・教育をクロス分析。名古屋町丁目・リノベ利回り・ブランドPDF・契約支援まで MCP 一連。

---

## Smithery 手順

**要ログイン（ブラウザ）** — リポジトリ側から自動申請は不可。

1. https://smithery.ai → **Login** → GitHub (`sugukurukabe`)
2. **Publish** メニュー → **Publish MCP Server**（または https://smithery.ai/docs に従い `npx -y @smithery/cli publish`）
3. 入力:

| 項目 | 値 |
|------|-----|
| Package | `@sugukuru/japan-real-estate-intel-mcp` |
| Repository | `https://github.com/sugukurukabe/japan-real-estate-intel-mcp` |
| Remote URL | `https://realestate-mcp.jp/mcp` |
| Homepage | `https://realestate-mcp.jp/dashboard.html` |
| Tags | `real-estate`, `japan`, `land-price`, `investment`, `mcp`, `nagoya`, `aichi` |
| Description | 統一文言（英）+ Remote URL |

4. Logo: upload `assets/logo-512.png` if requested  
5. Screenshot: `docs/screenshots/dashboard-overview.png`

---

## mcp.so 手順

1. https://mcp.so/submit
2. 入力:

| 項目 | 値 |
|------|-----|
| Repository URL | `https://github.com/sugukurukabe/japan-real-estate-intel-mcp` |
| Name | `Japan Real Estate Intel` |
| Description | Cross-analyze Japanese real estate across 10 prefectures via MCP — land price, risk, foot traffic, Nagoya workflows, PDF reports. |
| Homepage | `https://realestate-mcp.jp/dashboard.html` |
| npm | `@sugukuru/japan-real-estate-intel-mcp` |

---

## Glama 手順

**要ログイン** — awesome-mcp マージ条件のため最優先。

1. https://glama.ai/mcp/servers → **Submit** / **Add**
2. Repository: `https://github.com/sugukurukabe/japan-real-estate-intel-mcp`
3. Category: **Real Estate** or **Data**
4. Description: 統一文言（英）
5. **Dockerfile:** リポジトリの `Dockerfile.glama` をアップロード（stdio / `node dist/index.js`）。本番 HTTP 用の `Dockerfile` とは別。
6. チェック通過後、上記 **Glama バッジ** を awesome-mcp PR #6630 に追記

| 画面 | 添付ファイル |
|------|----------------|
| Logo | `assets/logo-512.png` |
| Screenshot | `docs/screenshots/dashboard-overview.png` |
| 比較・3D | `docs/screenshots/comparison-mode.png`, `3d-view.png` |

**よくある失敗:** HTTP の `Dockerfile` だけだと introspection 不合格 → `Dockerfile.glama` を使う。

---

## awesome-mcp-servers PR 用

**PR:** https://github.com/punkpeye/awesome-mcp-servers/pull/6630

```markdown
- [sugukurukabe/japan-real-estate-intel-mcp](https://github.com/sugukurukabe/japan-real-estate-intel-mcp) 📇 ☁️ 🏠 🍎 🪟 🐧 - Cross-analyze land prices, disaster risk, population, foot traffic, and education across 10 Japanese prefectures. Nagoya chocho profiles, renovation yield, branded PDF reports, contract support, and interactive dashboard. npm: `@sugukuru/japan-real-estate-intel-mcp`
```

**README バッジ（マージ後）:**

```markdown
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-listed-blueviolet)](https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel)
[![awesome-mcp-servers](https://img.shields.io/badge/listed-awesome--mcp--servers-green)](https://github.com/punkpeye/awesome-mcp-servers)
```

---

## OpenAI Apps Directory

See [openai-apps-submission.md](./openai-apps-submission.md).

| 項目 | 値 |
|------|-----|
| App name | Japan Real Estate Intel |
| Logo | `assets/logo-512.png` |
| MCP URL | `https://realestate-mcp.jp/mcp` |
| Privacy | https://realestate-mcp.jp/privacy-policy.html |
| Terms | https://realestate-mcp.jp/terms.html |
| Screenshots | `docs/screenshots/*.png` |
| Test prompts | [test-prompts.md](./test-prompts.md) |

---

## Registry（掲載済み）

| 項目 | 値 |
|------|-----|
| Name | `io.github.sugukurukabe/japan-real-estate-intel-mcp` |
| Search | https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel |
| Install | `npx @sugukuru/japan-real-estate-intel-mcp` |

---

## 関連

- [listing-checklist.md](./listing-checklist.md)
- [growth-playbook.md](./growth-playbook.md)
- [registry-submission.md](./registry-submission.md)
