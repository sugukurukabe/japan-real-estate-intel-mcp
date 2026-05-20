# 3分デモ動画 — 台本（愛知・Free 3本）

**用途:** YouTube / X / note / 名古屋プレゼン後フォロー / Smithery 掲載  
**録画:** `pnpm run demo:record` → `docs/screenshots/demo-preview.webm`  
**GIF（30秒）:** 下記「GIF 作成」を参照

---

## 事前準備

- ブラウザ 1280×800（DevTools → Responsive）
- MCP ホスト: Claude / Cursor（Free tier、Pro ツールは使わない）
- URL: https://realestate-mcp.jp/dashboard.html?prefecture=aichi

---

## 0:00–0:30 オープニング（ダッシュボード）

1. ダッシュボードを表示（愛知・地価ヒートマップ）
2. ナレーション（日）:
   > 日本不動産インテリジェンス MCP。10都道府県の地価・災害・人流を、Claude や Cursor からそのまま分析できます。
3. 英字幕（任意）:
   > Japan Real Estate Intel MCP — cross-analysis for 10 prefectures in Claude or Cursor.

---

## 0:30–1:30 デモ1 — 投資機会（Free）

**プロンプト（コピペ）:**

```
discover_opportunities で愛知県の investment 向けエリアを探して、上位3件を表でまとめて。
```

- 結果のスコア・シグナルをズーム
- 「API ラッパーではなく、業者ワークフロー向け」と一言

---

## 1:30–2:15 デモ2 — 名古屋タイムライン（Free）

**プロンプト:**

```
get_future_timeline を ward=中区 で実行し、今後5年のインフラ・地価への影響を3行で要約して。
```

---

## 2:15–2:45 デモ3 — 価格三角測量（Free）

**プロンプト:**

```
detect_arbitrage_signals を prefecture=aichi で実行し、discount シグナルがある市区町村を教えて。
```

---

## 2:45–3:00 クロージング

- ダッシュボードに戻す
- 表示: `npx @sugukuru/japan-real-estate-intel-mcp`
- リンク: GitHub · Registry 検索 · [agent-quickstart.md](./agent-quickstart.md)
- **Pro 機能（PDF・契約）は別プラン** とテロップ

---

## GIF 作成（README / Smithery 用）

### 方法A — Windows（ScreenToGif）

1. ScreenToGif で 1280×800、15秒
2. ダッシュボードの地価レイヤー切替 + 右パネルスコア
3. `docs/screenshots/demo-30s.gif` として保存

### 方法B — ffmpeg（webm から）

```powershell
pnpm run demo:record
ffmpeg -i docs/screenshots/demo-preview.webm -vf "fps=10,scale=640:-1" -t 30 docs/screenshots/demo-30s.gif
```

### 方法C — 静止画で代替

`docs/screenshots/dashboard-overview.png` を README ヒーローとして使用（掲載済み）

---

## 配信チェックリスト

- [ ] YouTube（タイトル: 日本不動産 MCP — 愛知10都道府県クロス分析）
- [ ] X スレッド（GIF + 3プロンプト）
- [ ] note（日本語記事化）
- [ ] [nagoya-pitch-followup.md](./nagoya-pitch-followup.md) に動画 URL を追記
