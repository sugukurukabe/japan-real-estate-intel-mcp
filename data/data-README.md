# Data Directory — Multi-Prefecture Real Estate Intelligence (v2.0)

## Overview

This directory contains representative bundled data snapshots organized **per prefecture**.
**This is sample data for demonstration and development purposes.**

```
data/
├── aichi/   ← フル機能 (全12データセット)
└── tokyo/   ← 限定機能 (最小5データセット)
```

新しい都道府県を追加するには、`data/<key>/` ディレクトリを作成し、必要なファイルを配置した上で `src/data-loaders/<key>-loader.ts` を作成してください。詳細は project ルート `README.md` の「都道府県の追加手順」を参照。

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

**Capabilities:** 地価 / 人口 / 災害（浸水・地震）のみ。人流・教育・企業・犯罪・PLATEAU は未対応（v2.x で追加予定）。

| File | Description | Rows/Features |
|------|-------------|---------------|
| `land_price.csv` | 地価公示（23区+主要市） | ~80 rows |
| `population.csv` | 人口・世帯統計（23区） | 23 rows |
| `earthquake.json` | 首都直下地震想定震度・液状化 | 23 records |
| `flood.geojson` | 主要河川浸水想定（荒川・隅田川等） | ~10 features |
| `municipalities.topojson` | 23区ポリゴン | 23 features |

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

- **Snapshot date**: 2025-12-01
- **Processing**: Data has been simplified, sampled, and anonymized for MVP demonstration purposes.
  - Land prices: sampled representative points per district
  - Transactions: sampled and anonymized individual transactions
  - Hazard zones: geometries simplified to rectangular approximations
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
