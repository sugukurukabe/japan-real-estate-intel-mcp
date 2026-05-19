# 名古屋市・愛知県の不動産会社向け — 使い方シナリオ集（経営者5／営業5）

ライトプレゼン・社内説明用。各パターンは **実務シチュエーション → 使うMCPツール → コピペ用プロンプト例 → 得られるアウトプット** の順です。

---

## この資料の前提（30秒で共有）

| 項目 | 内容 |
|------|------|
| **製品** | Japan Real Estate Intel MCP（AIエージェントから呼び出す不動産データ・分析ツール群） |
| **主な接続先** | ChatGPT の MCP、Claude、Cursor など **MCP対応ホスト** + 本サーバー（詳細は [chatgpt-integration.md](./chatgpt-integration.md)、[claude-desktop-setup.md](./claude-desktop-setup.md)） |
| **ブラウザのダッシュボード** | 地図・チャートなど **可視化・現地モード** に強い。レポートPDFや全ツールの分析は **チャット側からMCPツールを実行** するのが本筋 |
| **データ** | 都道府県別の同梱データ＋公式系API（設定時）。数値シミュレーションは **モデル出力であり将来を保証するものではない** |

**免責（全シナリオ共通）**  
シミュレータ・スコア・上昇率などは **意思決定の補助** です。契約・投資判断は必ず登記情報・現地確認・専門家の確認と併用してください。

### プレゼン前に必ず確認（プランとデモの落とし穴）

サーバー既定は **`DEFAULT_TIER=free`**（未設定時）。ツールごとに **Free / Pro** が分かれており、資料のシナリオの一部は **Pro 前提** です。本番デモ前に接続先のプランを確認してください（詳細は [agent-quickstart.md](./agent-quickstart.md)）。

| プラン | プレゼンでそのまま使える例 | Pro が必要になりやすい例 |
|--------|---------------------------|-------------------------|
| **Free** | `compare_prefectures`, `discover_opportunities`, `cross_analyze_real_estate_market`, `assess_property_risk`, `forecast_land_price_trend`, `scenario_what_if`, `get_chochou_profile`, `get_future_timeline`, `detect_arbitrage_signals`, `simulate_leveraged_cashflow`, `get_zoning_info` | — |
| **Pro** | 上記に加え | `generate_area_report`（PDF）, `simulate_aichi_future`, `open_dashboard`, `assess_family_friendly_score`, `drill_down_local_analysis`, `evaluate_store_location`, `analyze_renovation_yield`, `recommend_renovation_targets`, 契約系 |

**明日ライトプレゼンで Free のみのとき（おすすめ 3 本）**

1. `discover_opportunities`（愛知・投資）→「次に深掘る区」の仮説  
2. `get_future_timeline`（ward=中区）→ 名古屋の計画ストーリー  
3. `detect_arbitrage_signals` + `forecast_land_price_trend`（中村区）→ 投資家向けの根拠付き会話  

