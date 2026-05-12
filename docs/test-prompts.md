# Test Prompts for OpenAI Apps Directory Submission

These prompts and expected responses are for the OpenAI Apps Directory review process.

---

## Test 1: Land Price Forecast

**Prompt (EN):**
> Forecast land price trends for Shinjuku, Tokyo over the next 5 years.

**Prompt (JP):**
> 東京都新宿区の今後5年間の地価トレンドを予測してください。

**Expected Tool Call:**
```json
{ "tool": "forecast_land_price_trend", "args": { "prefecture": "東京都", "city": "新宿区", "horizon": "5y" } }
```

**Expected Output Contains:**
- CAGR (compound annual growth rate) as a percentage
- Trend direction (up/flat/down)
- Investment signal (buy/hold/caution)
- Confidence interval
- Markdown-formatted report

---

## Test 2: Disaster Risk Assessment

**Prompt (EN):**
> Assess the disaster risk for Nagoya's Naka ward — flood, earthquake, and landslide.

**Prompt (JP):**
> 名古屋市中区の災害リスク（浸水・地震・土砂災害）を評価してください。

**Expected Tool Call:**
```json
{ "tool": "assess_property_risk", "args": { "prefecture": "愛知県", "area": "名古屋市中区" } }
```

**Expected Output Contains:**
- Overall risk score (0-100)
- Flood risk level
- Earthquake risk assessment
- Price adjustment rate recommendation
- Key risk insights

---

## Test 3: Store Location Evaluation

**Prompt (EN):**
> Evaluate Hakata, Fukuoka as a location for opening a cafe targeting office workers.

**Prompt (JP):**
> 福岡市博多区でオフィスワーカー向けカフェの出店適地を評価してください。

**Expected Tool Call:**
```json
{ "tool": "evaluate_store_location", "args": { "prefecture": "福岡県", "city": "福岡市博多区", "storeType": "cafe", "targetCustomer": "office_worker" } }
```

**Expected Output Contains:**
- Overall suitability score (0-100)
- 8-axis breakdown (foot traffic, population density, disaster risk, competition, transport, education, commercial, medical)
- Competitor analysis
- Differentiation suggestions
- Markdown report

---

## Test 4: Prefecture Comparison

**Prompt (EN):**
> Compare Tokyo, Osaka, and Aichi prefectures for real estate investment potential.

**Prompt (JP):**
> 東京都・大阪府・愛知県の不動産投資ポテンシャルを比較してください。

**Expected Tool Call:**
```json
{ "tool": "compare_prefectures", "args": { "prefectures": ["東京都", "大阪府", "愛知県"], "metrics": ["land_price", "population", "risk", "investment"] } }
```

**Expected Output Contains:**
- Scores per prefecture per metric
- Rankings
- Radar chart data (normalized values)
- Best-for recommendations (investment/safety/growth)
- Markdown report with comparison tables

---

## Test 5: Renovation Yield Analysis

**Prompt (EN):**
> Analyze the renovation yield for a 60 sqm apartment in Nagoya's Naka ward.

**Prompt (JP):**
> 名古屋市中区の60㎡マンションのリノベ利回りを分析してください。

**Expected Tool Call:**
```json
{ "tool": "analyze_renovation_yield", "args": { "ward": "中区", "area_sqm": 60, "property_type": "mansion", "building_age_years": 30 } }
```

**Expected Output Contains:**
- Estimated acquisition price
- Renovation cost estimate
- Expected monthly rent
- Gross yield percentage
- Net yield percentage
- Future plan upside factors
- Markdown report
