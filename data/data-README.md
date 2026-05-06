# Data Directory — Aichi Prefecture Real Estate Intelligence

## Overview

This directory contains representative bundled data snapshots for Aichi prefecture real estate analysis. **This is sample data for demonstration and development purposes.**

## Files

| File | Description | Rows/Features |
|------|-------------|---------------|
| `land_price_aichi.csv` | 地価公示（公示地価）データ | ~80 rows |
| `transactions_aichi.csv` | 不動産取引価格情報 | ~120 rows |
| `population_aichi.csv` | 人口・世帯統計 | 24 rows |
| `earthquake_aichi.json` | 南海トラフ地震想定震度 | 24 records |
| `flood_aichi.geojson` | 洪水浸水想定区域（簡略化） | 15 features |
| `landslide_aichi.geojson` | 土砂災害警戒区域（簡略化） | 10 features |

## Data Sources

| File | Original Source |
|------|----------------|
| `land_price_aichi.csv` | 国土交通省 地価公示（https://www.land.mlit.go.jp/landPrice/AriaServlet?MOD=2&TYP=0） |
| `transactions_aichi.csv` | 国土交通省 不動産取引価格情報（https://www.land.mlit.go.jp/webland/） |
| `population_aichi.csv` | 総務省統計局 e-Stat 国勢調査（https://www.e-stat.go.jp/） |
| `earthquake_aichi.json` | 内閣府 南海トラフ地震対策 / 国土交通省ハザードマップポータルサイト |
| `flood_aichi.geojson` | 国土交通省 ハザードマップポータルサイト（https://disaportal.gsi.go.jp/） |
| `landslide_aichi.geojson` | 愛知県 土砂災害警戒区域等マップ / 愛知県オープンデータ |

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
- 愛知県オープンデータ: CC BY 4.0

## Important Warning

⚠️ **このデータはデモンストレーション用のサンプルデータです。**

- 実際の不動産投資判断には使用しないでください
- 数値は現実的な範囲で生成されていますが、実データとは異なります
- ハザードマップのジオメトリは大幅に簡略化されています
- 本番利用時は必ず公式データソースから最新データを取得してください
