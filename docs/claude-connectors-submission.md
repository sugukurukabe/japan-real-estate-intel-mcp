# Claude Connectors Directory — 申請ガイド

**公式ドキュメント:**
[Submitting to the Connectors Directory](https://claude.com/docs/connectors/building/submission) ·
[Pre-submission checklist](https://claude.com/docs/connectors/building/review-criteria) ·
[Authentication for connectors](https://claude.com/docs/connectors/building/authentication)

**前提:** Claude.ai の **Team または Enterprise** organization で、Organization Owner（または Directory management 権限を付与されたメンバー）であること。個人プランからは admin settings にアクセスできない。申請は Claude.ai の管理画面内「submission portal」から行う（本リポジトリのCIやコマンドでは自動化できない、壁アカウントでの手動操作が必要）。

**登録タイプ:** Remote MCP server（Streamable HTTP, `https://realestate-mcp.jp/mcp`）。MCP Apps（ダッシュボードウィジェット）を含むため、カルーセルスクリーンショットが追加で必要。

---

## 0. 事前チェック（コード側は完了済み）

v8.0.0 の時点で [Pre-submission checklist](https://claude.com/docs/connectors/building/review-criteria) の各項目に対応済み:

| チェック項目 | 対応状況 |
|---|---|
| 全ツールに `title` + `readOnlyHint`/`destructiveHint` | ✅ 全38ツール。本サーバーは読み取り専用（データ分析）のみで destructive tool は存在しない |
| read/write の分離 | ✅ 該当なし（write操作なし） |
| カスタムクエリツールにAPI名を明記 | ✅ `search`/`fetch`（データカタログ内検索、外部API不使用）。外部APIを呼ぶツール（`assess_exterior_visuals`ほか）はdescriptionにAPI名を明記済み |
| ツール名64文字以内 | ✅ |
| プロンプトインジェクション対策 | ✅ descriptionは「何をするか」のみを記述、Claudeへの指示・外部ソース読み込み指示なし |
| 汎用エラーでなく具体的なエラーメッセージ | ✅ 入力検証エラーは修正方法を含める（zodスキーマ + カスタムエラーメッセージ） |
| API所有権（自社API or 正当なプロキシ） | ✅ 国土交通省（MLIT）・e-Stat・国税庁（路線価）等の公開政府統計APIを正当に集約・分析。詳細は「4. Data handling」参照 |
| 禁止用途（金融取引・AI画像/音声生成） | ✅ 該当なし。`assess_exterior_visuals`はGemini Visionで**既存画像の分析**のみ行い、画像生成はしない |
| 公開ドキュメント | ✅ README.md（英語+日本語）、[docs/free-demo-prompts.md](./free-demo-prompts.md) |
| プライバシーポリシー | ✅ https://realestate-mcp.jp/privacy-policy.html（HTTPS、データ収集・保持・第三者共有・連絡先を記載） |

---

## 1. Connection（接続情報）

| フィールド | 値 |
|---|---|
| Server URL | `https://realestate-mcp.jp/mcp` |
| Transport | Streamable HTTP |
| 接続方式 | 全ユーザーが同じURLに接続（マルチテナントではない。ユーザー別URLではない） |

---

## 2. Tools / Prompts / Resources

サーバー接続後、ポータルが自動的に同期する。事前確認コマンド:

```bash
pnpm build && pnpm test tests/tool_annotations.test.ts tests/output_schemas.test.ts
```

- 38ツール全てに `title` と `annotations`（`readOnlyHint: true`, `idempotentHint: true`, 該当ツールは `openWorldHint: true`）が設定済み（`tests/tool_annotations.test.ts` で担保）。
- `title`欠落や`annotations`欠落のツールがあればポータル側で警告表示される想定 — 現状ゼロのはず。ゼロでなければ申請前に `src/server.ts` を修正すること。

---

## 3. Listing（公開情報）

| フィールド | 制限 | 値（案） |
|---|---|---|
| Server name | 100文字以内 | `Japan Real Estate Intel` |
| Tagline | 55文字以内 | `Cross-analyze Japanese real estate — 10 prefectures, no login required` |
| Description | 2,000文字以内 | README.md 冒頭の英語説明 + 主要機能一覧（[external-listing-copy.md](./external-listing-copy.md) の英語版をベースに調整） |
| Categories | 1〜5個 | Real Estate / Data & Analytics / Research（ポータルの選択肢に合わせて調整） |
| Documentation URL | — | `https://github.com/sugukurukabe/japan-real-estate-intel-mcp#readme` |
| Privacy Policy URL | — | `https://realestate-mcp.jp/privacy-policy.html` |
| Support contact | — | `info@sugu-kuru.co.jp` |
| Icon | — | `assets/logo.svg` を元にPNGを用意（要 512×512等、ポータルの指定サイズに合わせる） |
| URL slug | **公開後は変更不可** | `japan-real-estate-intel`（他候補と衝突する場合は `japan-real-estate-intel-mcp`） |

MCP Apps のカルーセルスクリーンショット仕様（PNG, 幅1000px以上, 3〜5枚, アプリ応答部分のみをクロップ、プロンプト文言は画像に含めない）:

- `docs/screenshots/dashboard-overview.png`
- `docs/screenshots/comparison-mode.png`
- `docs/screenshots/cashflow-mode.png`
- `docs/screenshots/investment-mode.png`
- `docs/screenshots/3d-view.png`

再生成: `pnpm run build:ui && pnpm run screenshots`（Playwright Chromiumが必要、初回のみ `pnpm exec playwright install chromium`）。各画像に対応するプロンプト文言は [free-demo-prompts.md](./free-demo-prompts.md) を参照して個別に用意する。

---

## 4. Use cases / Data handling

**Use cases:**
- 主な用途: 日本の不動産データ（地価・取引価格・災害リスク・人口統計・用途地域など）のクロス分析、投資判断支援、店舗出店戦略、契約支援。
- 接続前に必要なもの: **なし**（アカウント登録不要）。Pro/Enterprise機能はツール引数 `_licenseKey`（Stripe購入後に発行）で任意に解放。
- 読み取り/書き込み: **読み取りのみ**（データ分析結果を返すのみで、外部システムへの書き込みは一切行わない）。

**Data handling:**
- 提供データの一部（地価・路線価・人口統計等）は日本の政府機関（国土交通省・e-Stat・国税庁）が公開する統計データを取得・キャッシュして提供 — 「第三者のAPIだが正当に利用・プロキシしている」に該当。利用規約上の制限や出典表記は各ツールのレスポンスに `attribution` フィールドとして自動付与（`ATTRIBUTION`定数、`src/server.ts`）。
- 一部ツール（`assess_exterior_visuals`, `analyze_commute_accessibility`, `discover_opportunities`, `composite_value_score`, `get_real_estate_macro_snapshot`, `detect_arbitrage_signals`）は任意でGoogle Maps API / Gemini APIを呼び出す（`openWorldHint: true`）。APIキー未設定時はモック/フォールバックデータで動作するため、審査環境でのAPIキー提供は必須ではない。
- 個人の医療データ・スポンサードコンテンツは扱わない。

---

## 5. Company

| フィールド | 値 |
|---|---|
| Company name | 株式会社スグクル (Sugukuru Inc.) |
| Website | https://realestate-mcp.jp |
| Review contact | 申請者（壁）のアカウント情報が自動入力される |

---

## 6. Authentication — **`No authentication` を選択する**

本サーバーは [authentication types](https://claude.com/docs/connectors/building/authentication) のうち `none`（authless server）に該当する。OAuthやAPIキーの入力欄は不要。

- **選ぶ理由**: 本サーバーはユーザーごとのアカウント/データを持たない公開データ集約サービス。以前の実装は自前OAuth（DCR未実装・auto-approve）だったが、公式ドキュメントで「no authentication」が正式サポート対象であると確認できたため（本ガイド作成時点、`authentication` ページ参照）、無理にOAuthを実装するより誠実な選択として撤去した（v8.0.0 changelog参照）。
- Pro/Enterprise 機能は Claude 側の認証機構ではなく、**ツール引数 `_licenseKey`**（ECDSA署名済みライセンスキー、Stripe決済後に発行）で制御する。ポータルの「Authentication」ステップにはこの仕組みは現れないため、"Use cases" フィールドの自由記述欄で補足説明する（上記4.参照）。
- 自己ホスト時のみ有効な `API_KEY` 環境変数（HTTPトランスポートの `X-Api-Key` ヘッダー）は、ディレクトリ経由の接続では設定しない想定（`https://realestate-mcp.jp/mcp` は公開エンドポイントとして `API_KEY` 未設定で運用する）。

---

## 7. Test & launch

- **テストアカウント**: 不要（無認証）。レビュアーはURLをそのまま custom connector として追加し、[free-demo-prompts.md](./free-demo-prompts.md) の3プロンプトをそのまま実行できる。
- **Freeティアの上限に注意**: 無認証の公開接続はデフォルトで`free`ティア扱いとなり、`TIER_MONTHLY_TOOL_CALLS`（既定50）でMCPセッションごとに月間ツール呼び出し数がソフト制限される。レビュアーが多数のツールを連続で試す場合、上限に到達すると一部ツールが「アップグレードをご検討ください」エラーを返す — これは既知の挙動であり不具合ではないが、レビュー用メモ欄で「Freeティアの月間上限に達した場合は下記デモキーの`X-License-Key`ヘッダーで再試行可能」と案内しておく。
- **Pro/Enterprise機能の確認用**: レビュアーが全38ツール（PDF生成・契約支援・ゾーニング監査等のPro限定ツールを含む）を試したい場合に備えて、期限付きのデモライセンスキーを1つ発行し、レビュー用メモ欄に記載する。`enterprise`ティアは`isToolAllowed()`が無条件でtrueを返すため、tier別のツールリスト差分を気にせず全ツールを保証できる — `pro`ではなく`enterprise`を指定する。本番の `LICENSE_PRIVATE_KEY_PEM`（本番サーバーの環境変数。リポジトリには存在しない）を使い次のように発行する（詳細は[docs/licensing-and-stripe-integration.md](./licensing-and-stripe-integration.md)）:
  ```bash
  LICENSE_PRIVATE_KEY_PEM="$(...)" node scripts/generate-license.js "Claude Reviewer" enterprise 3
  ```
  有効期限（上記コマンドの月数、既定3ヶ月）は審査完了予想日+マージンに調整する。発行したキーはレビュー用メモ欄に「`X-License-Key`ヘッダーまたはツール引数`_licenseKey`に以下を設定すると全機能を確認できます」と添えて記載する。
- 申請前に必須: 全ツールをMCP Inspectorおよび実際のCustom Connector（Claude.ai > Settings > Connectors > Add custom connector）で一度実行して動作確認する（[Testing your connector](https://claude.com/docs/connectors/building/testing)）。ローカル開発サーバーをテストする場合は Cloudflare Tunnel / ngrok 等で公開URLを用意する。

---

## 8. Compliance

7項目のポリシー確認（ディレクトリガイドライン・first-party API使用・金融取引不可・AI画像生成不可・プロンプトインジェクション不可・会話データ収集不可・公開ドキュメント必須）全てに同意できる状態— 上記「0. 事前チェック」で確認済み。

---

## 申請前チェックリスト（人手作業・壁のアカウントが必要）

CI/スクリプトでは代行不可な最終手動確認。上から順に実施する:

- [ ] **本番URLの動作確認**: `https://realestate-mcp.jp` に `API_KEY` が設定されていないことを確認（設定済みだと401で全接続が失敗する）。`curl https://realestate-mcp.jp/health` が `{"status":"ok","version":"8.0.0",...}` を返すことを確認。
- [ ] **実際のCustom Connectorとして接続**: Claude.ai > Settings > Connectors > Add custom connector に `https://realestate-mcp.jp/mcp` を追加し、[free-demo-prompts.md](./free-demo-prompts.md) の3プロンプトを実行して結果とダッシュボードウィジェットが正しく表示されることを確認する。
- [ ] **Pro/Enterpriseデモキーの発行**: 上記「7. Test & launch」の手順で`enterprise`ティアの期限付きキーを発行し、`X-License-Key`ヘッダー経由で `generate_area_report`（PDFアーティファクト）など最低1つのPro限定ツールが実際に解放されることを本番URLに対して確認する。
- [ ] **カルーセルスクリーンショット最終確認**: `pnpm run build:ui && pnpm run screenshots` を実行し、`docs/screenshots/` の5枚（`dashboard-overview` / `comparison-mode` / `investment-mode` / `cashflow-mode` / `3d-view`）が実際のUIと一致していることを目視確認する。
- [ ] **npm公開の確認**: `npm view @sugukuru/japan-real-estate-intel-mcp version` が `8.0.0` を返すこと（`.github/workflows/release.yml` の `NPM_TOKEN` シークレットが設定されタグpush済みであること。未公開なら [docs/publish-secrets-setup.md](./publish-secrets-setup.md) を参照して先に公開する）。
- [ ] **MCP Registry公開の確認**: https://registry.modelcontextprotocol.io/v0.1/servers?search=japan-real-estate-intel の `version` が `8.0.0` であること（`.github/workflows/registry-publish.yml` の `MCP_REGISTRY_TOKEN` シークレット必須）。
- [ ] **GHCR (Docker) 公開の確認**: `docker pull ghcr.io/sugukurukabe/japan-real-estate-intel-mcp:8.0.0` が成功すること（`.github/workflows/docker.yml`、`test`ジョブ成功後に`build-push`が実行される）。
- [ ] **Team/Enterprise submission portalから申請**: Claude.ai の Directory management 権限を持つ壁のアカウントで submission portal を開き、本ドキュメントの1〜8節の内容を転記して申請する。

## 申請後

- [listing-checklist.md](./listing-checklist.md) の `Claude Connectors Directory` セクションにチェックを入れる
- レビュー結果・フィードバックは Claude.ai の submissions dashboard で確認（[Managing your listing](https://claude.com/docs/connectors/directory)）
- エスカレーションが必要な場合: `mcp-review@anthropic.com`

## 関連

- [registry-submission.md](./registry-submission.md) — Anthropic MCP Registry（開発者向けレジストリ、本ディレクトリとは別物・ドメイン所有権証明が別途必要）
- [openai-apps-submission.md](./openai-apps-submission.md) — ChatGPT Apps Directory
- [free-demo-prompts.md](./free-demo-prompts.md)
- [SECURITY.md](../SECURITY.md)
