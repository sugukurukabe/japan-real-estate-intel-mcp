# Pro デモ環境の立て方（経営者・社内デモ用）

本番の公開エンドポイントは既定 **Free** です。PDF・リニア数値・契約支援を見せるときだけ、**限定環境**で Pro を有効にしてください。

---

## ローカル / 社内限定（推奨）

```bash
# Windows PowerShell
$env:DEFAULT_TIER="pro"
npx @sugukuru/japan-real-estate-intel-mcp
```

```bash
# macOS / Linux
DEFAULT_TIER=pro npx @sugukuru/japan-real-estate-intel-mcp
```

Claude Desktop / Cursor の `mcp.json` では環境変数を渡します:

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "command": "npx",
      "args": ["@sugukuru/japan-real-estate-intel-mcp"],
      "env": { "DEFAULT_TIER": "pro" }
    }
  }
}
```

---

## デモ後は必ず Free に戻す

| 設定 | 用途 |
|------|------|
| `DEFAULT_TIER=free`（既定） | 公開デモ・顧客試用 |
| `DEFAULT_TIER=pro` | 社内・経営会議のみ |

**リモート** `https://realestate-mcp.jp/mcp` の tier はサーバー運用側の環境変数で決まります。顧客に Pro を配る場合は **専用 API キー + Pro** の組み合わせを別途設計してください（未実装の場合はローカル Pro のみ）。

---

## Pro で見せる例（名古屋）

[nagoya-dealer-pitch-scenarios.md](./nagoya-dealer-pitch-scenarios.md) の **Pro 必須** シナリオ:

- `generate_area_report`（PDF）
- `simulate_aichi_future`
- `generate_contract_support_package`

Free のみのプレゼン: [free-demo-prompts.md](./free-demo-prompts.md)
