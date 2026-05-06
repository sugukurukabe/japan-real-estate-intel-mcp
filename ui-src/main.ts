declare const L: any;

interface PrefectureConfig {
  center: [number, number];
  zoom: number;
  displayName: string;
  capabilities: { humanFlow: boolean; education: boolean; corporate: boolean; crime: boolean; plateau: boolean };
  municipalities: Record<string, [number, number]>;
  landPrices: Record<string, { price: number; change: number }>;
  risk: Record<string, { flood: number; earthquake: string; overall: number }>;
  humanFlow: Record<string, { weekday: number; weekend: number; stay: number; trend: string }>;
  school: Record<string, { score: number; advancement: number }>;
  corporate: Record<string, { establishments: number; major: number; employees: number }>;
  plateau: { name: string; city: string; height: number; lat: number; lng: number }[];
}

const PREFECTURES: Record<string, PrefectureConfig> = {
  aichi: {
    center: [35.1, 136.95],
    zoom: 11,
    displayName: '愛知県',
    capabilities: { humanFlow: true, education: true, corporate: true, crime: true, plateau: true },
    municipalities: {
      '名古屋市中村区': [35.1709, 136.8716], '名古屋市中区': [35.1709, 136.9066],
      '名古屋市東区': [35.1815, 136.9274], '名古屋市千種区': [35.1676, 136.9486],
      '名古屋市名東区': [35.1825, 136.9906], '名古屋市緑区': [35.0734, 136.9539],
      '名古屋市港区': [35.0828, 136.8472], '名古屋市昭和区': [35.1509, 136.9331],
      '名古屋市天白区': [35.1204, 136.9680], '名古屋市瑞穂区': [35.1333, 136.9347],
      '名古屋市熱田区': [35.1268, 136.9039], '名古屋市中川区': [35.1338, 136.8538],
      '名古屋市北区': [35.1985, 136.9195], '名古屋市西区': [35.1887, 136.8753],
      '名古屋市南区': [35.0984, 136.9104], '名古屋市守山区': [35.2154, 136.9688],
      '豊田市': [35.0833, 137.1557], '岡崎市': [34.9552, 137.1733],
      '一宮市': [35.3015, 136.8030], '春日井市': [35.2512, 136.9722],
      '豊橋市': [34.7694, 137.3916], '安城市': [34.9587, 137.0778],
      '刈谷市': [34.9891, 137.0042], '小牧市': [35.2917, 136.9222],
    },
    landPrices: {
      '名古屋市中村区': { price: 580000, change: 5.2 }, '名古屋市中区': { price: 1850000, change: 8.1 },
      '名古屋市東区': { price: 720000, change: 6.3 }, '名古屋市千種区': { price: 450000, change: 3.8 },
      '名古屋市名東区': { price: 280000, change: 2.1 }, '名古屋市緑区': { price: 165000, change: 1.5 },
      '名古屋市港区': { price: 120000, change: -0.8 }, '名古屋市昭和区': { price: 380000, change: 3.2 },
      '名古屋市天白区': { price: 210000, change: 1.8 }, '名古屋市瑞穂区': { price: 340000, change: 2.9 },
      '名古屋市熱田区': { price: 290000, change: 2.5 }, '名古屋市中川区': { price: 155000, change: 0.5 },
      '名古屋市北区': { price: 240000, change: 2.3 }, '名古屋市西区': { price: 260000, change: 2.8 },
      '名古屋市南区': { price: 170000, change: -0.3 }, '名古屋市守山区': { price: 175000, change: 1.2 },
      '豊田市': { price: 130000, change: 1.5 }, '岡崎市': { price: 105000, change: 0.8 },
      '一宮市': { price: 115000, change: 1.0 }, '春日井市': { price: 140000, change: 1.8 },
      '豊橋市': { price: 95000, change: 0.3 }, '安城市': { price: 120000, change: 2.0 },
      '刈谷市': { price: 135000, change: 2.5 }, '小牧市': { price: 110000, change: 0.9 },
    },
    risk: {
      '名古屋市中村区': { flood: 60, earthquake: '6強', overall: 62 },
      '名古屋市中区': { flood: 30, earthquake: '6強', overall: 48 },
      '名古屋市東区': { flood: 15, earthquake: '6弱', overall: 35 },
      '名古屋市港区': { flood: 85, earthquake: '6強', overall: 78 },
      '名古屋市中川区': { flood: 70, earthquake: '6強', overall: 68 },
      '名古屋市南区': { flood: 55, earthquake: '6弱', overall: 52 },
      '名古屋市緑区': { flood: 25, earthquake: '6弱', overall: 38 },
      '名古屋市熱田区': { flood: 45, earthquake: '6弱', overall: 45 },
      '豊橋市': { flood: 40, earthquake: '6弱', overall: 42 },
      '豊田市': { flood: 20, earthquake: '5強', overall: 28 },
    },
    humanFlow: {
      '名古屋市中区': { weekday: 185000, weekend: 210000, stay: 95, trend: 'increasing' },
      '名古屋市中村区': { weekday: 165000, weekend: 140000, stay: 45, trend: 'increasing' },
      '名古屋市東区': { weekday: 72000, weekend: 55000, stay: 60, trend: 'stable' },
      '名古屋市千種区': { weekday: 48000, weekend: 52000, stay: 70, trend: 'stable' },
      '名古屋市名東区': { weekday: 28000, weekend: 32000, stay: 85, trend: 'stable' },
      '名古屋市緑区': { weekday: 22000, weekend: 28000, stay: 90, trend: 'increasing' },
      '名古屋市港区': { weekday: 35000, weekend: 18000, stay: 40, trend: 'decreasing' },
      '名古屋市熱田区': { weekday: 55000, weekend: 68000, stay: 75, trend: 'increasing' },
      '豊田市': { weekday: 45000, weekend: 30000, stay: 50, trend: 'stable' },
      '刈谷市': { weekday: 38000, weekend: 12000, stay: 35, trend: 'increasing' },
    },
    school: {
      '名古屋市千種区': { score: 82, advancement: 78 }, '名古屋市昭和区': { score: 80, advancement: 76 },
      '名古屋市名東区': { score: 78, advancement: 74 }, '名古屋市瑞穂区': { score: 76, advancement: 72 },
      '名古屋市東区': { score: 73, advancement: 70 }, '名古屋市天白区': { score: 68, advancement: 66 },
      '名古屋市緑区': { score: 65, advancement: 63 }, '名古屋市中区': { score: 60, advancement: 62 },
      '名古屋市中村区': { score: 55, advancement: 58 }, '名古屋市港区': { score: 48, advancement: 52 },
      '豊田市': { score: 62, advancement: 64 }, '春日井市': { score: 64, advancement: 62 },
    },
    corporate: {
      '名古屋市中区': { establishments: 18500, major: 245, employees: 380000 },
      '名古屋市中村区': { establishments: 8200, major: 120, employees: 195000 },
      '名古屋市東区': { establishments: 4500, major: 55, employees: 85000 },
      '豊田市': { establishments: 5200, major: 35, employees: 165000 },
      '刈谷市': { establishments: 2800, major: 28, employees: 95000 },
      '名古屋市港区': { establishments: 3500, major: 22, employees: 65000 },
      '小牧市': { establishments: 2200, major: 15, employees: 52000 },
    },
    plateau: [
      { name: 'ミッドランドスクエア', city: '名古屋市中村区', height: 247, lat: 35.1709, lng: 136.8816 },
      { name: 'JRセントラルタワーズ', city: '名古屋市中村区', height: 245, lat: 35.1706, lng: 136.8826 },
      { name: 'モード学園スパイラルタワーズ', city: '名古屋市中村区', height: 170, lat: 35.1695, lng: 136.8835 },
      { name: '大名古屋ビルヂング', city: '名古屋市中村区', height: 174, lat: 35.1718, lng: 136.8838 },
      { name: 'ルーセントタワー', city: '名古屋市西区', height: 180, lat: 35.1748, lng: 136.8782 },
      { name: 'グローバルゲート', city: '名古屋市中村区', height: 170, lat: 35.1640, lng: 136.8780 },
    ],
  },
  tokyo: {
    center: [35.68, 139.76],
    zoom: 11,
    displayName: '東京都',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false },
    municipalities: {
      '千代田区': [35.6940, 139.7536], '中央区': [35.6709, 139.7727],
      '港区': [35.6585, 139.7514], '新宿区': [35.6938, 139.7036],
      '渋谷区': [35.6640, 139.6982], '品川区': [35.6092, 139.7302],
      '目黒区': [35.6414, 139.6982], '大田区': [35.5613, 139.7160],
      '世田谷区': [35.6462, 139.6532], '中野区': [35.7077, 139.6639],
      '杉並区': [35.6995, 139.6364], '豊島区': [35.7264, 139.7163],
      '北区': [35.7527, 139.7349], '板橋区': [35.7516, 139.7092],
      '練馬区': [35.7355, 139.6516], '文京区': [35.7081, 139.7521],
      '台東区': [35.7126, 139.7800], '墨田区': [35.7108, 139.8019],
      '江東区': [35.6729, 139.8171], '荒川区': [35.7359, 139.7834],
      '足立区': [35.7746, 139.8044], '葛飾区': [35.7432, 139.8472],
      '江戸川区': [35.7067, 139.8683],
    },
    landPrices: {
      '千代田区': { price: 18500000, change: 2.8 }, '中央区': { price: 15200000, change: 3.2 },
      '港区': { price: 7800000, change: 2.5 }, '新宿区': { price: 5600000, change: 1.9 },
      '渋谷区': { price: 8200000, change: 3.5 }, '品川区': { price: 2800000, change: 2.0 },
      '目黒区': { price: 1850000, change: 1.7 }, '大田区': { price: 1100000, change: 0.9 },
      '世田谷区': { price: 1350000, change: 1.3 }, '中野区': { price: 1200000, change: 1.4 },
      '杉並区': { price: 1050000, change: 1.1 }, '豊島区': { price: 5100000, change: 2.3 },
      '北区': { price: 680000, change: 1.0 }, '板橋区': { price: 560000, change: 0.7 },
      '練馬区': { price: 550000, change: 0.6 }, '文京区': { price: 2400000, change: 1.8 },
      '台東区': { price: 3200000, change: 1.5 }, '墨田区': { price: 980000, change: 2.0 },
      '江東区': { price: 2200000, change: 3.0 }, '荒川区': { price: 650000, change: 1.2 },
      '足立区': { price: 780000, change: 1.3 }, '葛飾区': { price: 420000, change: 0.5 },
      '江戸川区': { price: 480000, change: 0.8 },
    },
    risk: {
      '江東区': { flood: 80, earthquake: '6強', overall: 75 },
      '足立区': { flood: 85, earthquake: '6強', overall: 78 },
      '葛飾区': { flood: 75, earthquake: '6強', overall: 72 },
      '江戸川区': { flood: 90, earthquake: '6強', overall: 82 },
      '墨田区': { flood: 65, earthquake: '6強', overall: 65 },
      '荒川区': { flood: 70, earthquake: '6強', overall: 68 },
      '大田区': { flood: 50, earthquake: '6強', overall: 55 },
      '北区': { flood: 40, earthquake: '6弱', overall: 42 },
      '千代田区': { flood: 10, earthquake: '6強', overall: 38 },
      '世田谷区': { flood: 25, earthquake: '6弱', overall: 30 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
  },
};

let map: any;
let currentLayer = 'land_price';
let currentPrefecture = 'aichi';
let selectedArea = '';
let currentOverlayGroup: any = null;
let comparisonMode = false;

function pref(): PrefectureConfig { return PREFECTURES[currentPrefecture]; }

function priceToColor(price: number): string {
  if (price >= 1000000) return '#ff2d55';
  if (price >= 500000) return '#ff6b35';
  if (price >= 300000) return '#ffb340';
  if (price >= 200000) return '#ffe066';
  if (price >= 150000) return '#a8e6cf';
  return '#69b7eb';
}

function riskToColor(overall: number): string {
  if (overall >= 70) return '#ff2d55';
  if (overall >= 50) return '#ff6b35';
  if (overall >= 30) return '#ffb340';
  return '#34d399';
}

function initMap() {
  const config = pref();
  map = L.map('map-container', {
    center: config.center,
    zoom: config.zoom,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(map);

  renderLandPriceLayer();
  renderLayerControl();
  renderLegend();
}

function clearOverlay() {
  if (currentOverlayGroup) {
    map.removeLayer(currentOverlayGroup);
    currentOverlayGroup = null;
  }
}

function renderLandPriceLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const data = config.landPrices[name];
    if (!data) continue;
    const circle = L.circle(center, {
      radius: 1200, fillColor: priceToColor(data.price), fillOpacity: 0.6,
      color: priceToColor(data.price), weight: 1, opacity: 0.8,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>平均地価</span><span>${(data.price / 10000).toFixed(1)}万円/㎡</span></div>
      <div class="popup-row"><span>変化率</span><span style="color:${data.change >= 0 ? '#34d399' : '#ff4d6a'}">${data.change >= 0 ? '+' : ''}${data.change}%</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderFloodRiskLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const risk = config.risk[name];
    if (!risk) continue;
    const circle = L.circleMarker(center, {
      radius: 8, fillColor: riskToColor(risk.overall), fillOpacity: 0.8, color: '#fff', weight: 1,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>浸水リスク</span><span>${risk.flood}/100</span></div>
      <div class="popup-row"><span>想定震度</span><span>${risk.earthquake}</span></div>
      <div class="popup-row"><span>総合リスク</span><span style="color:${riskToColor(risk.overall)}">${risk.overall}/100</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderTransactionLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const data = config.landPrices[name];
    if (!data) continue;
    const txCount = Math.floor(5 + Math.random() * 20);
    const circle = L.circle(center, {
      radius: 300 + txCount * 50, fillColor: '#4f8cff', fillOpacity: 0.3, color: '#4f8cff', weight: 1,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>取引件数</span><span>${txCount}件</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderPopulationLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const circle = L.circle(center, {
      radius: 1000, fillColor: '#34d399', fillOpacity: 0.3, color: '#34d399', weight: 1,
    });
    circle.bindPopup(`<div class="popup-title">${name}</div>`);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderHumanFlowLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const flow = config.humanFlow[name];
    if (!flow) continue;
    const avgFlow = (flow.weekday + flow.weekend) / 2;
    const radius = Math.max(500, Math.sqrt(avgFlow) * 2);
    const intensity = Math.min(1, avgFlow / 150000);
    const borderColor = flow.trend === 'increasing' ? '#34d399' : flow.trend === 'decreasing' ? '#ff4d6a' : '#4f8cff';
    const circle = L.circle(center, {
      radius, fillColor: `rgba(79, 140, 255, ${0.2 + intensity * 0.6})`,
      fillOpacity: 0.5, color: borderColor, weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>平日人流</span><span>${flow.weekday.toLocaleString()}人/日</span></div>
      <div class="popup-row"><span>休日人流</span><span>${flow.weekend.toLocaleString()}人/日</span></div>
      <div class="popup-row"><span>平均滞在</span><span>${flow.stay}分</span></div>
      <div class="popup-row"><span>トレンド</span><span style="color:${borderColor}">${flow.trend === 'increasing' ? '↑増加' : flow.trend === 'decreasing' ? '↓減少' : '→安定'}</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderSchoolDistrictLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const school = config.school[name];
    if (!school) continue;
    const color = school.score >= 75 ? '#34d399' : school.score >= 60 ? '#ffb340' : '#ff4d6a';
    const circle = L.circle(center, {
      radius: 1000, fillColor: color, fillOpacity: 0.4, color, weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>教育スコア</span><span style="color:${color}">${school.score}/100</span></div>
      <div class="popup-row"><span>大学進学率</span><span>${school.advancement}%</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderCorporateDensityLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const [name, center] of Object.entries(config.municipalities)) {
    const corp = config.corporate[name];
    if (!corp) continue;
    const radius = Math.max(500, Math.sqrt(corp.employees) * 1.5);
    const intensity = Math.min(0.8, corp.major / 200);
    const circle = L.circle(center, {
      radius, fillColor: `rgba(168, 85, 247, ${0.2 + intensity})`,
      fillOpacity: 0.5, color: '#a855f7', weight: 1,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>事業所数</span><span>${corp.establishments.toLocaleString()}</span></div>
      <div class="popup-row"><span>大企業</span><span>${corp.major}社</span></div>
      <div class="popup-row"><span>従業者</span><span>${corp.employees.toLocaleString()}人</span></div>
    `);
    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

function renderPlateau3DLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();
  const config = pref();
  for (const bldg of config.plateau) {
    const heightScale = bldg.height / 250;
    const radius = 80 + bldg.height * 0.8;
    const color = bldg.height >= 200 ? '#ff2d55' : bldg.height >= 150 ? '#ff6b35' : '#ffb340';
    const circle = L.circle([bldg.lat, bldg.lng], {
      radius, fillColor: color, fillOpacity: 0.5 + heightScale * 0.3, color: '#fff', weight: 1,
    });
    circle.bindPopup(`
      <div class="popup-title">${bldg.name}</div>
      <div class="popup-row"><span>高さ</span><span>${bldg.height}m</span></div>
      <div class="popup-row"><span>エリア</span><span>${bldg.city}</span></div>
    `);
    currentOverlayGroup.addLayer(circle);
  }
  currentOverlayGroup.addTo(map);
}

const CAPABILITY_LAYERS: Record<string, keyof PrefectureConfig['capabilities']> = {
  human_flow: 'humanFlow',
  school_district: 'education',
  corporate_density: 'corporate',
  plateau_3d: 'plateau',
};

function isLayerAvailable(layer: string): boolean {
  const capKey = CAPABILITY_LAYERS[layer];
  if (!capKey) return true;
  return pref().capabilities[capKey];
}

function switchLayer(layer: string) {
  if (!isLayerAvailable(layer)) return;
  currentLayer = layer;
  switch (layer) {
    case 'land_price': renderLandPriceLayer(); break;
    case 'flood_risk': renderFloodRiskLayer(); break;
    case 'transaction': renderTransactionLayer(); break;
    case 'population': renderPopulationLayer(); break;
    case 'human_flow': renderHumanFlowLayer(); break;
    case 'school_district': renderSchoolDistrictLayer(); break;
    case 'corporate_density': renderCorporateDensityLayer(); break;
    case 'plateau_3d': renderPlateau3DLayer(); break;
  }
  renderLegend();
  updateLayerButtons();
}

function updateLayerButtons() {
  document.querySelectorAll('.layer-btn').forEach(btn => {
    const layer = btn.getAttribute('data-layer') ?? '';
    const available = isLayerAvailable(layer);
    btn.classList.toggle('active', layer === currentLayer);
    btn.classList.toggle('disabled', !available);
    (btn as HTMLButtonElement).disabled = !available;
  });
}

function renderLayerControl() {
  const existing = document.querySelector('.layer-control');
  if (existing) existing.remove();

  const ctrl = document.createElement('div');
  ctrl.className = 'layer-control';
  ctrl.innerHTML = `
    <button class="layer-btn active" data-layer="land_price">地価</button>
    <button class="layer-btn" data-layer="flood_risk">災害</button>
    <button class="layer-btn" data-layer="transaction">取引</button>
    <button class="layer-btn" data-layer="population">人口</button>
    <button class="layer-btn" data-layer="human_flow">人流</button>
    <button class="layer-btn" data-layer="school_district">学区</button>
    <button class="layer-btn" data-layer="corporate_density">企業</button>
    <button class="layer-btn" data-layer="plateau_3d">3D建物</button>
  `;
  ctrl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const layer = target.getAttribute('data-layer');
    if (layer) switchLayer(layer);
  });
  document.getElementById('map-container')!.appendChild(ctrl);
  updateLayerButtons();
}

function renderLegend() {
  const existing = document.querySelector('.legend');
  if (existing) existing.remove();

  const legend = document.createElement('div');
  legend.className = 'legend';

  const legendMap: Record<string, string> = {
    land_price: `<div class="legend-title">地価（万円/㎡）</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff2d55"></div> 100万〜</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff6b35"></div> 50万〜100万</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffb340"></div> 30万〜50万</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffe066"></div> 20万〜30万</div>
      <div class="legend-item"><div class="legend-color" style="background:#a8e6cf"></div> 15万〜20万</div>
      <div class="legend-item"><div class="legend-color" style="background:#69b7eb"></div> 〜15万</div>`,
    flood_risk: `<div class="legend-title">リスクスコア</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff2d55"></div> 70〜 高リスク</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff6b35"></div> 50〜69 中高</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffb340"></div> 30〜49 中</div>
      <div class="legend-item"><div class="legend-color" style="background:#34d399"></div> 〜29 低リスク</div>`,
    population: `<div class="legend-title">人口動態</div>
      <div class="legend-item"><div class="legend-color" style="background:#34d399"></div> 市区町村</div>`,
    human_flow: `<div class="legend-title">人流量</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(79,140,255,0.8)"></div> 高人流</div>
      <div class="legend-item"><div class="legend-color" style="border:2px solid #34d399;background:transparent"></div> 増加傾向</div>
      <div class="legend-item"><div class="legend-color" style="border:2px solid #ff4d6a;background:transparent"></div> 減少傾向</div>`,
    school_district: `<div class="legend-title">教育環境スコア</div>
      <div class="legend-item"><div class="legend-color" style="background:#34d399"></div> 75〜 優秀</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffb340"></div> 60〜74 標準</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff4d6a"></div> 〜59 低め</div>`,
    corporate_density: `<div class="legend-title">企業集積度</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(168,85,247,0.8)"></div> 大企業集積</div>`,
    plateau_3d: `<div class="legend-title">建物高さ</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff2d55"></div> 200m〜</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff6b35"></div> 150m〜200m</div>`,
    transaction: `<div class="legend-title">取引分布</div>
      <div class="legend-item"><div class="legend-color" style="background:#4f8cff"></div> 取引エリア</div>`,
  };

  legend.innerHTML = legendMap[currentLayer] ?? '';
  document.getElementById('map-container')!.appendChild(legend);
}

function switchPrefecture(key: string) {
  currentPrefecture = key;
  selectedArea = '';
  const config = pref();
  map.setView(config.center, config.zoom);

  if (!isLayerAvailable(currentLayer)) {
    currentLayer = 'land_price';
  }
  switchLayer(currentLayer);
  renderLayerControl();
  rebuildAreaSelect();
  updateInsightPanel('');
}

function selectArea(name: string) {
  selectedArea = name;
  updateInsightPanel(name);
  const sel = document.getElementById('area-select') as HTMLSelectElement | null;
  if (sel) sel.value = name;
}

function updateInsightPanel(area: string) {
  const panel = document.getElementById('insight-panel')!;
  const config = pref();
  const price = config.landPrices[area];
  const risk = config.risk[area];
  const flow = config.humanFlow[area];
  const school = config.school[area];
  const corp = config.corporate[area];

  const investmentScore = price
    ? Math.round(Math.max(0, Math.min(100,
        (price.change + 10) * 2 + (100 - (risk?.overall ?? 30)) * 0.3 + 15)))
    : 50;

  const scoreClass = investmentScore >= 70 ? 'high' : investmentScore >= 40 ? 'medium' : 'low';
  const riskClass = (risk?.overall ?? 0) >= 60 ? 'high' : (risk?.overall ?? 0) >= 30 ? 'medium' : 'low';

  let comparisonHtml = '';
  if (comparisonMode && area) {
    const otherKey = currentPrefecture === 'aichi' ? 'tokyo' : 'aichi';
    const other = PREFECTURES[otherKey];
    comparisonHtml = `
    <div class="panel-section" style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
      <h3>比較: ${other.displayName}</h3>
      <div style="font-size:12px;color:var(--text-muted)">比較モードは v2.1 でフル機能化予定</div>
      <div style="font-size:12px;margin:4px 0">対応データ: 地価/人口/災害/地震</div>
      <div style="font-size:12px;margin:4px 0">人流: ${other.capabilities.humanFlow ? '対応' : '未対応'}</div>
      <div style="font-size:12px;margin:4px 0">教育: ${other.capabilities.education ? '対応' : '未対応'}</div>
      <div style="font-size:12px;margin:4px 0">企業: ${other.capabilities.corporate ? '対応' : '未対応'}</div>
    </div>`;
  }

  panel.innerHTML = `
    <div class="panel-section">
      <h3>${area || 'エリアを選択'}</h3>
      <div style="font-size:11px;color:var(--text-muted)">${config.displayName}</div>
    </div>

    <div class="score-card">
      <div class="score-value ${scoreClass}">${investmentScore}</div>
      <div class="score-label">投資スコア</div>
      <div class="score-sublabel">/ 100</div>
    </div>

    ${price ? `
    <div class="price-info">
      <div class="price-current">${(price.price / 10000).toFixed(1)}<span style="font-size:14px;color:var(--text-muted)"> 万円/㎡</span></div>
      <div class="price-change ${price.change >= 0 ? 'up' : 'down'}">${price.change >= 0 ? '▲' : '▼'} ${Math.abs(price.change)}%</div>
    </div>
    ` : ''}

    ${risk ? `
    <div class="panel-section">
      <h3>リスク評価</h3>
      <div style="margin:8px 0"><span class="risk-badge ${riskClass}">総合: ${risk.overall}/100</span></div>
      <div style="font-size:12px;margin:4px 0">浸水: ${risk.flood}/100 / 震度: ${risk.earthquake}</div>
    </div>
    ` : ''}

    ${flow ? `
    <div class="panel-section">
      <h3>人流データ</h3>
      <div style="font-size:12px;margin:4px 0">平日: ${flow.weekday.toLocaleString()}人/日 / 休日: ${flow.weekend.toLocaleString()}人/日</div>
      <div style="font-size:12px;margin:4px 0">滞在: ${flow.stay}分 / ${flow.trend === 'increasing' ? '↑増加' : flow.trend === 'decreasing' ? '↓減少' : '→安定'}</div>
    </div>
    ` : ''}

    ${school ? `
    <div class="panel-section">
      <h3>教育環境</h3>
      <div style="font-size:12px;margin:4px 0">教育スコア: <span style="color:${school.score >= 75 ? '#34d399' : school.score >= 60 ? '#ffb340' : '#ff4d6a'}">${school.score}/100</span> / 進学率: ${school.advancement}%</div>
    </div>
    ` : ''}

    ${corp ? `
    <div class="panel-section">
      <h3>企業集積</h3>
      <div style="font-size:12px;margin:4px 0">事業所: ${corp.establishments.toLocaleString()} / 大企業: ${corp.major}社</div>
    </div>
    ` : ''}

    ${comparisonHtml}

    <div class="panel-section">
      <h3>インサイト</h3>
      <ul class="insight-list">
        ${price && price.change > 3 ? `<li>地価上昇が顕著。再開発や交通インフラ改善が要因。</li>` : ''}
        ${price && price.change < 0 ? `<li>地価が下落傾向。底値買いの機会か構造的リスクか要精査。</li>` : ''}
        ${risk && risk.overall >= 60 ? `<li>災害リスクが高め。保険コスト増を価格に織り込む必要あり。</li>` : ''}
        ${flow && flow.weekday > 50000 ? `<li>高人流エリア。商業・オフィス需要が堅調。</li>` : ''}
        ${!price ? `<li>エリアを選択するとインサイトが表示されます。</li>` : ''}
        <li>詳細は「レポート生成」で確認できます。</li>
      </ul>
    </div>

    <button class="btn-report" id="btn-generate-report">レポート生成</button>
  `;

  document.getElementById('btn-generate-report')?.addEventListener('click', () => {
    if (area) showReport(area);
  });
}

function showReport(area: string) {
  const overlay = document.getElementById('report-overlay')!;
  const content = document.getElementById('report-content')!;
  const config = pref();
  const price = config.landPrices[area];
  const risk = config.risk[area];

  content.innerHTML = `
    <button class="report-close" id="close-report">閉じる</button>
    <h1>${config.displayName} ${area} 不動産投資レポート</h1>
    <p>生成日: ${new Date().toISOString().split('T')[0]}</p>
    <hr>
    <h2>価格動向</h2>
    <table>
      <tr><th>指標</th><th>値</th></tr>
      <tr><td>平均地価</td><td>${price ? (price.price / 10000).toFixed(1) + ' 万円/㎡' : 'N/A'}</td></tr>
      <tr><td>変化率</td><td>${price ? (price.change >= 0 ? '+' : '') + price.change + '%' : 'N/A'}</td></tr>
    </table>
    ${risk ? `<h2>リスク詳細</h2><table><tr><th>種別</th><th>値</th></tr><tr><td>浸水</td><td>${risk.flood}/100</td></tr><tr><td>震度</td><td>${risk.earthquake}</td></tr></table>` : ''}
    <hr>
    <p style="font-size:11px;color:var(--text-muted)">出典: 国土交通省 不動産価格情報 / 地価公示 / ハザードマップポータル</p>
  `;

  overlay.classList.add('visible');
  document.getElementById('close-report')?.addEventListener('click', () => {
    overlay.classList.remove('visible');
  });
}

function rebuildAreaSelect() {
  const sel = document.getElementById('area-select') as HTMLSelectElement | null;
  if (!sel) return;
  const areas = Object.keys(pref().municipalities);
  sel.innerHTML = `<option value="">エリアを選択...</option>${areas.map(a => `<option value="${a}">${a}</option>`).join('')}`;
}

function initSearchPanel() {
  const panel = document.getElementById('search-panel')!;

  panel.innerHTML = `
    <div class="panel-section">
      <h3>都道府県</h3>
      <div class="form-group">
        <select id="pref-select">
          ${Object.entries(PREFECTURES).map(([k, v]) => `<option value="${k}" ${k === currentPrefecture ? 'selected' : ''}>${v.displayName}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="panel-section">
      <h3>エリア検索</h3>
      <div class="form-group">
        <label>市区町村</label>
        <select id="area-select">
          <option value="">エリアを選択...</option>
          ${Object.keys(pref().municipalities).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="panel-section">
      <h3>物件種別</h3>
      <div class="toggle-group">
        <button class="toggle-btn active" data-type="residential">住宅</button>
        <button class="toggle-btn" data-type="commercial">商業</button>
        <button class="toggle-btn" data-type="office">オフィス</button>
        <button class="toggle-btn" data-type="logistics">物流</button>
      </div>
    </div>

    <div class="panel-section">
      <h3>期間</h3>
      <div class="toggle-group">
        <button class="toggle-btn" data-range="1y">1年</button>
        <button class="toggle-btn active" data-range="3y">3年</button>
        <button class="toggle-btn" data-range="5y">5年</button>
      </div>
    </div>

    <div class="panel-section">
      <div class="switch-row">
        <label>災害リスク考慮</label>
        <div class="switch on" id="risk-toggle"></div>
      </div>
      <div class="switch-row" style="margin-top:8px">
        <label>比較モード</label>
        <div class="switch ${comparisonMode ? 'on' : ''}" id="comparison-toggle"></div>
      </div>
    </div>

    <button class="btn-primary" id="btn-analyze">クロス分析</button>
  `;

  document.getElementById('pref-select')?.addEventListener('change', (e) => {
    switchPrefecture((e.target as HTMLSelectElement).value);
  });

  document.getElementById('area-select')?.addEventListener('change', (e) => {
    const area = (e.target as HTMLSelectElement).value;
    if (area) {
      selectArea(area);
      const center = pref().municipalities[area];
      if (center) map.setView(center, 13);
    }
  });

  panel.querySelectorAll('.toggle-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      panel.querySelectorAll('.toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
      (e.target as HTMLElement).classList.add('active');
    });
  });

  panel.querySelectorAll('.toggle-btn[data-range]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      panel.querySelectorAll('.toggle-btn[data-range]').forEach(b => b.classList.remove('active'));
      (e.target as HTMLElement).classList.add('active');
    });
  });

  document.getElementById('risk-toggle')?.addEventListener('click', (e) => {
    (e.target as HTMLElement).classList.toggle('on');
  });

  document.getElementById('comparison-toggle')?.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    el.classList.toggle('on');
    comparisonMode = el.classList.contains('on');
    if (selectedArea) updateInsightPanel(selectedArea);
  });

  document.getElementById('btn-analyze')?.addEventListener('click', () => {
    const area = (document.getElementById('area-select') as HTMLSelectElement).value;
    if (area) selectArea(area);
  });
}

function initReportOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'report-overlay';
  overlay.innerHTML = '<div id="report-content"></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('visible');
  });
}

function init() {
  initSearchPanel();
  initMap();
  initReportOverlay();
  updateInsightPanel('');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
