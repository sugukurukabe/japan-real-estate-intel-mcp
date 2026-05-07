# 愛知県業者向け Japan Real Estate Intel MCP — 完全活用ガイド

> **完成形の定義**: 愛知県の不動産業者が「このツールなしには仕事できない」と感じる状態。
> 具体的には ① 商談中にタブレットで 30 秒以内に客前資料を生成できる、
> ② リニア中央新幹線など地元固有の将来価値シナリオを数値で示せる、
> ③ 会社ロゴ入りの印刷できる PDF をワンクリックで作れる、の 3 点を達成した状態。

---

## 1. ツール全覧（愛知特化）

| ツール | 主な用途 | 愛知向け特徴 |
|---|---|---|
| `cross_analyze_real_estate_market` | エリア総合分析 | 名古屋市各区・豊田・岡崎・一宮の全データ対応 |
| `simulate_aichi_future` | 将来価値シミュレーター | リニア駅・セントレア拡張・トヨタ工業団地を内蔵 |
| `generate_area_report` | PDF 客先資料生成 | 会社名・担当者名・ロゴ入りA4レポート |
| `forecast_land_price_trend` | 地価予測 | 5〜10年後の CAGR・投資シグナル |
| `assess_property_risk` | 災害リスク | 木曽川・庄内川洪水域 + 南海トラフ |
| `assess_family_friendly_score` | 住宅向け評価 | 名古屋市内の学区ランキング対応 |
| `evaluate_store_location` | 店舗出店 | 栄・名駅・大須などの人流データ |
| `portfolio_optimizer` | 投資配分最適化 | 名古屋×東京×大阪などマルチエリア比較 |
| `drill_down_local_analysis` | 町丁目詳細 | 覚王山・星ヶ丘・八事など50町丁目対応 |

---

## 2. 業者向け推奨ワークフロー

### 投資物件の商談

```
1. cross_analyze_real_estate_market(area="名古屋市中区", propertyType="office")
   → 投資スコア・リスク・人流の概要を把握

2. simulate_aichi_future(city="名古屋市中区", scenario="linear_chuo")
   → リニア開業による地価上昇を数値化

3. forecast_land_price_trend(city="名古屋市中区", horizon="10y")
   → 10年後の地価・CAGR・買い/保有シグナルを確認

4. generate_area_report(area="名古屋市中区", format="pdf",
     companyName="〇〇不動産", agentName="山田太郎",
     includeTransactionComparables=true)
   → ロゴ入り A4 PDF を生成 → 印刷 or メール添付
```

### 住宅購入のご案内

```
1. assess_family_friendly_score(area="名古屋市千種区")
2. drill_down_local_analysis(area="名古屋市千種区", neighborhood="覚王山")
3. assess_property_risk(area="名古屋市千種区")
4. generate_area_report(area="名古屋市千種区", purpose="investment",
     format="pdf", companyName="〇〇不動産")
```

### 店舗出店の候補選定

```
1. evaluate_store_location(city="名古屋市中区", storeType="cafe", targetCustomer="office_worker")
2. compare_prefectures(prefectures=["愛知県"], metrics=["human_flow","commercial","transport"])
3. portfolio_optimizer(targets=[...複数候補エリア...])
```

---

## 3. リニア中央新幹線インパクトガイド

| エリア | 恩恵の大きさ | 想定地価上昇率（10年） | 買い時判定 |
|---|---|---|---|
| 名古屋駅周辺（中村区・中区） | ◎ 直接恩恵 | +28〜35% | 今すぐ買い |
| 笹島・名駅南（中村区・熱田区） | ○ 波及効果 | +18〜24% | 2年以内に買い |
| 栄・伏見（中区） | ○ ビジネス集積 | +12〜18% | 保有継続 |
| 鶴舞・大須（中区・昭和区） | △ 間接効果 | +8〜12% | 様子見 |
| 豊田市（車産業＋リニア波及） | ○ 波及 | +10〜15% | 保有 |
| 岡崎市 | △ | +5〜8% | 様子見 |

> ※ `simulate_aichi_future` ツールで上記数値の詳細モデルを自動計算できます。

---

## 4. タブレット現地モード

ダッシュボードを `?mode=field` で開くと：
- 大フォント・高コントラスト（屋外日光下での視認性向上）
- スコアカードが全画面表示に
- 「お客様と共有」ボタンが現れ、QR コードで現在の画面を即座に共有

```
http://localhost:3000?mode=field&prefecture=aichi&area=名古屋市中区
```

---

## 5. ブランドレポートの設定

`config/aichi-branding.json` を作成して会社情報を設定：

```json
{
  "companyName": "○○不動産株式会社",
  "agentName": "山田 太郎",
  "agentLogoBase64": "data:image/png;base64,...",
  "disclaimer": "本レポートは情報提供を目的とし投資助言を構成するものではありません。",
  "primaryColor": "#1a3c5e",
  "footerContact": "TEL: 052-XXX-XXXX | info@example-realty.co.jp"
}
```

---

## 6. 成功指標（完成形の定義）

- [ ] 担当者が 60 秒以内にロゴ入り客前 PDF を生成できる
- [ ] リニア影響シミュレーションを数値つきで顧客に説明できる
- [ ] タブレットを物件現地で開いて客と一緒に見られる
- [ ] 週 3 回以上ツールを使う担当者が各事務所に 1 名以上いる
- [ ] 口コミで他事務所 3 社以上が導入を検討する
