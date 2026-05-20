# 33ツールの日本不動産 MCP を MCP Registry に載せるまで — ハマった3点

**対象読者:** MCP / TypeScript 開発者  
**リポジトリ:** https://github.com/sugukurukabe/japan-real-estate-intel-mcp  
**Registry:** `io.github.sugukurukabe/japan-real-estate-intel-mcp`（v6.15.1）

---

## なぜ Registry か

npm に `npx` するだけでは、Claude Desktop や Cursor の「公式ディスカバリ」には載りにくい。MCP Registry にメタデータを登録すると、**検索・インストール導線**が一本化される。

---

## ハマりどころ 1 — `server.json` スキーマ（2025-12-11）

旧フォーマットでは 422 になる。

| 旧 | 新 |
|----|-----|
| `version_detail.version` | トップレベル `"version": "6.15.1"` |
| `packages[].registry_name` | `registryType: "npm"` |
| `packages[].name` | `identifier: "@sugukuru/..."` |
| `remotes[].transport_type` | `type: "streamable-http"` |
| 説明 300字 | **100字以内** |

---

## ハマりどころ 2 — npm `mcpName` の一致

GitHub 認証で publish する場合、npm パッケージの `mcpName` が Registry の `name` と一致している必要がある。

```
Expected: io.github.sugukurukabe/japan-real-estate-intel-mcp
Got:      jp.realestate-mcp/server   ← 6.15.0 のまま
```

**対処:** `package.json` の `mcpName` を更新し、**6.15.1 を再 publish**。

---

## ハマりどころ 3 — JWT 期限切れ

`mcp-publisher publish` で 401 `token is expired` → `mcp-publisher login github` をやり直す。

---

## 成功したコマンド（Windows）

```powershell
# mcp-publisher.exe を展開後
.\mcp-publisher.exe login github
.\mcp-publisher.exe publish --file server.json
```

確認:

```
https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel
```

※ ブラウザで `/servers/名前` を開くと 404 になることがある。**検索 API** で確認する。

---

## 次のステップ

- Smithery / mcp.so / Glama 掲載 — [growth-playbook.md](../growth-playbook.md)
- 実装ストーリー全文 — [implementation-story.md](../implementation-story.md)

**タグ案:** `#MCP` `#TypeScript` `#不動産` `#OSS`
