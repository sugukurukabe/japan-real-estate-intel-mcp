# @sugukuru/aichi-real-estate-intel-mcp

愛知県の不動産投資・仲介・開発・管理向けに、**地価・取引価格・人口統計・災害リスク（浸水・土砂・地震）** をクロス分析する MCP サーバー。

AI ホスト（Claude Desktop / Cursor / VS Code Copilot Chat）から直接呼び出して、投資判断・物件評価・市場レポートを瞬時に取得できます。

## 特徴

- **クロス分析**: 地価トレンド × 災害リスク × 人口動態を統合したスコアリング
- **4 つのツール**: 市場分析 / リスク評価 / レポート生成 / ダッシュボード
- **MCP Apps ダッシュボード**: Leaflet 地図 + 地価ヒートマップ + 災害リスクレイヤー
- **stdio + Streamable HTTP**: 両トランスポート対応
- **TypeScript + Zod**: 型安全な入出力スキーマ
- **バンドルデータ**: 愛知県の地価公示・取引価格・人口・ハザードデータ同梱（API キー不要）

## クイックスタート

```bash
git clone https://github.com/sugukuru/aichi-real-estate-intel-mcp.git
cd aichi-real-estate-intel-mcp
pnpm install
pnpm build
```

### stdio（ローカル）

```bash
node dist/index.js
```

### Streamable HTTP（リモート）

```bash
node dist/http.js
# → http://0.0.0.0:3100/mcp
```

## クライアント設定

### Claude Desktop

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aichi-real-estate-intel": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/aichi-real-estate-intel-mcp"
    }
  }
}
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aichi-real-estate-intel": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/aichi-real-estate-intel-mcp"
    }
  }
}
```

### VS Code

`.vscode/mcp.json`:

```json
{
  "servers": {
    "aichi-real-estate-intel": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## ツール一覧

### `cross_analyze_real_estate_market`

愛知県内エリアの不動産市場をクロス分析。価格トレンド・需給・災害リスク・投資スコアを返す。

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `area` | string | 愛知県内のエリア（例: "名古屋市中村区"） |
| `propertyType` | enum | residential / commercial / logistics / office / mixed |
| `timeRange` | enum | 1y / 3y / 5y |
| `includeRisk` | boolean | 災害リスクを考慮するか（デフォルト: true） |
| `focusMetrics` | string[] | 注目指標（任意） |

```
> 名古屋市中区の商業不動産を3年間で分析して
→ 投資スコア 72/100、リスクスコア 48/100、地価上昇率 +8.1%
```

### `assess_property_risk`

特定住所の災害リスク（浸水・土砂・地震）を評価。

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `address` | string | 住所または地番 |
| `latlng` | object | 緯度経度（任意） |
| `riskTypes` | string[] | flood / landslide / earthquake / all |

```
> 名古屋市港区のリスク評価をして
→ 総合リスク 78/100、浸水リスク 高（最大5m）、価格調整率 -23.4%
```

### `generate_area_report`

エリア別の投資/開発/賃貸/管理レポートを Markdown 形式で生成。

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `area` | string | エリア名 |
| `purpose` | enum | investment / development / rental / management |
| `includeCharts` | boolean | チャートデータ含むか（デフォルト: true） |

### `open_dashboard`

愛知県不動産ダッシュボード（地図＋ヒートマップ＋リスクレイヤー）を開く。MCP Apps 対応ホストではインタラクティブ UI を表示。

## リソース

| URI | 説明 |
|-----|------|
| `realestate://land-price/aichi/{city}` | 地価公示データ |
| `hazard://flood/aichi/{area}` | 浸水想定区域 GeoJSON |
| `stats://population-trend/aichi/{area}` | 人口統計 |
| `ui://aichi-real-estate-intel/dashboard` | ダッシュボード HTML |

## データ出典

| データ | 出典 | 取得日 |
|--------|------|--------|
| 地価公示 | 国土交通省 | 2025-12-01 |
| 不動産取引価格 | 国土交通省 不動産価格情報 | 2025-12-01 |
| 浸水想定区域 | 国土交通省 ハザードマップポータル | 2025-12-01 |
| 土砂災害警戒区域 | 国土交通省 ハザードマップポータル | 2025-12-01 |
| 地震想定 | 内閣府 南海トラフ地震対策 | 2025-12-01 |
| 人口統計 | 総務省統計局 e-Stat | 2025-12-01 |
| 市区町村境界 | 国土数値情報 | 2025-12-01 |

**注意**: v1.0 のデータは MVP デモ用のサンプルスナップショットです。投資判断には最新の公開データを直接ご確認ください。

## 開発

```bash
pnpm install
pnpm dev          # TypeScript watch
pnpm build:ui     # ダッシュボード再ビルド
pnpm test         # Vitest
pnpm lint         # 型チェック
```

## 既知の制約（v1.0）

- 同梱データは愛知県限定のスナップショット
- ライブ API 取得は未実装（v1.1+ で対応予定）
- PDF / Excel エクスポート未実装
- Federation Hub 連携は準備中

## ライセンス

MIT
