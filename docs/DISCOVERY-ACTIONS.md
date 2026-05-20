# 認知拡大 — あなたが15分でやること（高優先）

リポジトリ側の準備は完了。以下は **ログインが必要** な手動作業です。

## 今すぐ（15分）

```powershell
.\scripts\open-external-listings.ps1
```

| # | サイト | 作業 | コピー元 |
|---|--------|------|----------|
| 1 | [Smithery](https://smithery.ai) | Login → Publish | [external-listing-copy.md](./external-listing-copy.md#smithery-手順) |
| 2 | [mcp.so/submit](https://mcp.so/submit) | フォーム送信 | 同上 |
| 3 | [Glama](https://glama.ai/mcp/servers) | Submit repo | 同上 |

完了したら [listing-checklist.md](./listing-checklist.md) の `[ ]` を `[x]` に。

## 告知（30分）

| # | 作業 | ファイル |
|---|------|----------|
| 4 | X / LinkedIn に投稿 | [release-announcement-v6.15.1.md](./release-announcement-v6.15.1.md) |
| 5 | 技術記事（note / Zenn / Dev.to） | [blog/registry-publish-story-ja.md](./blog/registry-publish-story-ja.md) または [EN](./blog/registry-publish-story-en.md) |
| 6 | Show HN（英記事の同日） | 同上 EN |
| 7 | GitHub Profile README | [github-profile-readme.md](./github-profile-readme.md) |

## プレゼン（名古屋）

| # | 作業 | ファイル |
|---|------|----------|
| 8 | **Free 3本だけ**デモ | [free-demo-prompts.md](./free-demo-prompts.md) |
| 9 | フォローPDF配布 | [nagoya-pitch-followup.md](./nagoya-pitch-followup.md) |

## Phase 2（信頼・Proデモ）

| # | 作業 | ファイル |
|---|------|----------|
| 10 | 匿名事例の許可メール | [customer-stories.md](./customer-stories.md) |
| 11 | Pro 社内デモ | [pro-demo-setup.md](./pro-demo-setup.md) |
| 12 | MLIT 系 MCP 作者へ共演メール | [partner-outreach-template.md](./partner-outreach-template.md) |
| 13 | OpenAI Apps（組織認証後） | [openai-apps-submission.md](./openai-apps-submission.md) |

## 済み（リポジトリ側）

- MCP Registry 掲載（`io.github.sugukurukabe/japan-real-estate-intel-mcp`）
- awesome-mcp PR [#6630](https://github.com/punkpeye/awesome-mcp-servers/pull/6630) + フォローコメント
- README「Try in 60 seconds」+ Free デモガード + データ鮮度表
- npm 6.15.1
- Free 月間ツール上限（`src/tier-usage.ts`、既定 50 回/月 UTC）
