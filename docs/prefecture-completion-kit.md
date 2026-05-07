# Prefecture Completion Kit — 都道府県展開テンプレート

このドキュメントは、愛知県の「Gold Standard」を他都道府県に素早く展開するためのチェックリスト・テンプレート集です。

---

## 完成形の定義

| レベル | 基準 | ツール数 | データ品質 |
|---|---|---|---|
| Bronze | 基本分析のみ | 8 | スタブデータ |
| Silver | 全ツール対応 | 13 | 統計ベース |
| **Gold** | **全ツール + 将来シミュレーター + ブランドPDF** | **14+** | **実取引データ** |

愛知県が Gold を達成済み。次は以下の優先順位で展開。

---

## 展開優先順位

### Phase 1（優先 3 都道府県）

| 順位 | 都道府県 | 理由 | 現在のレベル |
|---|---|---|---|
| 1 | **東京都** | 最大市場。エージェント数最多 | Silver |
| 2 | **大阪府** | 西日本最大。インバウンド需要高 | Silver |
| 3 | **神奈川県** | 首都圏・横浜の開発需要 | Silver |

### Phase 2（3〜6ヶ月後）

| 都道府県 | 理由 |
|---|---|
| 福岡県 | 九州最大・天神再開発ブーム |
| 兵庫県 | 神戸・阪神間の住宅需要 |

---

## データファイルチェックリスト

新都道府県を Gold Level にするために必要なファイル一覧。

### 必須ファイル（Bronze → Silver）

```
data/{prefecture}/
├── land_prices.csv          # 地価データ（年・市区・地価）
├── population.csv           # 人口データ（市区・人口・世帯数）
├── earthquake.json          # 地震リスク
├── flood.geojson            # 洪水リスク
├── municipalities.topojson  # 市区町村境界
├── human_flow.csv           # 人流データ
├── school_districts.csv     # 学区データ
├── corporate_locations.csv  # 企業立地
├── crime_stats.csv          # 犯罪統計
├── transport.csv            # 交通・鉄道データ
├── commercial_facilities.csv # 商業施設
├── medical_facilities.csv   # 医療施設
├── neighborhoods.csv        # 近隣（町丁目）統計
└── transactions.csv         # 取引事例（過去5年 100件以上推奨）
```

### Gold Level 追加ファイル

```
data/{prefecture}/
├── future_infrastructure.json  # 将来インフラ（大規模プロジェクト）
└── neighborhoods.json          # 近隣詳細（ハイパーローカル情報）
```

---

## Loader テンプレート

新都道府県を追加するには `src/data-loaders/{prefecture}-loader.ts` を作成します。

```typescript
// src/data-loaders/{prefecture}-loader.ts
import { BaseLoader } from './base-loader.js';
import type { LoaderCapabilities, LatLng, /* ... */ } from './types.js';

const GEOCODE: Record<string, LatLng> = {
  // 主要市区町村の緯度経度
};

export class {Prefecture}Loader extends BaseLoader {
  readonly id = '{prefecture}';
  readonly name = '{都道府県名}';

  // Gold Level capabilities（全 true を目指す）
  readonly capabilities: LoaderCapabilities = {
    transactions: true,
    humanFlow: true,
    education: true,
    corporate: true,
    crime: true,
    plateau: false,     // 3D建物データは対応都道府県のみ
    transport: true,
    commercial: true,
    medical: true,
    neighborhoods: true,
  };

  readonly dataDir = 'data/{prefecture}';

  geocode(city: string): LatLng | undefined {
    return GEOCODE[city];
  }
}
```

### Registry への登録

`src/data-loaders/index.ts` に追加:

```typescript
import { PrefectureLoader } from './{prefecture}-loader.js';
registry.register(new PrefectureLoader());
```

---

## データ生成パイプライン

`scripts/prefecture-setup.py` を使って必要なデータファイルをテンプレートから生成できます。

```bash
# 新都道府県のデータファイル雛形を生成
python scripts/prefecture-setup.py --prefecture tokyo --name "東京都"

# 出力: data/tokyo/ 以下に全必須ファイルを生成
```

---

## 将来インフラ設定（future_infrastructure.json）

各都道府県固有の大型インフラプロジェクトを記述します。

```json
[
  {
    "project": "プロジェクト名",
    "type": "rail | airport | road | industrial | urban_development",
    "status": "planning | under_review | under_construction | partial_open | open",
    "opening_estimate": "20XX年",
    "primary_cities": ["最も恩恵を受ける市区"],
    "impact_cities": ["周辺の影響圏"],
    "peak_uplift_pct": 20,
    "notes": "プロジェクトの詳細・根拠"
  }
]
```

### 都道府県別 主要インフラ候補

| 都道府県 | 主要プロジェクト |
|---|---|
| 東京都 | 環状2号線、有楽町線延伸、芝浦再開発 |
| 大阪府 | 大阪万博跡地開発、うめきた2期、なにわ筋線 |
| 神奈川県 | 横浜市上瀬谷開発、横浜環状道路 |
| 福岡県 | 天神ビッグバン第2期、博多コネクティッド |
| 兵庫県 | 神戸・ポートアイランド拡張 |

---

## 展開スケジュール目標

| フェーズ | 期間 | 目標 | 担当 |
|---|---|---|---|
| Aichi Gold → Tokyo Silver→Gold | 1ヶ月 | 取引データ100件追加、将来インフラJSON作成 | - |
| Osaka Silver→Gold | 1.5ヶ月 | うめきた・万博シナリオ追加 | - |
| Kanagawa Silver→Gold | 2ヶ月 | 横浜インフラ・取引データ | - |
| 残り7県 Silver→Gold | 3〜6ヶ月 | パイプライン自動化で効率化 | - |

---

## 成功指標

各都道府県が「Gold」に達したと判断する基準:

- [ ] 全13ツールが対応 prefKey で動作する
- [ ] 取引データが100件以上ある
- [ ] `simulate_{prefecture}_future` 相当のシナリオが登録済み（または汎用 `scenario_what_if` で代替済み）
- [ ] `generate_area_report(format="pdf")` でブランドPDFが出力できる
- [ ] `?mode=field` でタブレットモードが使える
- [ ] テストが全パス（`npm test` ）
