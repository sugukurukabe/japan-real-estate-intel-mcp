#!/usr/bin/env python3
"""
Prefecture Completion Kit — Data File Setup Script
Usage: python scripts/prefecture-setup.py --prefecture tokyo --name "東京都"

Generates stub data files for a new prefecture under data/{prefecture}/
so the new loader can be registered immediately and refined later.
"""

import argparse
import json
import os
import csv

STUB_LAND_PRICES = [
    ("2020", "city_center", "250000", "1.2"),
    ("2021", "city_center", "255000", "2.0"),
    ("2022", "city_center", "262000", "2.7"),
    ("2023", "city_center", "270000", "3.1"),
    ("2024", "city_center", "280000", "3.7"),
    ("2025", "city_center", "292000", "4.3"),
]

STUB_TRANSACTIONS = """year,quarter,city,district,property_type,area_sqm,price_total,price_per_sqm,building_year,structure,use
2022,Q1,{city_center},中心部,office,120,180000000,1500000,2015,SRC,事務所
2022,Q2,{city_center},中心部,commercial,80,96000000,1200000,2018,RC,店舗
2022,Q3,{city_center},中心部,residential,95,47500000,500000,2020,RC,共同住宅
2022,Q4,{city_center},郊外,residential,180,27000000,150000,2010,木造,戸建住宅
2023,Q1,{city_center},中心部,office,150,247500000,1650000,2018,SRC,事務所
2023,Q2,{city_center},中心部,commercial,90,117000000,1300000,2020,SRC,店舗
2023,Q3,{city_center},中心部,residential,100,55000000,550000,2022,RC,共同住宅
2023,Q4,{city_center},郊外,residential,170,28900000,170000,2012,木造,戸建住宅
2024,Q1,{city_center},中心部,office,130,228800000,1760000,2020,SRC,事務所
2024,Q2,{city_center},中心部,commercial,85,127500000,1500000,2022,SRC,店舗
2024,Q3,{city_center},中心部,residential,90,54000000,600000,2023,RC,共同住宅
2024,Q4,{city_center},郊外,residential,175,31500000,180000,2015,木造,戸建住宅
2025,Q1,{city_center},中心部,office,140,252000000,1800000,2023,SRC,事務所
2025,Q2,{city_center},中心部,commercial,75,135000000,1800000,2024,SRC,店舗
"""

STUB_EARTHQUAKE = {
    "type": "FeatureCollection",
    "features": [],
    "metadata": {
        "source": "気象庁・都道府県ハザードマップ（スタブデータ）",
        "max_seismic_intensity": "6弱",
        "note": "実データ取得後に更新してください"
    }
}

STUB_FLOOD = {
    "type": "FeatureCollection",
    "features": [],
    "metadata": {
        "source": "国土交通省ハザードマップポータル（スタブデータ）",
        "note": "実データ取得後に更新してください"
    }
}

STUB_MUNICIPALITIES_TOPO = {
    "type": "Topology",
    "objects": {"municipalities": {"type": "GeometryCollection", "geometries": []}},
    "arcs": [],
    "metadata": {"note": "実データ取得後に更新してください"}
}

STUB_FUTURE_INFRA = [
    {
        "project": "（プロジェクト名を追記してください）",
        "type": "rail",
        "status": "planning",
        "opening_estimate": "20XX年",
        "primary_cities": [],
        "impact_cities": [],
        "peak_uplift_pct": 0,
        "notes": "都道府県固有のインフラ情報を記述してください"
    }
]


