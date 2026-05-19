# 名古屋不動産向け — プレゼン後フォロー（1枚）

Japan Real Estate Intel MCP の導入検討用クイックリファレンスです。

---

## すぐ試せる（ブラウザ）

| 用途 | URL |
|------|-----|
| ダッシュボード（愛知） | https://realestate-mcp.jp/dashboard.html?prefecture=aichi |
| 現地モード（タブレット） | 上記 URL に `&mode=field` を付与 |
| プライバシー / 利用規約 | https://realestate-mcp.jp/privacy-policy.html |

---

## ChatGPT / Claude 接続（MCP）

- ChatGPT: [chatgpt-integration.md](./chatgpt-integration.md)
- Claude Desktop: [claude-desktop-setup.md](./claude-desktop-setup.md)
- 不動産業者向け3分ガイド: [agent-quickstart.md](./agent-quickstart.md)

**リモート接続例（APIキーありの場合）**

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "url": "https://realestate-mcp.jp/mcp",
      "headers": { "X-Api-Key": "YOUR_API_KEY" }
    }
  }
}
```

**ローカル（npm）**

```bash
npx @sugukuru/japan-real-estate-intel-mcp
```

---

## Free プランで試せる3プロンプト（コピペ用）

1. **エリア仮説（愛知・投資）**  
   `discover_opportunities（prefecture=愛知県, goal=investment, horizon=3y, limit=5）で次に深掘りすべき市区町村を列挙して。`

2. **名古屋の将来計画**  
   `get_future_timeline ward=中区 でリニア・再開発イベントを年次で要点整理して。`

3. **投資家向けの根拠**  
   `detect_arbitrage_signals（prefecture=愛知県, limit=15）のうち名古屋市中村区を重点解説。続けて forecast_land_price_trend（prefecture=愛知県, city=名古屋市中村区, horizon=5y）。`

※ PDF レポート・リニア数値シミュ・学区スコア・店舗出店・契約支援などは **Pro** 機能です。詳細は [nagoya-dealer-pitch-scenarios.md](./nagoya-dealer-pitch-scenarios.md)。

---

## 詳細シナリオ集

経営者向け5パターン / 営業向け5パターン: [nagoya-dealer-pitch-scenarios.md](./nagoya-dealer-pitch-scenarios.md)

愛知特化ツール一覧: [aichi-agent-guide.md](./aichi-agent-guide.md)

---

## お問い合わせ・リポジトリ

- GitHub: https://github.com/sugukurukabe/japan-real-estate-intel-mcp
- npm: `@sugukuru/japan-real-estate-intel-mcp`

数値・シミュレーションは意思決定の補助です。契約・投資判断は登記・現地確認・専門家の確認と併用してください。
