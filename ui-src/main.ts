declare const L: any;

interface MunicipalityProps {
  name: string;
  code: string;
  population: number;
}

interface AnalysisResult {
  summary: string;
  priceTrend: { current: number; changeRate: number; forecast: string };
  riskScore: number;
  investmentScore: number;
  keyInsights: string[];
}

// Sample data embedded for standalone dashboard operation
const SAMPLE_LAND_PRICES: Record<string, { price: number; change: number }> = {
  '名古屋市中村区': { price: 580000, change: 5.2 },
  '名古屋市中区': { price: 1850000, change: 8.1 },
  '名古屋市東区': { price: 720000, change: 6.3 },
  '名古屋市千種区': { price: 450000, change: 3.8 },
  '名古屋市名東区': { price: 280000, change: 2.1 },
  '名古屋市緑区': { price: 165000, change: 1.5 },
  '名古屋市港区': { price: 120000, change: -0.8 },
  '名古屋市昭和区': { price: 380000, change: 3.2 },
  '名古屋市天白区': { price: 210000, change: 1.8 },
  '名古屋市瑞穂区': { price: 340000, change: 2.9 },
  '名古屋市熱田区': { price: 290000, change: 2.5 },
  '名古屋市中川区': { price: 155000, change: 0.5 },
  '名古屋市北区': { price: 240000, change: 2.3 },
  '名古屋市西区': { price: 260000, change: 2.8 },
  '名古屋市南区': { price: 170000, change: -0.3 },
  '名古屋市守山区': { price: 175000, change: 1.2 },
  '豊田市': { price: 130000, change: 1.5 },
  '岡崎市': { price: 105000, change: 0.8 },
  '一宮市': { price: 115000, change: 1.0 },
  '春日井市': { price: 140000, change: 1.8 },
  '豊橋市': { price: 95000, change: 0.3 },
  '安城市': { price: 120000, change: 2.0 },
  '刈谷市': { price: 135000, change: 2.5 },
  '小牧市': { price: 110000, change: 0.9 },
};

const SAMPLE_RISK: Record<string, { flood: number; earthquake: string; overall: number }> = {
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
};

const MUNICIPALITY_CENTERS: Record<string, [number, number]> = {
  '名古屋市中村区': [35.1709, 136.8716],
  '名古屋市中区': [35.1709, 136.9066],
  '名古屋市東区': [35.1815, 136.9274],
  '名古屋市千種区': [35.1676, 136.9486],
  '名古屋市名東区': [35.1825, 136.9906],
  '名古屋市緑区': [35.0734, 136.9539],
  '名古屋市港区': [35.0828, 136.8472],
  '名古屋市昭和区': [35.1509, 136.9331],
  '名古屋市天白区': [35.1204, 136.9680],
  '名古屋市瑞穂区': [35.1333, 136.9347],
  '名古屋市熱田区': [35.1268, 136.9039],
  '名古屋市中川区': [35.1338, 136.8538],
  '名古屋市北区': [35.1985, 136.9195],
  '名古屋市西区': [35.1887, 136.8753],
  '名古屋市南区': [35.0984, 136.9104],
  '名古屋市守山区': [35.2154, 136.9688],
  '豊田市': [35.0833, 137.1557],
  '岡崎市': [34.9552, 137.1733],
  '一宮市': [35.3015, 136.8030],
  '春日井市': [35.2512, 136.9722],
  '豊橋市': [34.7694, 137.3916],
  '安城市': [34.9587, 137.0778],
  '刈谷市': [34.9891, 137.0042],
  '小牧市': [35.2917, 136.9222],
};

let map: any;
let currentLayer = 'land_price';
let selectedArea = '';
let currentOverlayGroup: any = null;

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

function floodDepthToColor(depth: number): string {
  if (depth >= 3) return 'rgba(255, 45, 85, 0.6)';
  if (depth >= 2) return 'rgba(255, 107, 53, 0.5)';
  if (depth >= 1) return 'rgba(255, 179, 64, 0.4)';
  if (depth >= 0.5) return 'rgba(255, 224, 102, 0.3)';
  return 'rgba(105, 183, 235, 0.2)';
}

