# @sugukuru/japan-real-estate-intel-mcp

日本の不動産投資・仲介・開発・管理向けに、**地価・取引価格・人口統計・災害リスク・人流・教育環境・企業立地・3D景観** をクロス分析する MCP サーバー。

**v2.0** から都道府県プラガブル構造を採用。愛知県（フルデータ）と東京都（基本データ）の 2 都道府県に対応。新しい県は `data-loaders/` にファイルを 1 本追加するだけで拡張可能です。

## v2.0.0 Breaking Changes

| 変更 | 詳細 |
|---|---|
| 全ツールに `prefecture` パラメータ追加 | デフォルト: `"愛知県"` |
| `cross_analyze_with_human_flow` 廃止 | `cross_analyze_real_estate_market` に `includeHumanFlow` フラグとして統合 |
| Resource URI 変更 | `realestate://land-price/{prefecture}/{area}` 形式に |
| データディレクトリ変更 | `data/aichi/`, `data/tokyo/` に分離 |
| 出力に optional フィールド追加 | `humanFlow`, `realDemandScore`, `educationSummary`, `corporateSummary` |

## 「今までなかった」独自価値

| データ×データ | 実現する分析 | 業界インパクト |
|---|---|---|
| 地価 × 人流 × 災害リスク | 実需要に基づく空室リスク予測 | 「人が本当に来るか？」を数値化 |
| 住宅価格 × 学区偏差値 × 犯罪統計 | ファミリー物件の真の資産価値 | 子育て世帯向け最強の投資判断 |
| オフィス価格 × 企業集積 × 通勤時間 | 法人需要の精密予測 | オフィス・物流投資で差別化 |
| 地価 × PLATEAU 3D建物高さ × 影 | 景観・日照シミュレーション | 開発事業者への視覚的説得力 |

## 都道府県 Capabilities マトリクス

| 機能 | 愛知県 | 東京都 |
|---|:---:|:---:|
| 地価公示 | YES | YES |
| 不動産取引 | YES | - |
| 人口統計 | YES | YES |
| 浸水想定 | YES | YES |
| 土砂災害 | YES | - |
| 地震想定 | YES | YES |
| 市区町村境界 | YES | YES |
| 人流データ | YES | v2.1+ |
| 教育環境 | YES | v2.1+ |
| 企業立地 | YES | v2.1+ |
| 犯罪統計 | YES | v2.1+ |
| PLATEAU 3D | YES | v2.1+ |

## 特徴

- **6つのツール**: 市場クロス分析（人流・教育・企業フラグ統合）/ リスク評価 / ファミリー評価 / 法人需要予測 / レポート生成 / ダッシュボード
- **8レイヤーダッシュボード**: 地価 / 災害リスク / 取引 / 人口 / 人流 / 学区 / 企業密度 / 3D建物（capabilities に応じて自動 enable/disable）
- **都道府県セレクタ**: ダッシュボード上で Aichi ↔ Tokyo を切り替え
- **比較モード**: 2 都道府県のスコアを並列表示（v2.1 でフル機能化）
- **stdio + Streamable HTTP**: 両トランスポート対応
- **TypeScript strict + Zod**: 型安全な入出力スキーマ
- **プラガブル**: `BaseLoader` を継承して新県を追加

## クイックスタート

```bash
git clone https://github.com/sugukuru/japan-real-estate-intel-mcp.git
cd japan-real-estate-intel-mcp
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

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/japan-real-estate-intel-mcp"
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "japan-real-estate-intel": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/japan-real-estate-intel-mcp"
    }
  }
}
```

## ツール一覧（v2.0: 6 本）

### `cross_analyze_real_estate_market`

都道府県内エリアの不動産市場をクロス分析。`includeHumanFlow` / `includeEducation` / `includeCorporate` フラグで付加情報をオプトイン。

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `prefecture` | string | `"愛知県"` | 都道府県名 |
| `area` | string | - | エリア名 |
| `propertyType` | enum | - | residential / commercial / logistics / office / mixed |
| `timeRange` | enum | - | 1y / 3y / 5y |
| `includeRisk` | boolean | `true` | 災害リスクを含むか |
| `includeHumanFlow` | boolean | `true` | 人流データを含むか |
| `includeEducation` | boolean | `false` | 教育データを含むか |
| `includeCorporate` | boolean | `false` | 企業データを含むか |

capabilities がない都道府県では該当フィールドが `undefined` になり、`keyInsights` に「v2.x で対応予定」と表示されます。

### `assess_property_risk`

特定住所の浸水・土砂・地震リスクを評価し、リスクスコアと価格調整率を算出。

### `assess_family_friendly_score`

学区・教育環境・犯罪統計を加味したファミリー物件評価。子育て世帯向け資産価値を算出。

### `predict_corporate_demand`

企業立地・事業所統計・通勤データで法人需要を予測。

### `generate_area_report`

投資/開発/賃貸/管理レポートを Markdown 形式で生成。

### `open_dashboard`

8レイヤーの不動産ダッシュボードを起動。都道府県セレクタ付き。

## Resources（v2.0 URI パターン）

| URI | 説明 |
|---|---|
| `realestate://land-price/{prefecture}/{area}` | 地価公示データ |
| `hazard://flood/{prefecture}/{area}` | 浸水想定区域 GeoJSON |
| `stats://population-trend/{prefecture}/{area}` | 人口統計 |
| `ui://japan-real-estate-intel/dashboard` | ダッシュボード HTML |

例: `realestate://land-price/aichi/名古屋市中区`, `realestate://land-price/tokyo/世田谷区`

## 都道府県の追加手順

新しい県を追加する場合:

1. `data/<key>/` に最低限のファイルを配置:
   - `land_price.csv`, `population.csv`, `flood.geojson`, `earthquake.json`, `municipalities.topojson`
2. `src/data-loaders/<key>-loader.ts` を作成（`BaseLoader` を継承、`capabilities` を宣言）
3. `src/data-loaders/index.ts` で `registerLoader(new XxxLoader())` を 1 行追加
4. `src/prefecture/resolver.ts` の `PREFECTURE_KEYS` にエイリアスを追加

それだけで `prefecture: "大阪府"` が全ツールで動作します。

## データ出典

| データ | 出典 | 取得日 |
|---|---|---|
| 地価公示 | 国土交通省 | 2025-12-01 |
| 不動産取引価格 | 国土交通省 | 2025-12-01 |
| 浸水・土砂災害 | 国土交通省ハザードマップ | 2025-12-01 |
| 地震想定 | 内閣府 | 2025-12-01 |
| 人口統計 | 総務省 e-Stat | 2025-12-01 |
| 人流統計 | 国土交通省「全国うごき統計」| 2025-12-01 |
| 教育データ | 愛知県教育委員会 + e-Stat | 2025-12-01 |
| 事業所統計 | 総務省 e-Stat | 2025-12-01 |
| 犯罪統計 | 愛知県警察オープンデータ | 2025-12-01 |
| 3D都市モデル | 国土交通省 PLATEAU | 2025-12-01 |

**注意**: データは MVP デモ用のサンプルスナップショットです。投資判断には最新の公開データを直接ご確認ください。

## 開発

```bash
pnpm install
pnpm dev          # TypeScript watch
pnpm build:ui     # ダッシュボード再ビルド
pnpm test         # Vitest (62 tests)
pnpm lint         # 型チェック
```

## ロードマップ

- **v2.1**: 東京都の人流/学区/企業/PLATEAU データ追加 + 比較モードフル機能化
- **v2.2**: 大阪府・福岡県対応
- **v3.0**: ライブ API アダプタ + Federation Hub + npm publish

## ライセンス

MIT
