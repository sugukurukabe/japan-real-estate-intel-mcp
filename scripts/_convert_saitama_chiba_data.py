"""Convert saitama/chiba CSV data files to formats expected by the loaders"""
import csv, json, io, os

PROB_MAP = {'high': 0.8, 'medium': 0.5, 'low': 0.2}
LIQ_MAP = {'high': 'high', 'medium': 'medium', 'low': 'low'}
INTENSITY_MAP = {'high': '7', 'medium': '6強', 'low': '5強'}

for pref in ['saitama', 'chiba']:
    base = f'data/{pref}'

    # ── 1. earthquake_risk.csv → earthquake.json ────────────────────────────
    eq_path = f'{base}/earthquake_risk.csv'
    if os.path.exists(eq_path):
        with open(eq_path, 'rb') as f:
            raw = f.read().decode('utf-8-sig')
        rows = list(csv.DictReader(io.StringIO(raw)))
        eq_data = []
        for r in rows:
            city = r.get('city', '')
            intensity = INTENSITY_MAP.get(r.get('seismic_intensity_30yr', 'medium'), '6強')
            prob = PROB_MAP.get(r.get('seismic_intensity_30yr', 'medium'), 0.5)
            liq = LIQ_MAP.get(r.get('liquefaction_risk', 'medium'), 'medium')
            notes = r.get('notes', '')
            eq_data.append({
                'city': city,
                'max_intensity': intensity,
                'probability_30y': prob,
                'liquefaction_risk': liq,
                'description': notes or f'{city}の地震リスク情報。',
            })
        out_path = f'{base}/earthquake.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(eq_data, f, ensure_ascii=False, indent=2)
        print(f'Created {out_path} ({len(eq_data)} records)')

    # ── 2. flood_risk.csv → flood.geojson ───────────────────────────────────
    flood_path = f'{base}/flood_risk.csv'
    if os.path.exists(flood_path):
        with open(flood_path, 'rb') as f:
            raw = f.read().decode('utf-8-sig')
        rows = list(csv.DictReader(io.StringIO(raw)))
        features = []
        coords_base = (35.86, 139.64) if pref == 'saitama' else (35.60, 140.10)
        for i, r in enumerate(rows):
            city = r.get('city', '')
            district = r.get('district', city)
            hazard = r.get('hazard_zone', 'none')
            river_risk = r.get('river_flood_risk', 'low')
            lat = coords_base[0] + (i % 5) * 0.02
            lng = coords_base[1] + (i // 5) * 0.02
            features.append({
                'type': 'Feature',
                'properties': {
                    'city': city,
                    'district': district,
                    'hazard_zone': hazard,
                    'river_flood_risk': river_risk,
                    'notes': r.get('notes', ''),
                },
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [lng - 0.005, lat - 0.005],
                        [lng + 0.005, lat - 0.005],
                        [lng + 0.005, lat + 0.005],
                        [lng - 0.005, lat + 0.005],
                        [lng - 0.005, lat - 0.005],
                    ]],
                },
            })
        geojson = {'type': 'FeatureCollection', 'features': features}
        out_path = f'{base}/flood.geojson'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False)
        print(f'Created {out_path} ({len(features)} features)')

    # ── 3. municipalities.json → municipalities.topojson (stub FeatureCollection) ──
    muni_path = f'{base}/municipalities.json'
    topo_path = f'{base}/municipalities.topojson'
    if os.path.exists(muni_path) and not os.path.exists(topo_path):
        with open(muni_path, 'rb') as f:
            muni_data = json.loads(f.read().decode('utf-8'))

        # Get municipalities list from either format
        if isinstance(muni_data, dict) and 'municipalities' in muni_data:
            munis = muni_data['municipalities']
        elif isinstance(muni_data, list):
            munis = muni_data
        else:
            munis = []

        # Create minimal topojson-compatible FeatureCollection stub
        # We'll create a simple GeoJSON file that topojson-client can handle
        # Actually the loader uses loadTopoJson so we need a real topojson
        # Let's create a minimal valid topojson
        coords_base = (35.86, 139.64) if pref == 'saitama' else (35.60, 140.10)
        geometries = []
        for i, m in enumerate(munis[:20]):
            name = m.get('name', f'市{i}')
            lat = coords_base[0] + (i % 5) * 0.05
            lng = coords_base[1] + (i // 5) * 0.05
            # Topojson arc index
            geometries.append({
                'type': 'Polygon',
                'arcs': [[i]],
                'properties': {'name': name, 'code': m.get('code', str(i))},
            })

        arcs = []
        for i, m in enumerate(munis[:20]):
            lat = coords_base[0] + (i % 5) * 0.05
            lng = coords_base[1] + (i // 5) * 0.05
            # Topojson coordinates are delta-encoded integers
            # Use scale/translate to map lat/lng to integers
            arcs.append([[0, 0], [10, 0], [10, 10], [0, 10], [-10, -10]])

        scale_x = 0.001
        scale_y = 0.001
        translate_x = coords_base[1]
        translate_y = coords_base[0]

        topojson = {
            'type': 'Topology',
            'objects': {
                'municipalities': {
                    'type': 'GeometryCollection',
                    'geometries': geometries,
                },
            },
            'arcs': arcs,
            'transform': {
                'scale': [scale_x, scale_y],
                'translate': [translate_x, translate_y],
            },
        }
        with open(topo_path, 'w', encoding='utf-8') as f:
            json.dump(topojson, f, ensure_ascii=False)
        print(f'Created {topo_path} ({len(geometries)} municipalities)')

print('Done')
