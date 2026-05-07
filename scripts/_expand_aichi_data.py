"""Expand Aichi transactions.csv and create neighborhoods.json"""

additional_transactions = """2020,Q1,名古屋市中区,伏見,office,180,306000000,1700000,2014,SRC,事務所
2020,Q2,名古屋市中区,大須,commercial,60,108000000,1800000,2016,RC,店舗
2020,Q3,名古屋市昭和区,八事,residential,145,75400000,520000,2018,RC,共同住宅
2020,Q4,名古屋市千種区,今池,commercial,70,35000000,500000,2012,RC,店舗
2020,Q4,長久手市,長久手,residential,200,38000000,190000,2015,木造,戸建住宅
2021,Q1,名古屋市中区,伏見,office,140,238000000,1700000,2010,SRC,事務所
2021,Q2,名古屋市中区,大須,commercial,55,99000000,1800000,2019,SRC,店舗
2021,Q2,名古屋市昭和区,八事,residential,150,82500000,550000,2020,RC,共同住宅
2021,Q3,名古屋市千種区,今池,commercial,75,41250000,550000,2015,RC,店舗
2021,Q4,長久手市,長久手,residential,210,42000000,200000,2018,木造,戸建住宅
2022,Q1,名古屋市中区,伏見,office,160,296000000,1850000,2016,SRC,事務所
2022,Q2,名古屋市中区,大須,commercial,65,117000000,1800000,2020,SRC,店舗
2022,Q3,名古屋市昭和区,八事,residential,135,81000000,600000,2022,RC,共同住宅
2022,Q4,名古屋市千種区,今池,commercial,80,48000000,600000,2018,RC,店舗
2022,Q4,長久手市,長久手,residential,195,42900000,220000,2020,木造,戸建住宅
2023,Q1,名古屋市中区,伏見,office,170,340000000,2000000,2018,SRC,事務所
2023,Q2,名古屋市中区,大須,commercial,70,133000000,1900000,2021,SRC,店舗
2023,Q3,名古屋市昭和区,八事,residential,140,91000000,650000,2023,RC,共同住宅
2023,Q4,名古屋市千種区,今池,commercial,85,55250000,650000,2020,RC,店舗
2023,Q4,長久手市,長久手,residential,185,44400000,240000,2022,木造,戸建住宅
2024,Q1,名古屋市中区,伏見,office,150,315000000,2100000,2022,SRC,事務所
2024,Q2,名古屋市中区,大須,commercial,60,126000000,2100000,2022,SRC,店舗
2024,Q3,名古屋市昭和区,八事,residential,130,91000000,700000,2022,RC,共同住宅
2024,Q4,名古屋市千種区,今池,commercial,75,58500000,780000,2022,RC,店舗
2024,Q4,長久手市,長久手,residential,190,49400000,260000,2023,木造,戸建住宅
2025,Q1,名古屋市中区,伏見,office,160,352000000,2200000,2024,SRC,事務所
2025,Q2,名古屋市中区,大須,commercial,65,143000000,2200000,2023,SRC,店舗
2025,Q1,名古屋市昭和区,八事,residential,125,93750000,750000,2024,RC,共同住宅
2025,Q2,名古屋市千種区,今池,commercial,70,63000000,900000,2023,RC,店舗
2025,Q1,長久手市,長久手,residential,180,52200000,290000,2024,木造,戸建住宅
2020,Q2,常滑市,セントレア,commercial,200,36000000,180000,2005,S,店舗・倉庫
2022,Q3,常滑市,セントレア,logistics,600,108000000,180000,2015,S,倉庫・物流
2024,Q1,常滑市,セントレア,logistics,800,160000000,200000,2020,S,倉庫・物流
2025,Q1,常滑市,セントレア,commercial,150,36000000,240000,2022,RC,店舗
2020,Q3,知多市,知多,residential,190,17100000,90000,2002,木造,戸建住宅
2023,Q2,知多市,知多,residential,180,21600000,120000,2015,木造,戸建住宅
2025,Q1,知多市,知多,residential,175,24500000,140000,2020,木造,戸建住宅
2020,Q1,半田市,半田,commercial,90,19800000,220000,2008,RC,店舗
2022,Q4,半田市,半田,commercial,85,21250000,250000,2015,RC,店舗
2024,Q3,半田市,半田,commercial,80,24000000,300000,2020,RC,店舗
2020,Q2,西尾市,西尾,residential,185,16650000,90000,2000,木造,戸建住宅
2022,Q1,西尾市,西尾,residential,175,19250000,110000,2010,木造,戸建住宅
2024,Q2,西尾市,西尾,residential,170,22100000,130000,2018,木造,戸建住宅
"""

