# Growth Playbook — 有名化・採用拡大（90日）

実行チェックリストとコピペ文面のハブ。計画の詳細は Cursor 計画「知名度・採用拡大計画」を参照。

**Registry 名:** `io.github.sugukurukabe/japan-real-estate-intel-mcp`  
**npm:** `@sugukuru/japan-real-estate-intel-mcp@6.15.1`  
**検索確認:** https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel  
**デモ（Freeのみ）:** [free-demo-prompts.md](./free-demo-prompts.md)

---

## Phase 0 — 今週

| # | タスク | ドキュメント / コマンド | 完了 |
|---|--------|-------------------------|------|
| 1 | Smithery 申請 | [external-listing-copy.md](./external-listing-copy.md#smithery-手順) → `.\scripts\open-external-listings.ps1` | [ ] |
| 2 | mcp.so 申請 | 同上 [mcp.so 手順](./external-listing-copy.md#mcpso-手順) | [ ] |
| 3 | Glama 申請 | 同上 [Glama 手順](./external-listing-copy.md#glama-手順) | [ ] |
| 4 | README / checklist 整合 | [listing-checklist.md](./listing-checklist.md) | [x] |
| 5 | awesome-mcp PR フォロー | https://github.com/punkpeye/awesome-mcp-servers/pull/6630 | [ ] |

---

## Phase 1 — 2〜4週間

| # | タスク | ドキュメント |
|---|--------|--------------|
| 6 | 3分デモ動画 | [demo-video-script.md](./demo-video-script.md) · `pnpm run demo:record` |
| 7 | 技術記事（日） | [blog/registry-publish-story-ja.md](./blog/registry-publish-story-ja.md) |
| 8 | 技術記事（英） / Show HN | [blog/registry-publish-story-en.md](./blog/registry-publish-story-en.md) |
| 9 | GitHub Profile README | [github-profile-readme.md](./github-profile-readme.md) |
| 10 | v6.15.1 告知 | [release-announcement-v6.15.1.md](./release-announcement-v6.15.1.md) |

---

## Phase 2 — 1〜2ヶ月

| # | タスク | ドキュメント | 状態 |
|---|--------|--------------|------|
| 11 | 名古屋フォロー配布 | [nagoya-pitch-followup.md](./nagoya-pitch-followup.md) | [ ] |
| 12 | 匿名事例 | [customer-stories.md](./customer-stories.md) | [ ] |
| 13 | OpenAI Apps | [openai-apps-submission.md](./openai-apps-submission.md) | [ ] |
| 14 | Pro 社内デモ | [pro-demo-setup.md](./pro-demo-setup.md) | [x] 手順 |
| 15 | Free 月間上限 | `src/tier-usage.ts` | [x] 実装 |
| 16 | 共演アウトリーチ | [partner-outreach-template.md](./partner-outreach-template.md) | [ ] |

---

## 週次メトリクス

```powershell
npm view @sugukuru/japan-real-estate-intel-mcp version
curl.exe -s "https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel"
# GitHub → Insights → Traffic
```

---

## 関連リンク

- [competitive-positioning.md](./competitive-positioning.md) — 競合・Free/Pro
- [agent-quickstart.md](./agent-quickstart.md) — 不動産業者向け
- [implementation-story.md](./implementation-story.md) — 開発者ストーリー
- [mcp-building-playbook.md](./mcp-building-playbook.md) — MCP 構築ノウハウ
