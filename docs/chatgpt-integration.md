# ChatGPT Integration Guide

Japan Real Estate Intel MCP は ChatGPT Apps SDK (Custom Connectors) に対応しています。

## 前提条件

- ChatGPT Plus / Team / Enterprise アカウント
- MCP サーバーが `https://realestate-mcp.jp` で稼働中
- API Key を取得済み（`Authorization: Bearer <key>` ヘッダーで認証）

## Custom Connector 登録手順

1. ChatGPT の設定画面で **Apps → Custom Connectors** を開く
2. **Add Connector** をクリック
3. 以下を入力:
   - **Name**: Japan Real Estate Intel
   - **Server URL**: `https://realestate-mcp.jp/mcp`
   - **Authentication**: Bearer Token → API Key を入力
4. **Connect** をクリック
5. ツール一覧に `search`, `fetch` + 14 ドメインツールが表示されれば成功

## search / fetch ワークフロー

ChatGPT は以下の順序でツールを呼び出します:

```
User: "名古屋駅周辺の不動産投資について教えて"
  ↓
ChatGPT → search({ query: "名古屋 投資" })
  ↓ results: [{ id: "area:aichi:名古屋市中村区", title: "...", url: "..." }, ...]
  ↓
ChatGPT → fetch({ id: "area:aichi:名古屋市中村区" })
  ↓ { title, text (Markdown), url, metadata }
  ↓
ChatGPT: ユーザーに結果を要約して回答
```

## ID 命名規則

| プレフィックス | 形式 | 例 | 取得先 |
|---|---|---|---|
| `area:` | `area:{pref}:{city}` | `area:aichi:名古屋市中区` | cross_analyze |
| `pref:` | `pref:{key}` | `pref:tokyo` | 都道府県概要 |
| `neighborhood:` | `neighborhood:{pref}:{city}:{name}` | `neighborhood:aichi:名古屋市中区:栄` | drill_down |
| `future:` | `future:aichi:{scenario}` | `future:aichi:linear_chuo` | simulate_aichi_future |
| `tool:` | `tool:{name}` | `tool:portfolio_optimizer` | ツール情報 |
| `data:` | `data:{kind}:{pref}` | `data:land_price:tokyo` | データサマリ |

## 直接ツール呼び出し

ChatGPT は `search`/`fetch` だけでなく、登録された14ツールを直接呼び出すこともできます:

```
cross_analyze_real_estate_market({
  "prefecture": "東京都",
  "area": "新宿区",
  "propertyType": "office",
  "timeRange": "5y",
  "includeRisk": true,
  "includeHumanFlow": true
})
```

すべてのツールに `readOnlyHint: true` が付与されているため、ChatGPT は安全に呼び出せます。

## 対応都道府県 (10)

愛知県、東京都、大阪府、福岡県、北海道、神奈川県、京都府、兵庫県、埼玉県、千葉県

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ツールが表示されない | Connector 未登録 or URL 誤り | Server URL が `/mcp` で終わっているか確認 |
| 401 Unauthorized | API Key 誤り | Bearer Token を再設定 |
| search が空を返す | クエリが短すぎる | 2文字以上の具体的なキーワードを使用 |
| タイムアウト | サーバー負荷 | 時間をおいて再試行 |
