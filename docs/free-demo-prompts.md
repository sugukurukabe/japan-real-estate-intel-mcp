# Free デモ用プロンプト（コピペ専用）

**プレゼン・Showcase・審査**ではこの3本だけ使う。PDF・リニア数値シミュ・契約PDFは **Pro** のため、Free 接続では **ツール拒否** になります。

接続: `npx @sugukuru/japan-real-estate-intel-mcp`（既定 `DEFAULT_TIER=free`）

---

## 1. 投資エリア探索（愛知）

```
discover_opportunities で愛知県の investment 向けエリアを探して。horizon=3y, limit=5。上位を表でまとめて。
```

## 2. 名古屋・計画ストーリー

```
get_future_timeline を ward=中区 で実行し、今後5年のインフラ・開発イベントを年次で要約して。
```

## 3. 価格の歪み（投資家向け）

```
detect_arbitrage_signals を prefecture=aichi で実行し、discount シグナルがある市区町村を教えて。続けて forecast_land_price_trend（prefecture=愛知県, city=名古屋市中村区, horizon=5y）で方向感を1段落で。
```

---

## ブラウザ補助（MCP 不要）

https://realestate-mcp.jp/dashboard.html?prefecture=aichi

地図・投資スコアの見せ方用。**分析の本体は上記 MCP プロンプト**。

---

## Pro が必要な例（デモで使わない）

| ツール | 用途 |
|--------|------|
| `generate_area_report` (PDF) | 客前ブランドPDF |
| `simulate_aichi_future` | リニア数値シミュ |
| `generate_contract_support_package` | 契約支援 |
| `evaluate_store_location` | 店舗出店 |

詳細: [competitive-positioning.md](./competitive-positioning.md) · [nagoya-dealer-pitch-scenarios.md](./nagoya-dealer-pitch-scenarios.md)