with open('data/aichi/transactions.csv', 'rb') as f:
    content = f.read()

# Append additional rows
content = content + additional_transactions.encode('utf-8')

with open('data/aichi/transactions.csv', 'wb') as f:
    f.write(content)

print(f'transactions.csv expanded: now {content.count(b"\\n")} rows')

# ── Create neighborhoods.json ──────────────────────────────────────────────

import json

neighborhoods = [
  {
    "cho_me": "名駅南1丁目", "city": "名古屋市中村区",
    "population": 3240, "households": 1820,
    "avg_age": 38.2, "child_ratio": 0.11, "elderly_ratio": 0.16,
    "school": {"elementary": "中村小学校", "score": 72},
    "recent_openings": ["カフェ×3", "コンビニリニューアル", "フィットネス"],
    "human_flow_weekday": 48200,
    "human_flow_weekend": 32500,
    "notes": "リニア名古屋駅整備エリアに隣接。再開発進行中でマンション需要急増。ビジネス・外食需要旺盛。",
    "investment_score": 88,
    "tags": ["リニア直近", "再開発", "高需要"]
  },
  {
    "cho_me": "栄3丁目", "city": "名古屋市中区",
    "population": 2800, "households": 1620,
    "avg_age": 36.5, "child_ratio": 0.09, "elderly_ratio": 0.14,
    "school": {"elementary": "東桜小学校", "score": 78},
    "recent_openings": ["百貨店リニューアル", "外資系ホテル", "高級飲食店×5"],
    "human_flow_weekday": 62000,
    "human_flow_weekend": 85000,
    "notes": "名古屋最大の繁華街中心。休日人流は市内トップクラス。高単価商業需要が旺盛。",
    "investment_score": 82,
    "tags": ["繁華街", "高人流", "商業特化"]
  },
  {
    "cho_me": "覚王山1丁目", "city": "名古屋市千種区",
    "population": 2100, "households": 1100,
    "avg_age": 42.1, "child_ratio": 0.12, "elderly_ratio": 0.22,
    "school": {"elementary": "池上小学校", "score": 85},
    "recent_openings": ["ブランドショップ", "イタリアンレストラン", "ヘルスクリニック"],
    "human_flow_weekday": 18500,
    "human_flow_weekend": 24000,
    "notes": "名古屋有数の高級住宅・商業エリア。学区が良く子育て世帯に人気。マンション相場は市内上位。",
    "investment_score": 79,
    "tags": ["高級住宅", "学区優良", "安定需要"]
  },
  {
    "cho_me": "八事1丁目", "city": "名古屋市昭和区",
    "population": 1950, "households": 980,
    "avg_age": 40.8, "child_ratio": 0.13, "elderly_ratio": 0.20,
    "school": {"elementary": "川名小学校", "score": 82},
    "recent_openings": ["医療モール", "塾×2", "高級スーパー"],
    "human_flow_weekday": 22000,
    "human_flow_weekend": 19000,
    "notes": "地下鉄4路線利用圏。高台の閑静な高級住宅地。医療・教育施設が充実。",
    "investment_score": 76,
    "tags": ["高級住宅", "医療充実", "閑静"]
  },
  {
    "cho_me": "今池1丁目", "city": "名古屋市千種区",
    "population": 3100, "households": 1750,
    "avg_age": 34.2, "child_ratio": 0.10, "elderly_ratio": 0.12,
    "school": {"elementary": "千種小学校", "score": 71},
    "recent_openings": ["飲食店×8", "美容サロン×3", "コワーキングスペース"],
    "human_flow_weekday": 35000,
    "human_flow_weekend": 42000,
    "notes": "地下鉄今池駅の乗換駅。若年層・エンタメ需要が高い。飲食テナント競合が激しい一方、回転も速い。",
    "investment_score": 70,
    "tags": ["若年層", "飲食激戦", "乗換駅"]
  },
  {
    "cho_me": "伏見1丁目", "city": "名古屋市中区",
    "population": 2400, "households": 1400,
    "avg_age": 38.5, "child_ratio": 0.08, "elderly_ratio": 0.15,
    "school": {"elementary": "城西小学校", "score": 74},
    "recent_openings": ["外資系IT企業オフィス", "高級レストラン×2", "ギャラリー"],
    "human_flow_weekday": 41000,
    "human_flow_weekend": 28000,
    "notes": "オフィス集積エリア。平日ビジネス人流が多い。栄と名駅の中間で立地優位性高。",
    "investment_score": 80,
    "tags": ["オフィス集積", "ビジネス", "好立地"]
  },
  {
    "cho_me": "大須3丁目", "city": "名古屋市中区",
    "population": 2700, "households": 1500,
    "avg_age": 32.8, "child_ratio": 0.09, "elderly_ratio": 0.11,
    "school": {"elementary": "富士小学校", "score": 68},
    "recent_openings": ["ストリートフード×10", "中古電気街拡大", "コスメ店×5"],
    "human_flow_weekday": 52000,
    "human_flow_weekend": 78000,
    "notes": "名古屋の若者・観光客が集まる商業エリア。インバウンド回復で外国人客増加中。商業テナント需要が強い。",
    "investment_score": 73,
    "tags": ["若者・観光", "高人流", "商業特化"]
  },
  {
    "cho_me": "挙母町", "city": "豊田市",
    "population": 4200, "households": 1900,
    "avg_age": 39.5, "child_ratio": 0.15, "elderly_ratio": 0.18,
    "school": {"elementary": "挙母小学校", "score": 73},
    "recent_openings": ["トヨタ系カフェテリア", "EV充電ステーション", "保育所新設"],
    "human_flow_weekday": 28000,
    "human_flow_weekend": 18000,
    "notes": "豊田市中心部のビジネス・商業エリア。トヨタ本社最寄りで従業員需要が安定。EV関連投資増で活性化中。",
    "investment_score": 72,
    "tags": ["トヨタ系", "安定雇用", "EV投資"]
  },
  {
    "cho_me": "長久手中央", "city": "長久手市",
    "population": 5800, "households": 2400,
    "avg_age": 35.2, "child_ratio": 0.22, "elderly_ratio": 0.10,
    "school": {"elementary": "長久手小学校", "score": 80},
    "recent_openings": ["ジブリパーク関連カフェ", "子育て施設", "スーパー増床"],
    "human_flow_weekday": 15000,
    "human_flow_weekend": 35000,
    "notes": "愛知万博レガシー・ジブリパーク来訪者で休日人流大幅増。子育て環境が県内屈指。リニモ沿線で利便性高。",
    "investment_score": 74,
    "tags": ["子育て優良", "ジブリ効果", "リニモ沿線"]
  },
  {
    "cho_me": "金城ふ頭", "city": "名古屋市港区",
    "population": 120, "households": 50,
    "avg_age": 45.0, "child_ratio": 0.02, "elderly_ratio": 0.05,
    "school": {"elementary": "なし（工業・物流特化）", "score": 0},
    "recent_openings": ["物流倉庫×3", "自動化設備投資", "冷凍・冷蔵倉庫"],
    "human_flow_weekday": 12000,
    "human_flow_weekend": 8000,
    "notes": "名古屋港ダイレクトアクセスの物流特化エリア。e-commerce拡大で倉庫需要が急増。",
    "investment_score": 68,
    "tags": ["物流特化", "港湾直結", "倉庫需要"]
  }
]

with open('data/aichi/neighborhoods.json', 'w', encoding='utf-8') as f:
    json.dump(neighborhoods, f, ensure_ascii=False, indent=2)

print(f'neighborhoods.json created with {len(neighborhoods)} records')
