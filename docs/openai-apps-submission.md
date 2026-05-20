# OpenAI Apps Directory — 申請ガイド

**前提:** OpenAI 組織の本人確認が完了していること。

---

## 1. 組織認証

1. https://platform.openai.com/settings/organization/general
2. **Verify organization** を完了
3. 審査完了まで待機（数日かかる場合あり）

---

## 2. アプリ登録

1. https://platform.openai.com/apps-manage
2. **Create app** / **Submit MCP app**
3. 以下を [external-listing-copy.md](./external-listing-copy.md) からコピー

| フィールド | 値 |
|------------|-----|
| App name | Japan Real Estate Intel |
| Short description | Cross-analyze Japanese real estate across 10 prefectures via MCP. |
| MCP server URL | `https://realestate-mcp.jp/mcp` |
| Privacy policy | https://realestate-mcp.jp/privacy-policy.html |
| Terms of service | https://realestate-mcp.jp/terms.html |
| Logo | `assets/logo-512.png`（512×512） |
| Screenshots | `docs/screenshots/` 内 5 枚 |

---

## 3. テストプロンプト

[test-prompts.md](./test-prompts.md) から **Free で動く** 3 本を選ぶ:

1. `discover_opportunities`（愛知・investment）
2. `get_future_timeline`（ward=中区）
3. `detect_arbitrage_signals`（aichi）

**注意:** PDF・`generate_area_report` は Pro。審査用プロンプトに含めない。

---

## 4. CSP / ドメイン（ダッシュボード連携時）

OpenAI が要求する場合:

- `tile.openstreetmap.org`
- `unpkg.com`
- `cdnjs.cloudflare.com`
- `basemaps.cartocdn.com`
- `realestate-mcp.jp`

---

## 5. 申請後

- [listing-checklist.md](./listing-checklist.md) の OpenAI セクションに `[x]`
- README に「Available on ChatGPT」バッジ（承認後）

---

## 関連

- [chatgpt-integration.md](./chatgpt-integration.md)
- [growth-playbook.md](./growth-playbook.md)