ブラウザの [ダッシュボード](https://realestate-mcp.jp/dashboard.html) は **地図・現地モード** の見せ方に使えます（MCP ツールの代替ではありません）。

---

## 目次

1. [不動産経営者向け 5パターン](#1-不動産経営者向け-5パターン)
2. [営業社員向け 5パターン](#2-営業社員向け-5パターン)
3. [接続・深掘り用リンク](#3-接続深掘り用リンク)

---

## 1. 不動産経営者向け 5パターン

### パターン1 — 経営会議：「愛知に軸足を置くべきか、他県とどう差がつくか」

| 項目 | 内容 |
|------|------|
| **プラン** | **Free** で可 |
| **シチュエーション** | 来期の仕入・販売リソース配分。名古屋圏を維持しつつ大阪・東京と比較したい。 |
| **主なツール** | `compare_prefectures` → 必要に応じ `discover_opportunities`（愛知県内の仮説カード） |
| **コピペ用プロンプト例** | `愛知県・東京都・大阪府を compare_prefectures で比較して。metrics は price, risk, investment を中心に。投資仲介の軸足として愛知の強み弱みを3行ずつ要約して。続けて discover_opportunities（prefecture=愛知県, goal=investment, horizon=3y, limit=5）で「次に深掘りすべき市区町村」を列挙して。` |
| **得られるアウトプット** | 都道府県横断の比較表・ランキング感覚、愛知内の **次に見るべきエリア仮説** の短いリスト |

---

### パターン2 — 株主・役員説明：「リニアや大規模開発を数字でどう語るか」

| 項目 | 内容 |
|------|------|
| **プラン** | `simulate_aichi_future` は **Pro**。Free デモは下段の代替プロンプトを使用 |
| **シチュエーション** | 名古屋駅周辺・笹島などの中長期ストーリーを、感覚ではなく **試算レンジ付き** で説明したい。 |
| **主なツール** | `simulate_aichi_future`（Pro）→ `get_future_timeline` → `forecast_land_price_trend` |
| **Free 代替プロンプト** | `get_future_timeline ward=中村区 と ward=中区 を実行し、リニア・再開発イベントを年次で整理。続けて forecast_land_price_trend（prefecture=愛知県, city=名古屋市中村区, horizon=5y）で方向感を要約。` |
| **コピペ用プロンプト例** | `名古屋市中区を対象に simulate_aichi_future で scenarios に linear_chuo と expo_legacy を含め、horizon=10y で試算して。続けて get_future_timeline ward=中区, chochou=（区全体なら空）。最後に forecast_land_price_trend（prefecture=愛知県, city=名古屋市中区, horizon=5y）で方向感と注意点をまとめて。` |
| **得られるアウトプット** | インフラシナリオ別の **上昇率レンジ・シグナル**、計画タイムライン、地価トレンドの一文サマリ（いずれもモデルベース） |

---

### パターン3 — ブランディング：「他社と差がつく客前資料（PDF）」

| 項目 | 内容 |
|------|------|
| **プラン** | **Pro**（`generate_area_report` の `format=pdf` とブランディング項目） |
| **シチュエーション** | 顧客提案・セミナー配布用に、**自社名入りA4 PDF** を標準化したい。 |
| **主なツール** | `generate_area_report`（`format=pdf`、ブランディング項目、取引事例オプション） |
| **コピペ用プロンプト例** | `generate_area_report で名古屋市熱田区のエリアレポートを PDF にして。prefecture=愛知県, area=名古屋市熱田区, purpose=investment, format=pdf, includeTransactionComparables=true, includeLinearImpact=true。companyName=（御社名）, agentName=（担当者名）, footerContact=（電話とメール）。免責は御社定型文があればそれを disclaimer に。` |
| **得られるアウトプット** | Markdown本文＋ **`pdfBase64`**（デコードして印刷・メール添付）。ヘッダー帯・節見出し・取引テーブル付きの体裁 |

---

### パターン4 — 金融機関・社内投資会議：「レバレッジ収支の共通フォーマット」

| 項目 | 内容 |
|------|------|
| **プラン** | **Free** で可（デモ向き） |
| **シチュエーション** | 融資相談前に、**金利・LTV・空室・税** を変えたときの10年CFを社内で揃えたい。 |
| **主なツール** | `simulate_leveraged_cashflow` |
| **コピペ用プロンプト例** | `愛知県・名古屋市中区の区分マンション想定で simulate_leveraged_cashflow を実行して。askingPrice=48000000, purchaseCost=2400000, annualRent=2160000, vacancyRate=0.08, operatingExpenseAnnual=420000, propertyTaxAnnual=120000, loan.ltvPct=70, loan.interestRatePct=1.8, loan.termYears=35, assumptions.simulationYears=10, assumptions.rentGrowthPct=0.5, assumptions.marginalTaxRatePct=20。DSCR・税引後CF・IRR が読める表形式で要約して。` |
| **得られるアウトプット** | 年次のNOI・元利返済・税引後CF・**DSCR**・感応度などの **プロフォーマ**（前提変更は同ツールで再実行） |

---

### パターン5 — コンプライアンス・品質：「契約条項と交渉アンカーの社内テンプレ」

| 項目 | 内容 |
|------|------|
| **プラン** | **Pro** |
| **シチュエーション** | 売買契約書の **リスク観点チェック** と、価格交渉・推奨特約のたたき台を揃えたい。 |
| **主なツール** | `assess_contract_risk` → `generate_contract_support_package` |
| **コピペ用プロンプト例** | `assess_contract_risk で ward=瑞穂区, chochou=田辺通一丁目, proposedTerms に売買契約の主要条項（手付解除・瑕疵担保・違約金など）をJSONで渡してリスクを整理。続けて generate_contract_support_package ward=瑞穂区, chochou=田辺通一丁目, buildingAge=15, floorArea=65, price=28000000, propertyType=mansion で交渉アンカーと推奨特約案のMarkdownを出して。` |
| **得られるアウトプット** | 条項観点のリスク整理、**交渉の論点リスト**、特約ドラフト（最終は弁護士・宅建士確認必須） |

---

## 2. 営業社員向け 5パターン

### パターン1 — 初回面談の前：「30秒〜2分でエリアの顔を掴む」

| 項目 | 内容 |
|------|------|
| **プラン** | 前半は **Free**。`open_dashboard` のみ **Pro**（省略可。ブラウザで `https://realestate-mcp.jp/dashboard.html?prefecture=aichi` でも可） |
| **シチュエーション** | 明日の顧客が「名古屋市昭和区」を気にしている。地図アプリとセットで **数値の芯** を掴みたい。 |
| **主なツール** | `get_chochou_profile` → `cross_analyze_real_estate_market` → `quick_visual_summary` →（任意）`open_dashboard` |
| **コピペ用プロンプト例** | `get_chochou_profile で ward=昭和区, chochou=御器所一丁目。人口・地価・計画の要約を箇条書きで。続けて cross_analyze_real_estate_market（prefecture=愛知県, area=名古屋市昭和区, propertyType=residential, timeRange=3y, includeRisk=true）。quick_visual_summary（prefecture=愛知県, area=名古屋市昭和区, intent=overview）。` |
| **得られるアウトプット** | 町丁目単位の **現状スナップショット**、区のクロス分析要約、ダッシュボードへの導線 |

---

### パターン2 — 商談中：「災害と用途地域をその場で説明」

| 項目 | 内容 |
|------|------|
| **プラン** | **Free** で可 |
| **シチュエーション** | 顧客が水害と「この土地建てられる？」を同時に聞いた。 |
| **主なツール** | `assess_property_risk` → `get_zoning_info` → `get_future_timeline` |
| **コピペ用プロンプト例** | `assess_property_risk prefecture=愛知県 address=名古屋市港区七番町付近 neighborhood=（分かれば）。続けて get_zoning_info prefecture=愛知県 area=名古屋市港区。都市計画・再開発の文脈は get_future_timeline ward=港区, chochou=（空で区全体可）を指定し、年次で要点だけ抽出して。` |
| **得られるアウトプット** | 浸水・地震などの **リスク要約**、用途地域等の説明材料、**計画・インフラの年次タイムライン**（名古屋市データ範囲内） |

---

### パターン3 — 投資家客：「割安・過熱とリノベ余地を一言で」

| 項目 | 内容 |
|------|------|
| **プラン** | 前半 **Free**。`analyze_renovation_yield` / `recommend_renovation_targets` は **Pro** |
| **シチュエーション** | ワンルーム投資を検討中の客に、**地価×賃料×シグナル** をセットで話したい。 |
| **主なツール** | `detect_arbitrage_signals` → `forecast_land_price_trend` → `analyze_renovation_yield` → `recommend_renovation_targets` |
| **コピペ用プロンプト例** | `detect_arbitrage_signals（prefecture=愛知県, limit=15）を実行し、結果のうち名古屋市中村区の行を重点解説。続けて forecast_land_price_trend（prefecture=愛知県, city=名古屋市中村区, horizon=5y）。analyze_renovation_yield で ward=中村区, chochou=名駅一丁目, buildingAge=28, floorArea=62, propertyType=mansion。続けて recommend_renovation_targets（buildingAge=30, floorArea=70, limit=8）で市内上位町丁目を営業トーク用1行キャッチ付きで。` |
| **得られるアウトプット** | 裁定・割安シグナル、地価トレンド、**名古屋向けリノベ利回り試算**、全区横断の **候補町丁目ランキング** |

---

### パターン4 — 居住客（ファミリー）：「学区と生活圏の根拠」

| 項目 | 内容 |
|------|------|
| **プラン** | **Pro**（`assess_family_friendly_score`, `drill_down_local_analysis`） |
| **シチュエーション** | 子育て世帯が名古屋市千種区・覚王山周辺を検討。 |
| **主なツール** | `assess_family_friendly_score` → `drill_down_local_analysis` |
| **Free 代替** | `cross_analyze_real_estate_market`（includeEducation=true）+ `get_population_outlook` + `assess_property_risk` |
| **コピペ用プロンプト例** | `assess_family_friendly_score（prefecture=愛知県, area=名古屋市千種区, neighborhood=覚王山）。続けて drill_down_local_analysis（prefecture=愛知県, city=名古屋市千種区, neighborhood=覚王山, focus=all, exportFormat=markdown）。` |
| **得られるアウトプット** | 学区・安全・災害の **スコア化された説明材料**、町丁目ドリルダウンの箇条書き |

---

### パターン5 — 店舗テナント：「出店可否のストーリーと感度」

| 項目 | 内容 |
|------|------|
| **プラン** | `evaluate_store_location` は **Pro**。`scenario_what_if` は **Free** |
| **シチュエーション** | カフェチェーンが栄・伏見のどちらで打診するか迷っている。 |
| **主なツール** | `evaluate_store_location` → `scenario_what_if` |
| **コピペ用プロンプト例** | `evaluate_store_location prefecture=愛知県 city=名古屋市中区 neighborhood=栄三丁目 storeType=cafe。続けて scenario_what_if を名古屋市中区と名古屋市熱田区で比較: scenario=new_commercial_facility, scale=medium, horizon=3y。同様に scenario=new_station で比較し、店舗出店の打診材料を箇条書きで。` |
| **得られるアウトプット** | 人流・商業・交通の **店舗向けスコア**、What-If の **定性＋簡易数値** の比較トーク材料 |

---

## 3. 接続・深掘り用リンク

| 内容 | ドキュメント |
|------|----------------|
| ChatGPT 連携 | [chatgpt-integration.md](./chatgpt-integration.md) |
| Claude Desktop | [claude-desktop-setup.md](./claude-desktop-setup.md) |
| 愛知県・名古屋のツール一覧とワークフロー詳細 | [aichi-agent-guide.md](./aichi-agent-guide.md) |
| 購入検討（購入レビュー） | [purchase-review-guide.md](./purchase-review-guide.md) |
| 契約支援の考え方 | [contract-support-guide.md](./contract-support-guide.md) |

---

*資料バージョン: MCP アプリ `japan-real-estate-intel` 想定。ツール名はサーバー実装に準拠。*
