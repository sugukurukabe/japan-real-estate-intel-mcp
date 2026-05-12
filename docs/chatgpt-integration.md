# ChatGPT Integration Guide

Japan Real Estate Intel MCP は ChatGPT Apps (MCP Apps) に対応しています。2026年1月より ChatGPT が MCP Apps をサポートしたため、**インタラクティブな地図ダッシュボード・グラフ・価格パネルが ChatGPT のチャット画面内に直接表示**されます。

## 前提条件

- ChatGPT Plus / Team / Enterprise アカウント
- MCP サーバーが `https://realestate-mcp.jp` で稼働中
- API Key を取得済み（`Authorization: Bearer <key>` ヘッダーで認証）

## App 登録手順

1. ChatGPT の設定画面で **Apps** を開く
2. **Add App** → **Custom App (MCP)** をクリック
3. 以下を入力:
   - **Name**: Japan Real Estate Intel
   - **Server URL**: `https://realestate-mcp.jp/mcp`
   - **Authentication**: Bearer Token → API Key を入力
4. **Connect** をクリック
5. ツール一覧に `search`・`fetch`・`search_area_candidates` および分析系ツールなど **合計 33 本** が表示されれば成功（クライアントの UI では折りたたみ表示のこともあります）

## 埋め込みダッシュボード（MCP Apps）

ChatGPT は MCP Apps 対応により、ツールの実行結果を**インタラクティブな UI として会話内に直接表示**できます。

迷ったら、最初は次のように聞くのが最短です:

```
愛知県の投資チャンスをChatGPT内の地図とグラフで見せて
```

この場合、ChatGPT は `quick_visual_summary` を起点に、地図・価格パネル・次アクションをまとめて表示できます。

```
User: "名古屋市中区の不動産投資リスクをリニアの影響込みで教えて"
  ↓
ChatGPT → cross_analyze_real_estate_market(...)
  ↓ テキスト分析結果 + ダッシュボード表示
  ↓
ChatGPT → open_dashboard({ prefecture: "愛知県", area: "名古屋市中区" })
  ↓ 地図・グラフ・価格パネルが会話内に表示
```

### 表示されるビジュアル

| 機能 | 内容 |
|---|---|
| **2D 地図** | Leaflet ベースの地価ヒートマップ。市区町村クリックで詳細パネル表示 |
| **3D ビュー** | Three.js による建物の立体表示と日照シミュレーション |
| **Opportunity Radar** | 全市区町村の投資機会カードをスコア順に表示 |
| **価格トライアングル** | 路線価・公示地価・取引価格を横棒グラフで比較 |
| **総合価値レーダー** | 地価・教育・交通・将来性・リスクの 5 軸レーダーチャート |
| **リノベモード** | 町丁目レベルの利回り計算（`?mode=renovation`） |
| **契約モード** | リスクマトリックス・推奨特約の生成（`?mode=contract`） |

### ダッシュボード操作

ダッシュボード内の操作は AI に自動伝達されます：

| 操作 | AI への伝達 |
|---|---|
| 都道府県を切り替え | `updateContext` で AI が把握 |
| 市区町村をクリック | `updateContext` で AI が把握 |
| レイヤーを変更 | `updateContext` で AI が把握 |
| 「深掘り」ボタン | `drill_down_local_analysis` が実行される |
| 「AIに質問」ボタン | AI チャットにメッセージが送信される |
| Opportunity カードのアクション | 対応ツールが実行される |

### 「また使う」ための便利機能

| 機能 | 使い方 |
|---|---|
| **ChatGPTで次にする** | ダッシュボード内の「深掘り」「価格三角」「比較」「レポート」ボタンから、追加質問をそのままChatGPTへ送信 |
| **会話用要約コピー** | 選択エリアの地価・リスク・人流を、ChatGPTに貼りやすい短文でコピー |
| **SVGスナップショット** | 顧客説明やメモに貼れる簡易カード形式のSVGをコピー |
| **モデルコンテキスト更新** | エリア・レイヤー変更をChatGPT側へ伝え、次の会話で文脈を維持 |

## search / fetch ワークフロー

ChatGPT の Company Knowledge / Deep Research 機能でも使えます：

```
User: "名古屋駅周辺の不動産投資について教えて"
  ↓
ChatGPT → search({ query: "名古屋 投資" })
  ↓ results: [{ id: "area:aichi:名古屋市中村区", title: "...", url: "..." }, ...]
  ↓
ChatGPT → fetch({ id: "area:aichi:名古屋市中村区" })
  ↓ { title, text (Markdown), url, metadata }
  ↓
ChatGPT: ユーザーに結果を要約して回答
```

## ID 命名規則

| プレフィックス | 形式 | 例 | 取得先 |
|---|---|---|---|
| `area:` | `area:{pref}:{city}` | `area:aichi:名古屋市中区` | cross_analyze |
| `pref:` | `pref:{key}` | `pref:tokyo` | 都道府県概要 |
| `neighborhood:` | `neighborhood:{pref}:{city}:{name}` | `neighborhood:aichi:名古屋市中区:栄` | drill_down |
| `future:` | `future:aichi:{scenario}` | `future:aichi:linear_chuo` | simulate_aichi_future |
| `tool:` | `tool:{name}` | `tool:portfolio_optimizer` | ツール情報 |
| `data:` | `data:{kind}:{pref}` | `data:land_price:tokyo` | データサマリ |

## おすすめの質問例

以下のように ChatGPT に質問するだけで、ツールが自動的に呼び出されます。ダッシュボード付きツールの場合は、地図やグラフが会話内に表示されます。

### 投資分析（ダッシュボード表示あり）

```
愛知県の投資チャンスをOpportunity Radarで見せて
```

```
東京都と大阪府の不動産市場を比較して、レーダーチャートで見せて
```

### 価格トライアングル（グラフ表示あり）

```
名古屋市で割安シグナルのあるエリアを探して
```

```
愛知県の価格トライアングルを分析して、地図で見せて
```

### リノベ利回り（専用ダッシュボード表示）

```
名古屋市中区栄の築30年マンション70㎡を買ってリノベしたら利回りはどう？
```

### 契約支援

```
中区栄三丁目の4200万円の築28年マンション、契約支援パッケージを作って
```

### レポート生成

```
名古屋市中区の不動産レポートをPDFで作って。災害リスクとリニアの影響も含めて
```

## 対応都道府県 (10)

愛知県、東京都、大阪府、福岡県、北海道、神奈川県、京都府、兵庫県、埼玉県、千葉県

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ツールが表示されない | App 未登録 or URL 誤り | Server URL が `/mcp` で終わっているか確認 |
| 401 Unauthorized | API Key 誤り | Bearer Token を再設定 |
| ダッシュボードが表示されない | ChatGPT の MCP Apps が無効 | 最新の ChatGPT を使用しているか確認 |
| search が空を返す | クエリが短すぎる | 2文字以上の具体的なキーワードを使用 |
| タイムアウト | サーバー負荷 | 時間をおいて再試行 |
