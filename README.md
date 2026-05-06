# @sugukuru/japan-real-estate-intel-mcp

日本の不動産投資・仲介・開発・管理向けに、**地価・取引価格・人口統計・災害リスク・人流・教育環境・企業立地・3D景観** をクロス分析する MCP サーバー。

愛知県を先行対応し、今後日本全国へ拡張予定。AI ホスト（Claude Desktop / Cursor / VS Code）から直接呼び出して、投資判断・物件評価・市場レポートを瞬時に取得できます。

## 「今までなかった」独自価値

| データ×データ | 実現する分析 | 業界インパクト |
|---|---|---|
| 地価 × 人流 × 災害リスク | 実需要に基づく空室リスク予測 | 「人が本当に来るか？」を数値化 |
| 住宅価格 × 学区偏差値 × 犯罪統計 | ファミリー物件の真の資産価値 | 子育て世帯向け最強の投資判断 |
| オフィス価格 × 企業集積 × 通勤時間 | 法人需要の精密予測 | オフィス・物流投資で差別化 |
| 地価 × PLATEAU 3D建物高さ × 影 | 景観・日照シミュレーション | 開発事業者への視覚的説得力 |

## 特徴

- **7つのツール**: 市場分析 / 人流クロス分析 / リスク評価 / ファミリー評価 / 法人需要予測 / レポート生成 / ダッシュボード
- **8レイヤーダッシュボード**: 地価 / 災害リスク / 取引 / 人口 / 人流 / 学区 / 企業密度 / 3D建物
- **5カテゴリのデータ統合**: 価格・需給・災害・実需要（人流）・教育環境・企業立地・安全性・景観
- **stdio + Streamable HTTP**: 両トランスポート対応
- **TypeScript + Zod**: 型安全な入出力スキーマ
- **バンドルデータ**: 愛知県のスナップショット同梱（API キー不要）

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

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "japan-real-estate-intel": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## ツール一覧

### v1.0 ツール

#### `cross_analyze_real_estate_market`
地価トレンド・需給・災害リスク・投資スコアのクロス分析。

#### `assess_property_risk`
特定住所の浸水・土砂・地震リスクを評価し、価格調整率を算出。

#### `generate_area_report`
投資/開発/賃貸/管理レポートを Markdown 形式で生成。

#### `open_dashboard`
8レイヤーの不動産ダッシュボードを起動（MCP Apps 対応ホストでインタラクティブ表示）。

### v1.2 新ツール

#### `cross_analyze_with_human_flow`
**人流データ×不動産クロス分析**。モバイル位置情報統計を加味し、実需要スコア・空室リスクを科学的に予測。

| パラメータ | 型 | 説明 |
|---|---|---|
| `area` | string | エリア名 |
| `propertyType` | enum | residential / commercial / logistics / office / mixed |
| `timeRange` | enum | 1y / 3y / 5y |
| `dayType` | enum | weekday / weekend / both |

```
> 名古屋市中区の商業不動産を人流データ付きで分析
→ 平日18.5万人/日、実需要スコア 85/100、空室リスク 10/100
```

#### `assess_family_friendly_score`
**学区・教育環境・犯罪統計でファミリー物件評価**。子育て世帯向けの真の資産価値を算出。

| パラメータ | 型 | 説明 |
|---|---|---|
| `area` | string | エリア名 |
| `childAge` | enum | preschool / elementary / junior_high / high_school / all |

```
> 名古屋市千種区のファミリー向け評価
→ ファミリースコア 78/100、教育スコア 82/100、資産価値+12.8%
```

#### `predict_corporate_demand`
**企業立地・事業所統計・通勤データで法人需要予測**。

| パラメータ | 型 | 説明 |
|---|---|---|
| `area` | string | エリア名 |
| `propertyType` | enum | office / logistics / commercial / mixed |
| `includeCommuteAnalysis` | boolean | 通勤分析を含むか |

```
> 名古屋市中区のオフィス需要を予測
→ 大企業245社集積、法人需要 87/100、成長性: high
```

## ダッシュボードレイヤー

| レイヤー | データ | 可視化 |
|---|---|---|
| 地価 | 地価公示 | ヒートマップ（赤〜青） |
| 災害リスク | 浸水・土砂・地震 | リスクゾーン + スコア |
| 取引 | 不動産取引価格 | バブルチャート |
| 人口 | 人口統計 | 増減カラー + サイズ |
| **人流** | モバイル位置情報 | フローヒートマップ + トレンド |
| **学区** | 教育環境データ | 教育スコアカラー |
| **企業** | 事業所統計 | 企業集積密度 |
| **3D建物** | PLATEAU | 建物高さ + 影シミュレーション |

## データ出典

| データ | 出典 | 取得日 |
|---|---|---|
| 地価公示 | 国土交通省 | 2025-12-01 |
| 不動産取引価格 | 国土交通省 | 2025-12-01 |
| 浸水・土砂災害 | 国土交通省ハザードマップ | 2025-12-01 |
| 地震想定 | 内閣府 | 2025-12-01 |
| 人口統計 | 総務省 e-Stat | 2025-12-01 |
| **人流統計** | 国土交通省「全国うごき統計」| 2025-12-01 |
| **教育データ** | 愛知県教育委員会 + e-Stat | 2025-12-01 |
| **事業所統計** | 総務省 e-Stat | 2025-12-01 |
| **犯罪統計** | 愛知県警察オープンデータ | 2025-12-01 |
| **3D都市モデル** | 国土交通省 PLATEAU | 2025-12-01 |
| 市区町村境界 | 国土数値情報 | 2025-12-01 |

**注意**: v1.2 のデータは MVP デモ用のサンプルスナップショットです。投資判断には最新の公開データを直接ご確認ください。

## 開発

```bash
pnpm install
pnpm dev          # TypeScript watch
pnpm build:ui     # ダッシュボード再ビルド
pnpm test         # Vitest (43 tests)
pnpm lint         # 型チェック
```

## ロードマップ

- **v1.3**: ライブ API アダプタ（MLIT / e-Stat / ハザードマップ）
- **v1.4**: 愛知県以外の都道府県対応（東京・大阪・福岡）
- **v2.0**: Federation Hub 連携 + PDF/Excel エクスポート + npm publish

## ライセンス

MIT
