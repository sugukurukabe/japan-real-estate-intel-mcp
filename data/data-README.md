# Data Directory — Multi-Prefecture Real Estate Intelligence

## Overview

This directory contains **bundled CSV / JSON / GeoJSON / TopoJSON** snapshots organized **per prefecture** (`data/<prefecture-key>/`). Keys match `src/data-loaders/*-loader.ts` (現行は **10 都道府県** 分のディレクトリ。正確な一覧は `listAvailable()` または各ローダーを参照)。

**This is sample or extracted data for demonstration and development purposes.**

```
data/
├── aichi/   ← フル機能（名古屋市町丁目・計画データ等を含む）
├── tokyo/   ← フル機能（23区ベースのスナップショット）
├── osaka/, kanagawa/, …  ← 他県はローダーと同じキー名のディレクトリ
```

新しい都道府県を追加するには、`data/<key>/` を作成し、必要なファイルを配置した上で `src/data-loaders/<key>-loader.ts` を追加してください。詳細は project ルート `README.md` の「都道府県の追加手順」を参照。

## Aichi Prefecture (`data/aichi/`)

**Capabilities:** 地価 / 取引 / 人口 / 災害 / 人流 / 教育 / 企業 / 犯罪 / PLATEAU すべて対応。

| File | Description | Rows/Features |
|------|-------------|---------------|
| `land_price.csv` | 地価公示（公示地価）データ | ~80 rows |
| `transactions.csv` | 不動産取引価格情報 | ~120 rows |
| `population.csv` | 人口・世帯統計 | 24 rows |
| `earthquake.json` | 南海トラフ地震想定震度 | 24 records |
| `flood.geojson` | 洪水浸水想定区域（簡略化） | 15 features |
| `landslide.geojson` | 土砂災害警戒区域（簡略化） | 10 features |
| `municipalities.topojson` | 市区町村ポリゴン | 24 features |
| `human_flow.csv` | 人流（モバイル空間統計風） | ~120 rows |
| `school_districts.csv` | 学区・教育環境スコア | ~30 rows |
| `corporate_locations.csv` | 企業立地・事業所統計 | ~20 rows |
| `crime_stats.csv` | 犯罪統計 | 24 rows |
| `plateau_buildings.json` | PLATEAU 3D建物高さ | ~50 records |

## Tokyo Prefecture (`data/tokyo/`)

**Capabilities:** `TokyoLoader` と整合するよう、地価・取引・人口・災害・人流・教育・企業・犯罪・PLATEAU・交通・商業・医療・町丁目に加え、用途地域・空き家率・人口推計・路線価・浸水/地震リスク CSV などを同梱します。

ファイル一覧と概要は **`data/tokyo/README.md`** を参照してください。

## Data Sources

| Dataset | Original Source |
|---------|----------------|
| 地価公示 | 国土交通省 地価公示（https://www.land.mlit.go.jp/landPrice/AriaServlet?MOD=2&TYP=0） |
| 不動産取引価格情報 | 国土交通省 不動産取引価格情報（https://www.land.mlit.go.jp/webland/） |
| 人口統計 | 総務省統計局 e-Stat 国勢調査（https://www.e-stat.go.jp/） |
| 地震想定 | 内閣府 南海トラフ / 首都直下地震対策 |
| 浸水・土砂 | 国土交通省 ハザードマップポータルサイト（https://disaportal.gsi.go.jp/） |
| 行政区画 | 国土数値情報 / 国土地理院 |
| 人流 | モバイル空間統計風サンプル（NTTドコモ・KDDI 風データ） |
| 学区・教育 | 各市町村教育委員会 公開データ |
| 企業立地 | 経済センサス（総務省） |
| 犯罪 | 警察庁 / 都道府県警 公開統計 |
| PLATEAU | 国土交通省 Project PLATEAU（https://www.mlit.go.jp/plateau/） |

## Retrieval & Processing

- **Acquisition date**: 2025-12-01 (Japan Real Estate Intel)
- **Processing**: Data has been standardized and aggregated for analysis use.
  - Land prices: representative points per district
  - Transactions: aggregated by city/district
  - Hazard zones: geometries simplified to district-level polygons
  - Population: aggregated at municipality level

## License Notes

- 地価公示・不動産取引価格情報: 国土交通省「国土数値情報」利用規約に基づく（CC BY 4.0 compatible）
- 人口統計: 政府統計の総合窓口 e-Stat 利用規約に基づく
- ハザードマップ情報: 国土交通省ハザードマップポータルサイト利用規約に基づく
- 都道府県オープンデータ: CC BY 4.0
- PLATEAU: CC BY 4.0

## Important Warning

**このデータはデモンストレーション用のサンプルデータです。**

- 実際の不動産投資判断には使用しないでください
- 数値は現実的な範囲で生成されていますが、実データとは異なります
- ハザードマップのジオメトリは大幅に簡略化されています
- 本番利用時は必ず公式データソースから最新データを取得してください
