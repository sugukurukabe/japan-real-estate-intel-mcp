# Claude Desktop セットアップガイド

Japan Real Estate Intel MCP を Claude Desktop で使う手順です。

## 前提

- Claude Desktop (最新版)
- **アカウント登録・API Key は不要**（`https://realestate-mcp.jp` は認証不要の公開コネクタ。Pro/Enterprise機能のみ任意で`X-License-Key`ヘッダーで解放）

## 接続設定

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "url": "https://realestate-mcp.jp/mcp"
    }
  }
}
```

保存後、Claude Desktop を再起動してください。

> **Pro/Enterprise機能を試す場合のみ**: 上記の`"url"`の隣に`"headers": { "X-License-Key": "your-license-key" }`を追加してください（Stripe決済後に発行されるECDSA署名済みキー）。`X-Api-Key`とは別物です — `X-Api-Key`は自己ホスト時の任意アクセス制限用で、`https://realestate-mcp.jp`の公開インスタンスでは設定されていません。

## 接続確認

1. Claude Desktop を開く
2. チャット欄の左下にハンマーアイコン (ツール) が表示される
3. クリックして `cross_analyze_real_estate_market` 等のツール一覧が見えれば成功

## 体験シナリオ

### シナリオ 1: 投資機会の発見

```
愛知県の不動産投資機会を探して。
Opportunity Radar で上位5件を教えて。
```

Claude が `discover_opportunities` を呼び、ダッシュボードが iframe 内に表示されます。
カード上の「深掘り」ボタンをクリックすると、`cross_analyze_real_estate_market` が自動実行されます。

### シナリオ 2: 店舗出店の適地評価

```
東京都で飲食店の出店に最適なエリアを分析して。
新宿区と渋谷区を比較して。
```

Claude が `evaluate_store_location` → `compare_prefectures` を順に呼び出します。
地図上のピンをクリックすると「深掘り」「AIに質問」ボタンが表示されます。

### シナリオ 3: 災害リスク付きレポート生成

```
名古屋市中区の不動産レポートをPDFで作って。
災害リスクとリニアの影響も含めて。
```

Claude が `generate_area_report` を呼び出します。
画面上部にプログレスバーが表示され (1/6 クロス分析中… → 6/6 PDF完了)、
完了後に PDF データが返されます。

## ダッシュボード操作

ダッシュボード内での操作は AI に自動伝達されます:

| 操作 | AI への伝達 |
|---|---|
| 都道府県を切り替え | `updateContext` で AI が把握 |
| 市区町村をクリック | `updateContext` で AI が把握 |
| レイヤーを変更 | `updateContext` で AI が把握 |
| 「深掘り」ボタン | `drill_down_local_analysis` が実行される |
| 「AIに質問」ボタン | AI チャットにメッセージが送信される |
| Opportunity カードのアクション | 対応ツールが実行される |

## ローカル開発での接続 (stdio)

デプロイ前にローカルで試す場合:

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "C:/path/to/real-estate-intel-mcp"
    }
  }
}
```

事前に `pnpm run build:server` でビルドしてください。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| ツールが表示されない | claude_desktop_config.json のパスと JSON 構文を確認 |
| 401 エラー | 自己ホストで `API_KEY` を設定している場合のみ発生。`https://realestate-mcp.jp` の公開インスタンスでは認証不要のため通常は起きない |
| ダッシュボードが開かない | MCP Apps 対応の Claude Desktop 最新版か確認 |
| プログレスバーが出ない | PDF レポート生成時のみ表示される |
| Pro/Enterprise限定ツールが拒否される | Free ティアの上限。`X-License-Key` ヘッダーでライセンスキーを設定するとPro/Enterprise機能が解放される |