def write_csv(path: str, header: list, rows: list):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description='Prefecture data setup')
    parser.add_argument('--prefecture', required=True, help='Prefecture key (e.g. tokyo)')
    parser.add_argument('--name', required=True, help='Prefecture display name (e.g. 東京都)')
    parser.add_argument('--city-center', default='', help='Main city (e.g. 新宿区)')
    args = parser.parse_args()

    pref = args.prefecture.lower()
    name = args.name
    city = args.city_center or f'{name}中心部'

    data_dir = os.path.join('data', pref)
    os.makedirs(data_dir, exist_ok=True)
    print(f'Setting up {name} ({pref}) in {data_dir}/')

    # land_prices.csv
    lp_path = os.path.join(data_dir, 'land_prices.csv')
    if not os.path.exists(lp_path):
        write_csv(lp_path, ['year', 'city', 'price_yen_per_sqm', 'change_pct'],
                  [[yr, city, price, chg] for yr, _, price, chg in STUB_LAND_PRICES])
        print(f'  Created land_prices.csv')

    # transactions.csv
    tx_path = os.path.join(data_dir, 'transactions.csv')
    if not os.path.exists(tx_path):
        content = STUB_TRANSACTIONS.format(city_center=city).strip()
        with open(tx_path, 'w', encoding='utf-8') as f:
            f.write(content + '\n')
        print(f'  Created transactions.csv (14 stub rows)')

    # population.csv
    pop_path = os.path.join(data_dir, 'population.csv')
    if not os.path.exists(pop_path):
        write_csv(pop_path,
                  ['year', 'city', 'population', 'households', 'pop_density', 'daytime_population'],
                  [['2020', city, '100000', '50000', '3000.0', '120000'],
                   ['2025', city, '102000', '51500', '3060.0', '125000']])
        print(f'  Created population.csv')

    # human_flow.csv
    hf_path = os.path.join(data_dir, 'human_flow.csv')
    if not os.path.exists(hf_path):
        write_csv(hf_path,
                  ['area', 'weekday_avg', 'weekend_avg', 'avg_stay_minutes', 'trend', 'peak_hour'],
                  [[city, '25000', '18000', '45', 'stable', '18:00-19:00']])
        print(f'  Created human_flow.csv')

    # school_districts.csv
    sd_path = os.path.join(data_dir, 'school_districts.csv')
    if not os.path.exists(sd_path):
        write_csv(sd_path,
                  ['city', 'school_name', 'level', 'avg_score', 'advancement_rate'],
                  [[city, f'{city}小学校', 'elementary', '72', '68'],
                   [city, f'{city}中学校', 'junior_high', '70', '85']])
        print(f'  Created school_districts.csv')

    # corporate_locations.csv
    cl_path = os.path.join(data_dir, 'corporate_locations.csv')
    if not os.path.exists(cl_path):
        write_csv(cl_path,
                  ['city', 'total_establishments', 'major_companies', 'industry_mix'],
                  [[city, '1200', '15', 'mixed']])
        print(f'  Created corporate_locations.csv')

    # crime_stats.csv
    cr_path = os.path.join(data_dir, 'crime_stats.csv')
    if not os.path.exists(cr_path):
        write_csv(cr_path,
                  ['year', 'city', 'total_incidents', 'per_1000', 'trend'],
                  [['2024', city, '450', '4.5', 'decreasing']])
        print(f'  Created crime_stats.csv')

    # transport.csv
    tr_path = os.path.join(data_dir, 'transport.csv')
    if not os.path.exists(tr_path):
        write_csv(tr_path,
                  ['city', 'station_name', 'daily_passengers', 'lines', 'operator'],
                  [[city, f'{pref.capitalize()}駅', '50000', '2', '各社']])
        print(f'  Created transport.csv')

    # commercial_facilities.csv
    cf_path = os.path.join(data_dir, 'commercial_facilities.csv')
    if not os.path.exists(cf_path):
        write_csv(cf_path,
                  ['city', 'facility_type', 'name', 'gfa_sqm'],
                  [[city, 'shopping_center', f'{name}モール', '25000'],
                   [city, 'supermarket', 'スーパー', '1500']])
        print(f'  Created commercial_facilities.csv')

    # medical_facilities.csv
    mf_path = os.path.join(data_dir, 'medical_facilities.csv')
    if not os.path.exists(mf_path):
        write_csv(mf_path,
                  ['city', 'facility_type', 'name', 'beds'],
                  [[city, 'general_hospital', f'{name}総合病院', '400'],
                   [city, 'clinic', f'{name}クリニック', '0']])
        print(f'  Created medical_facilities.csv')

    # neighborhoods.csv
    nb_path = os.path.join(data_dir, 'neighborhoods.csv')
    if not os.path.exists(nb_path):
        write_csv(nb_path,
                  ['cho_me', 'city', 'population', 'households', 'avg_age',
                   'child_ratio', 'elderly_ratio', 'daytime_pop_ratio'],
                  [[f'{city}中心', city, '3000', '1500', '38.5', '0.12', '0.18', '1.3']])
        print(f'  Created neighborhoods.csv')

    # earthquake.json
    eq_path = os.path.join(data_dir, 'earthquake.json')
    if not os.path.exists(eq_path):
        with open(eq_path, 'w', encoding='utf-8') as f:
            json.dump(STUB_EARTHQUAKE, f, ensure_ascii=False, indent=2)
        print(f'  Created earthquake.json')

    # flood.geojson
    fl_path = os.path.join(data_dir, 'flood.geojson')
    if not os.path.exists(fl_path):
        with open(fl_path, 'w', encoding='utf-8') as f:
            json.dump(STUB_FLOOD, f, ensure_ascii=False, indent=2)
        print(f'  Created flood.geojson')

    # municipalities.topojson
    mu_path = os.path.join(data_dir, 'municipalities.topojson')
    if not os.path.exists(mu_path):
        with open(mu_path, 'w', encoding='utf-8') as f:
            json.dump(STUB_MUNICIPALITIES_TOPO, f, ensure_ascii=False, indent=2)
        print(f'  Created municipalities.topojson')

    # future_infrastructure.json
    fi_path = os.path.join(data_dir, 'future_infrastructure.json')
    if not os.path.exists(fi_path):
        with open(fi_path, 'w', encoding='utf-8') as f:
            json.dump(STUB_FUTURE_INFRA, f, ensure_ascii=False, indent=2)
        print(f'  Created future_infrastructure.json (stub - please update)')

    print(f'\nDone! Next steps:')
    print(f'  1. Create src/data-loaders/{pref}-loader.ts (see docs/prefecture-completion-kit.md)')
    print(f'  2. Register in src/data-loaders/index.ts')
    print(f'  3. Replace stub data files with real data')
    print(f'  4. Update future_infrastructure.json with local projects')
    print(f'  5. Run: npm run build && npm test')


if __name__ == '__main__':
    main()