function initMap() {
  map = L.map('map-container', {
    center: [35.1, 136.95],
    zoom: 11,
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

  for (const [name, center] of Object.entries(MUNICIPALITY_CENTERS)) {
    const data = SAMPLE_LAND_PRICES[name];
    if (!data) continue;

    const circle = L.circle(center, {
      radius: 1200,
      fillColor: priceToColor(data.price),
      fillOpacity: 0.6,
      color: priceToColor(data.price),
      weight: 1,
      opacity: 0.8,
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

  const floodAreas = [
    { name: '庄内川流域', bounds: [[35.12, 136.82], [35.20, 136.92]], depth: 3.5, river: '庄内川' },
    { name: '天白川流域', bounds: [[35.08, 136.92], [35.14, 137.00]], depth: 2.0, river: '天白川' },
    { name: '日光川流域', bounds: [[35.04, 136.76], [35.12, 136.86]], depth: 4.0, river: '日光川' },
    { name: '名古屋港周辺', bounds: [[35.02, 136.83], [35.10, 136.90]], depth: 5.0, river: '伊勢湾' },
    { name: '矢作川流域', bounds: [[34.90, 137.05], [34.98, 137.20]], depth: 2.5, river: '矢作川' },
    { name: '豊川流域', bounds: [[34.72, 137.30], [34.82, 137.42]], depth: 1.5, river: '豊川' },
  ];

  for (const area of floodAreas) {
    const rect = L.rectangle(area.bounds, {
      fillColor: floodDepthToColor(area.depth),
      fillOpacity: 0.5,
      color: '#ff6b35',
      weight: 1,
    });

    rect.bindPopup(`
      <div class="popup-title">${area.name}</div>
      <div class="popup-row"><span>河川</span><span>${area.river}</span></div>
      <div class="popup-row"><span>最大浸水深</span><span style="color:${area.depth >= 3 ? '#ff4d6a' : '#ffb340'}">${area.depth}m</span></div>
    `);

    currentOverlayGroup.addLayer(rect);
  }

  for (const [name, center] of Object.entries(MUNICIPALITY_CENTERS)) {
    const risk = SAMPLE_RISK[name];
    if (!risk) continue;

    const circle = L.circleMarker(center, {
      radius: 8,
      fillColor: riskToColor(risk.overall),
      fillOpacity: 0.8,
      color: '#fff',
      weight: 1,
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

  for (const [name, center] of Object.entries(MUNICIPALITY_CENTERS)) {
    const data = SAMPLE_LAND_PRICES[name];
    if (!data) continue;

    const txCount = Math.floor(5 + Math.random() * 20);
    const avgPrice = data.price * (0.8 + Math.random() * 0.4);

    const circle = L.circle(center, {
      radius: 300 + txCount * 50,
      fillColor: '#4f8cff',
      fillOpacity: 0.3,
      color: '#4f8cff',
      weight: 1,
    });

    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>取引件数</span><span>${txCount}件</span></div>
      <div class="popup-row"><span>平均取引価格</span><span>${(avgPrice / 10000).toFixed(1)}万円/㎡</span></div>
    `);

    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }

  currentOverlayGroup.addTo(map);
}

function renderPopulationLayer() {
  clearOverlay();
  currentOverlayGroup = L.layerGroup();

  const popData: Record<string, { pop: number; growth: number }> = {
    '名古屋市中村区': { pop: 140000, growth: 2.1 },
    '名古屋市中区': { pop: 100000, growth: 5.8 },
    '名古屋市東区': { pop: 88000, growth: 3.2 },
    '名古屋市千種区': { pop: 167000, growth: 1.5 },
    '名古屋市名東区': { pop: 164000, growth: -0.5 },
    '名古屋市緑区': { pop: 248000, growth: 1.2 },
    '名古屋市港区': { pop: 142000, growth: -1.8 },
    '名古屋市昭和区': { pop: 112000, growth: 0.8 },
    '豊田市': { pop: 425000, growth: 0.3 },
    '岡崎市': { pop: 385000, growth: 0.1 },
    '一宮市': { pop: 380000, growth: -0.5 },
    '豊橋市': { pop: 372000, growth: -0.8 },
  };

  for (const [name, center] of Object.entries(MUNICIPALITY_CENTERS)) {
    const pd = popData[name];
    if (!pd) continue;

    const radius = Math.max(400, Math.sqrt(pd.pop) * 3);
    const color = pd.growth >= 0 ? '#34d399' : '#ff4d6a';

    const circle = L.circle(center, {
      radius,
      fillColor: color,
      fillOpacity: 0.35,
      color,
      weight: 1,
    });

    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>人口</span><span>${pd.pop.toLocaleString()}人</span></div>
      <div class="popup-row"><span>人口増減率</span><span style="color:${color}">${pd.growth >= 0 ? '+' : ''}${pd.growth}%</span></div>
    `);

    circle.on('click', () => selectArea(name));
    currentOverlayGroup.addLayer(circle);
  }

  currentOverlayGroup.addTo(map);
}

function switchLayer(layer: string) {
  currentLayer = layer;
  switch (layer) {
    case 'land_price': renderLandPriceLayer(); break;
    case 'flood_risk': renderFloodRiskLayer(); break;
    case 'transaction': renderTransactionLayer(); break;
    case 'population': renderPopulationLayer(); break;
  }
  renderLegend();
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-layer') === layer);
  });
}

function renderLayerControl() {
  const ctrl = document.createElement('div');
  ctrl.className = 'layer-control';
  ctrl.innerHTML = `
    <button class="layer-btn active" data-layer="land_price">地価</button>
    <button class="layer-btn" data-layer="flood_risk">災害リスク</button>
    <button class="layer-btn" data-layer="transaction">取引</button>
    <button class="layer-btn" data-layer="population">人口</button>
  `;
  ctrl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const layer = target.getAttribute('data-layer');
    if (layer) switchLayer(layer);
  });
  document.getElementById('map-container')!.appendChild(ctrl);
}

function renderLegend() {
  const existing = document.querySelector('.legend');
  if (existing) existing.remove();

  const legend = document.createElement('div');
  legend.className = 'legend';

  if (currentLayer === 'land_price') {
    legend.innerHTML = `
      <div class="legend-title">地価（万円/㎡）</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff2d55"></div> 100万〜</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff6b35"></div> 50万〜100万</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffb340"></div> 30万〜50万</div>
      <div class="legend-item"><div class="legend-color" style="background:#ffe066"></div> 20万〜30万</div>
      <div class="legend-item"><div class="legend-color" style="background:#a8e6cf"></div> 15万〜20万</div>
      <div class="legend-item"><div class="legend-color" style="background:#69b7eb"></div> 〜15万</div>
    `;
  } else if (currentLayer === 'flood_risk') {
    legend.innerHTML = `
      <div class="legend-title">浸水深（m）</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(255,45,85,0.6)"></div> 3m〜</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(255,107,53,0.5)"></div> 2m〜3m</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(255,179,64,0.4)"></div> 1m〜2m</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(255,224,102,0.3)"></div> 0.5m〜1m</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(105,183,235,0.2)"></div> 〜0.5m</div>
    `;
  } else if (currentLayer === 'population') {
    legend.innerHTML = `
      <div class="legend-title">人口動態</div>
      <div class="legend-item"><div class="legend-color" style="background:#34d399"></div> 人口増加</div>
      <div class="legend-item"><div class="legend-color" style="background:#ff4d6a"></div> 人口減少</div>
      <div class="legend-item"><div class="legend-color" style="opacity:0.3">⭕</div> 円の大きさ＝人口規模</div>
    `;
  } else {
    legend.innerHTML = `
      <div class="legend-title">取引分布</div>
      <div class="legend-item"><div class="legend-color" style="background:#4f8cff"></div> 取引エリア</div>
      <div class="legend-item"><div class="legend-color" style="opacity:0.3">⭕</div> 円の大きさ＝取引件数</div>
    `;
  }

  document.getElementById('map-container')!.appendChild(legend);
}

function selectArea(name: string) {
  selectedArea = name;
  updateInsightPanel(name);

  const sel = document.getElementById('area-select') as HTMLSelectElement | null;
  if (sel) sel.value = name;
}

function updateInsightPanel(area: string) {
  const panel = document.getElementById('insight-panel')!;
  const price = SAMPLE_LAND_PRICES[area];
  const risk = SAMPLE_RISK[area];

  const investmentScore = price
    ? Math.round(Math.max(0, Math.min(100,
        (price.change + 10) * 2 + (100 - (risk?.overall ?? 30)) * 0.3 + 15)))
    : 50;

  const scoreClass = investmentScore >= 70 ? 'high' : investmentScore >= 40 ? 'medium' : 'low';
  const riskClass = (risk?.overall ?? 0) >= 60 ? 'high' : (risk?.overall ?? 0) >= 30 ? 'medium' : 'low';

  panel.innerHTML = `
    <div class="panel-section">
      <h3>${area || 'エリアを選択'}</h3>
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
      <div style="margin:8px 0">
        <span class="risk-badge ${riskClass}">総合: ${risk.overall}/100</span>
      </div>
      <div style="font-size:12px;margin:4px 0">浸水リスク: ${risk.flood}/100</div>
      <div style="font-size:12px;margin:4px 0">想定震度: ${risk.earthquake}</div>
    </div>
    ` : ''}

    <div class="panel-section">
      <h3>インサイト</h3>
      <ul class="insight-list">
        ${price && price.change > 3 ? `<li>地価上昇が顕著。再開発や交通インフラ改善が要因。</li>` : ''}
        ${price && price.change < 0 ? `<li>地価が下落傾向。底値買いの機会か構造的リスクか要精査。</li>` : ''}
        ${risk && risk.overall >= 60 ? `<li>災害リスクが高め。保険コスト増を価格に織り込む必要あり。</li>` : ''}
        ${risk && risk.flood >= 50 ? `<li>浸水リスク注意。水害保険と止水対策を推奨。</li>` : ''}
        ${!price ? `<li>エリアを選択するとインサイトが表示されます。</li>` : ''}
        <li>詳細は「レポート生成」で確認できます。</li>
      </ul>
    </div>

    <button class="btn-report" id="btn-generate-report">レポート生成</button>
    <button class="btn-gateway">Gateway連携（準備中）</button>
  `;

  document.getElementById('btn-generate-report')?.addEventListener('click', () => {
    showReport(area);
  });
}

function showReport(area: string) {
  const overlay = document.getElementById('report-overlay')!;
  const content = document.getElementById('report-content')!;
  const price = SAMPLE_LAND_PRICES[area];
  const risk = SAMPLE_RISK[area];
  const investmentScore = price
    ? Math.round(Math.max(0, Math.min(100,
        (price.change + 10) * 2 + (100 - (risk?.overall ?? 30)) * 0.3 + 15)))
    : 50;

  content.innerHTML = `
    <button class="report-close" id="close-report">閉じる</button>
    <h1>${area} 不動産投資レポート</h1>
    <p>生成日: ${new Date().toISOString().split('T')[0]}</p>
    <hr>
    <h2>価格動向</h2>
    <table>
      <tr><th>指標</th><th>値</th></tr>
      <tr><td>平均地価</td><td>${price ? (price.price / 10000).toFixed(1) + ' 万円/㎡' : 'N/A'}</td></tr>
      <tr><td>変化率</td><td>${price ? (price.change >= 0 ? '+' : '') + price.change + '%' : 'N/A'}</td></tr>
    </table>
    <h2>スコア</h2>
    <table>
      <tr><th>指標</th><th>スコア</th></tr>
      <tr><td>投資スコア</td><td>${investmentScore} / 100</td></tr>
      <tr><td>リスクスコア</td><td>${risk?.overall ?? 'N/A'} / 100</td></tr>
    </table>
    ${risk ? `
    <h2>リスク詳細</h2>
    <table>
      <tr><th>リスク種別</th><th>値</th></tr>
      <tr><td>浸水リスク</td><td>${risk.flood}/100</td></tr>
      <tr><td>想定震度</td><td>${risk.earthquake}</td></tr>
    </table>
    ` : ''}
    <h2>推奨アクション</h2>
    <ul>
      ${investmentScore >= 70 ? '<li>積極的な投資検討を推奨。リスク調整後でも魅力的。</li>' : ''}
      ${investmentScore >= 40 && investmentScore < 70 ? '<li>選択的な投資検討。物件個別の精査が必要。</li>' : ''}
      ${investmentScore < 40 ? '<li>慎重な検討が必要。代替エリアとの比較を推奨。</li>' : ''}
      ${risk && risk.flood >= 50 ? '<li>水害保険の加入を強く推奨。</li>' : ''}
      ${risk && risk.overall >= 60 ? '<li>南海トラフ地震の想定震度が高い。耐震性能の確認を。</li>' : ''}
    </ul>
    <hr>
    <p style="font-size:11px;color:var(--text-muted)">出典: 国土交通省 不動産価格情報 / 地価公示 / ハザードマップポータル, e-Stat, 愛知県オープンデータ</p>
  `;

  overlay.classList.add('visible');
  document.getElementById('close-report')?.addEventListener('click', () => {
    overlay.classList.remove('visible');
  });
}

function initSearchPanel() {
  const panel = document.getElementById('search-panel')!;

  const areas = Object.keys(MUNICIPALITY_CENTERS);

  panel.innerHTML = `
    <div class="panel-section">
      <h3>エリア検索</h3>
      <div class="form-group">
        <label>市区町村</label>
        <select id="area-select">
          <option value="">エリアを選択...</option>
          ${areas.map(a => `<option value="${a}">${a}</option>`).join('')}
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
    </div>

    <button class="btn-primary" id="btn-analyze">クロス分析</button>
  `;

  document.getElementById('area-select')?.addEventListener('change', (e) => {
    const area = (e.target as HTMLSelectElement).value;
    if (area) {
      selectArea(area);
      const center = MUNICIPALITY_CENTERS[area];
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
