declare const L: any;

interface PriceBucket { min: number; color: string; label: string }

interface PrefectureConfig {
  center: [number, number];
  zoom: number;
  displayName: string;
  capabilities: { humanFlow: boolean; education: boolean; corporate: boolean; crime: boolean; plateau: boolean; transport: boolean; commercial: boolean; medical: boolean };
  municipalities: Record<string, [number, number]>;
  landPrices: Record<string, { price: number; change: number }>;
  priceBuckets: PriceBucket[];
  risk: Record<string, { flood: number; earthquake: string; overall: number }>;
  humanFlow: Record<string, { weekday: number; weekend: number; stay: number; trend: string }>;
  school: Record<string, { score: number; advancement: number }>;
  corporate: Record<string, { establishments: number; major: number; employees: number }>;
  plateau: { name: string; city: string; height: number; lat: number; lng: number }[];
  transport: Record<string, { stations: number; dailyPassengers: number; lines: string[] }>;
  commercial: Record<string, { facilities: number; malls: number; cvs: number; totalGfa: number }>;
  medical: Record<string, { facilities: number; hospitals: number; beds: number }>;
}

const AICHI_PRICE_BUCKETS: PriceBucket[] = [
  { min: 1000000, color: '#ff2d55', label: '100万〜' },
  { min: 500000,  color: '#ff6b35', label: '50万〜100万' },
  { min: 300000,  color: '#ffb340', label: '30万〜50万' },
  { min: 200000,  color: '#ffe066', label: '20万〜30万' },
  { min: 150000,  color: '#a8e6cf', label: '15万〜20万' },
  { min: 0,       color: '#69b7eb', label: '〜15万' },
];

const TOKYO_PRICE_BUCKETS: PriceBucket[] = [
  { min: 10000000, color: '#ff2d55', label: '1000万〜' },
  { min: 5000000,  color: '#ff6b35', label: '500万〜1000万' },
  { min: 2000000,  color: '#ffb340', label: '200万〜500万' },
  { min: 1000000,  color: '#ffe066', label: '100万〜200万' },
  { min: 500000,   color: '#a8e6cf', label: '50万〜100万' },
  { min: 0,        color: '#69b7eb', label: '〜50万' },
];

const PREFECTURES: Record<string, PrefectureConfig> = {
  aichi: {
    center: [35.1, 136.95],
    zoom: 11,
    displayName: '愛知県',
    capabilities: { humanFlow: true, education: true, corporate: true, crime: true, plateau: true, transport: true, commercial: true, medical: true },
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
    priceBuckets: AICHI_PRICE_BUCKETS,
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
    transport: {
      '名古屋市中村区': { stations: 6, dailyPassengers: 1518000, lines: ['JR東海道新幹線','JR東海道本線','地下鉄東山線','地下鉄桜通線','名鉄名古屋本線','近鉄名古屋線'] },
      '名古屋市中区': { stations: 5, dailyPassengers: 777000, lines: ['JR東海道本線','地下鉄東山線','地下鉄名城線','地下鉄鶴舞線','名鉄名古屋本線'] },
      '名古屋市東区': { stations: 4, dailyPassengers: 312000, lines: ['地下鉄東山線','地下鉄名城線','地下鉄桜通線','名鉄瀬戸線'] },
      '名古屋市千種区': { stations: 4, dailyPassengers: 285000, lines: ['JR中央本線','地下鉄東山線','地下鉄名城線','地下鉄桜通線'] },
      '名古屋市名東区': { stations: 3, dailyPassengers: 145000, lines: ['地下鉄東山線','地下鉄名城線','リニモ'] },
      '名古屋市熱田区': { stations: 3, dailyPassengers: 198000, lines: ['JR東海道本線','地下鉄名城線','名鉄名古屋本線'] },
      '名古屋市北区': { stations: 3, dailyPassengers: 125000, lines: ['地下鉄名城線','地下鉄上飯田線','名鉄小牧線'] },
      '名古屋市西区': { stations: 2, dailyPassengers: 95000, lines: ['地下鉄鶴舞線','名鉄犬山線'] },
      '名古屋市昭和区': { stations: 3, dailyPassengers: 162000, lines: ['地下鉄鶴舞線','地下鉄桜通線','地下鉄名城線'] },
      '名古屋市瑞穂区': { stations: 2, dailyPassengers: 88000, lines: ['地下鉄桜通線','地下鉄名城線'] },
      '名古屋市港区': { stations: 2, dailyPassengers: 42000, lines: ['地下鉄名港線','あおなみ線'] },
      '名古屋市中川区': { stations: 2, dailyPassengers: 55000, lines: ['あおなみ線','近鉄名古屋線'] },
      '名古屋市緑区': { stations: 2, dailyPassengers: 72000, lines: ['地下鉄桜通線','名鉄名古屋本線'] },
      '名古屋市南区': { stations: 2, dailyPassengers: 48000, lines: ['JR東海道本線','名鉄常滑線'] },
      '名古屋市天白区': { stations: 2, dailyPassengers: 68000, lines: ['地下鉄鶴舞線','地下鉄桜通線'] },
      '名古屋市守山区': { stations: 2, dailyPassengers: 52000, lines: ['名鉄瀬戸線','ゆとりーとライン'] },
      '豊田市': { stations: 3, dailyPassengers: 85000, lines: ['名鉄三河線','名鉄豊田線','愛知環状鉄道'] },
      '岡崎市': { stations: 3, dailyPassengers: 62000, lines: ['JR東海道本線','名鉄名古屋本線','愛知環状鉄道'] },
      '一宮市': { stations: 2, dailyPassengers: 78000, lines: ['JR東海道本線','名鉄名古屋本線'] },
      '春日井市': { stations: 3, dailyPassengers: 92000, lines: ['JR中央本線','名鉄小牧線','城北線'] },
      '豊橋市': { stations: 3, dailyPassengers: 72000, lines: ['JR東海道新幹線','JR東海道本線','豊橋鉄道'] },
      '安城市': { stations: 2, dailyPassengers: 38000, lines: ['JR東海道本線','名鉄西尾線'] },
      '刈谷市': { stations: 2, dailyPassengers: 55000, lines: ['JR東海道本線','名鉄三河線'] },
      '小牧市': { stations: 2, dailyPassengers: 32000, lines: ['名鉄小牧線','名鉄犬山線'] },
    },
    commercial: {
      '名古屋市中村区': { facilities: 1850, malls: 8, cvs: 245, totalGfa: 1820000 },
      '名古屋市中区': { facilities: 2340, malls: 12, cvs: 310, totalGfa: 2450000 },
      '名古屋市東区': { facilities: 680, malls: 3, cvs: 95, totalGfa: 520000 },
      '名古屋市千種区': { facilities: 520, malls: 2, cvs: 82, totalGfa: 380000 },
      '名古屋市名東区': { facilities: 410, malls: 2, cvs: 65, totalGfa: 290000 },
      '名古屋市緑区': { facilities: 380, malls: 3, cvs: 58, totalGfa: 420000 },
      '名古屋市港区': { facilities: 290, malls: 2, cvs: 42, totalGfa: 350000 },
      '名古屋市熱田区': { facilities: 450, malls: 2, cvs: 55, totalGfa: 310000 },
      '名古屋市昭和区': { facilities: 340, malls: 1, cvs: 52, totalGfa: 185000 },
      '名古屋市天白区': { facilities: 280, malls: 1, cvs: 48, totalGfa: 165000 },
      '名古屋市瑞穂区': { facilities: 260, malls: 1, cvs: 38, totalGfa: 145000 },
      '名古屋市中川区': { facilities: 320, malls: 2, cvs: 55, totalGfa: 280000 },
      '名古屋市北区': { facilities: 310, malls: 1, cvs: 48, totalGfa: 175000 },
      '名古屋市西区': { facilities: 350, malls: 2, cvs: 52, totalGfa: 210000 },
      '名古屋市南区': { facilities: 270, malls: 1, cvs: 40, totalGfa: 155000 },
      '名古屋市守山区': { facilities: 240, malls: 1, cvs: 38, totalGfa: 140000 },
      '豊田市': { facilities: 620, malls: 4, cvs: 85, totalGfa: 580000 },
      '岡崎市': { facilities: 480, malls: 3, cvs: 72, totalGfa: 420000 },
      '一宮市': { facilities: 420, malls: 2, cvs: 65, totalGfa: 350000 },
      '春日井市': { facilities: 390, malls: 2, cvs: 58, totalGfa: 310000 },
      '豊橋市': { facilities: 450, malls: 3, cvs: 68, totalGfa: 380000 },
      '安城市': { facilities: 280, malls: 1, cvs: 42, totalGfa: 195000 },
      '刈谷市': { facilities: 310, malls: 2, cvs: 48, totalGfa: 225000 },
      '小牧市': { facilities: 260, malls: 1, cvs: 38, totalGfa: 175000 },
    },
    medical: {
      '名古屋市中村区': { facilities: 185, hospitals: 8, beds: 2850 },
      '名古屋市中区': { facilities: 245, hospitals: 12, beds: 3200 },
      '名古屋市東区': { facilities: 120, hospitals: 5, beds: 1850 },
      '名古屋市千種区': { facilities: 210, hospitals: 9, beds: 4200 },
      '名古屋市名東区': { facilities: 145, hospitals: 4, beds: 1200 },
      '名古屋市緑区': { facilities: 135, hospitals: 5, beds: 1650 },
      '名古屋市港区': { facilities: 85, hospitals: 3, beds: 920 },
      '名古屋市熱田区': { facilities: 98, hospitals: 4, beds: 1380 },
      '名古屋市昭和区': { facilities: 180, hospitals: 8, beds: 3800 },
      '名古屋市天白区': { facilities: 110, hospitals: 4, beds: 1100 },
      '名古屋市瑞穂区': { facilities: 125, hospitals: 5, beds: 1950 },
      '名古屋市中川区': { facilities: 105, hospitals: 4, beds: 1050 },
      '名古屋市北区': { facilities: 115, hospitals: 4, beds: 1250 },
      '名古屋市西区': { facilities: 108, hospitals: 3, beds: 980 },
      '名古屋市南区': { facilities: 92, hospitals: 3, beds: 850 },
      '名古屋市守山区': { facilities: 88, hospitals: 3, beds: 780 },
      '豊田市': { facilities: 165, hospitals: 7, beds: 2800 },
      '岡崎市': { facilities: 142, hospitals: 6, beds: 2350 },
      '一宮市': { facilities: 128, hospitals: 5, beds: 1950 },
      '春日井市': { facilities: 118, hospitals: 5, beds: 1750 },
      '豊橋市': { facilities: 155, hospitals: 7, beds: 2600 },
      '安城市': { facilities: 72, hospitals: 3, beds: 850 },
      '刈谷市': { facilities: 85, hospitals: 3, beds: 1050 },
      '小牧市': { facilities: 68, hospitals: 2, beds: 620 },
    },
  },
  tokyo: {
    center: [35.68, 139.76],
    zoom: 11,
    displayName: '東京都',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
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
    priceBuckets: TOKYO_PRICE_BUCKETS,
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
    transport: {},
    commercial: {},
    medical: {},
  },
  osaka: {
    center: [34.6863, 135.5200],
    zoom: 11,
    displayName: '大阪府',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '中央区': [34.6723, 135.5013], '北区': [34.7024, 135.4983],
      '浪速区': [34.6625, 135.5012], '天王寺区': [34.6530, 135.5187],
      '阿倍野区': [34.6346, 135.5142], '西区': [34.6781, 135.4901],
      '福島区': [34.6941, 135.4832], '都島区': [34.7108, 135.5201],
      '淀川区': [34.7321, 135.5001], '東淀川区': [34.7489, 135.5231],
      '城東区': [34.6912, 135.5412], '鶴見区': [34.7012, 135.5621],
      '住吉区': [34.6123, 135.5067], '住之江区': [34.6112, 135.4832],
      '東住吉区': [34.6198, 135.5312], '平野区': [34.6212, 135.5567],
      '堺市堺区': [34.5731, 135.4834], '東大阪市': [34.6782, 135.5912],
      '豊中市': [34.7812, 135.4701], '吹田市': [34.7621, 135.4921],
      '高槻市': [34.8480, 135.6173], '枚方市': [34.8143, 135.6512],
    },
    landPrices: {
      '中央区': { price: 12800000, change: 3.8 }, '北区': { price: 14500000, change: 4.2 },
      '浪速区': { price: 9800000, change: 3.1 }, '天王寺区': { price: 3400000, change: 1.8 },
      '阿倍野区': { price: 4100000, change: 2.3 }, '西区': { price: 1280000, change: 2.8 },
      '福島区': { price: 1120000, change: 2.2 }, '都島区': { price: 680000, change: 1.4 },
      '淀川区': { price: 3800000, change: 2.7 }, '東大阪市': { price: 380000, change: 0.9 },
      '豊中市': { price: 480000, change: 1.3 }, '吹田市': { price: 1250000, change: 2.1 },
      '高槻市': { price: 580000, change: 0.9 }, '枚方市': { price: 420000, change: 0.8 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '住之江区': { flood: 70, earthquake: '6弱', overall: 65 },
      '此花区': { flood: 75, earthquake: '6弱', overall: 70 },
      '淀川区': { flood: 65, earthquake: '6弱', overall: 62 },
      '浪速区': { flood: 50, earthquake: '6弱', overall: 55 },
      '中央区': { flood: 20, earthquake: '6弱', overall: 38 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
  fukuoka: {
    center: [33.5902, 130.4017],
    zoom: 11,
    displayName: '福岡県',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '福岡市中央区': [33.5902, 130.3985], '福岡市博多区': [33.5904, 130.4200],
      '福岡市東区': [33.6183, 130.4324], '福岡市南区': [33.5538, 130.4180],
      '福岡市西区': [33.5831, 130.3390], '福岡市城南区': [33.5621, 130.3731],
      '福岡市早良区': [33.5696, 130.3498], '北九州市小倉北区': [33.8834, 130.8750],
      '北九州市八幡西区': [33.8701, 130.7980], '久留米市': [33.3192, 130.5081],
      '春日市': [33.5341, 130.4681], '大野城市': [33.5351, 130.4781],
      '筑紫野市': [33.4912, 130.5121], '太宰府市': [33.5141, 130.5321],
      '飯塚市': [33.6451, 130.6921], '宗像市': [33.8051, 130.5401],
    },
    landPrices: {
      '福岡市中央区': { price: 4200000, change: 5.2 }, '福岡市博多区': { price: 3800000, change: 4.8 },
      '福岡市東区': { price: 320000, change: 2.1 }, '福岡市南区': { price: 280000, change: 2.3 },
      '福岡市西区': { price: 250000, change: 1.8 }, '北九州市小倉北区': { price: 420000, change: 1.5 },
      '久留米市': { price: 155000, change: 1.2 }, '春日市': { price: 240000, change: 2.8 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '福岡市博多区': { flood: 55, earthquake: '6弱', overall: 52 },
      '福岡市中央区': { flood: 25, earthquake: '6弱', overall: 42 },
      '福岡市東区': { flood: 30, earthquake: '5強', overall: 35 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
  hokkaido: {
    center: [43.0618, 141.3545],
    zoom: 10,
    displayName: '北海道',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '札幌市中央区': [43.0618, 141.3545], '札幌市北区': [43.0921, 141.3412],
      '札幌市東区': [43.0821, 141.3812], '札幌市白石区': [43.0521, 141.3981],
      '札幌市豊平区': [43.0321, 141.3812], '札幌市南区': [42.9821, 141.3412],
      '札幌市西区': [43.0721, 141.3012], '札幌市厚別区': [43.0421, 141.4381],
      '札幌市手稲区': [43.1121, 141.2512], '札幌市清田区': [42.9921, 141.4181],
      '函館市': [41.7688, 140.7290], '旭川市': [43.7706, 142.3651],
      '小樽市': [43.1907, 140.9947], '釧路市': [42.9849, 144.3820],
      '帯広市': [42.9237, 143.1965], '苫小牧市': [42.6326, 141.6047],
    },
    landPrices: {
      '札幌市中央区': { price: 1200000, change: 4.8 }, '札幌市北区': { price: 160000, change: 2.1 },
      '札幌市白石区': { price: 140000, change: 1.8 }, '札幌市豊平区': { price: 165000, change: 2.2 },
      '函館市': { price: 80000, change: -0.5 }, '旭川市': { price: 65000, change: -0.3 },
      '小樽市': { price: 55000, change: -0.8 }, '釧路市': { price: 42000, change: -1.2 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '札幌市中央区': { flood: 35, earthquake: '6強', overall: 50 },
      '釧路市': { flood: 45, earthquake: '5強', overall: 42 },
      '函館市': { flood: 30, earthquake: '6弱', overall: 38 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
  kanagawa: {
    center: [35.4478, 139.6425],
    zoom: 11,
    displayName: '神奈川県',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '横浜市西区': [35.4648, 139.6222], '横浜市中区': [35.4437, 139.6380],
      '横浜市神奈川区': [35.4801, 139.6298], '横浜市港北区': [35.5076, 139.6251],
      '横浜市都筑区': [35.5432, 139.5812], '横浜市青葉区': [35.5601, 139.5398],
      '横浜市鶴見区': [35.5081, 139.6781], '横浜市南区': [35.4198, 139.6182],
      '横浜市保土ケ谷区': [35.4512, 139.5882], '横浜市旭区': [35.4651, 139.5498],
      '川崎市川崎区': [35.5312, 139.7021], '川崎市中原区': [35.5678, 139.6601],
      '川崎市高津区': [35.5812, 139.6201], '川崎市幸区': [35.5481, 139.6721],
      '相模原市中央区': [35.5712, 139.3731], '藤沢市': [35.3378, 139.4890],
      '平塚市': [35.3281, 139.3498], '小田原市': [35.2651, 139.1552],
      '茅ヶ崎市': [35.3322, 139.4050], '厚木市': [35.4433, 139.3613],
    },
    landPrices: {
      '横浜市西区': { price: 4200000, change: 3.5 }, '横浜市中区': { price: 2800000, change: 2.8 },
      '横浜市港北区': { price: 1600000, change: 3.2 }, '横浜市都筑区': { price: 450000, change: 2.5 },
      '川崎市川崎区': { price: 1100000, change: 2.8 }, '川崎市中原区': { price: 2500000, change: 4.2 },
      '相模原市中央区': { price: 260000, change: 1.5 }, '藤沢市': { price: 320000, change: 2.0 },
      '平塚市': { price: 200000, change: 1.2 }, '小田原市': { price: 160000, change: 0.8 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '川崎市川崎区': { flood: 70, earthquake: '6強', overall: 78 },
      '横浜市中区': { flood: 45, earthquake: '6強', overall: 62 },
      '横浜市西区': { flood: 30, earthquake: '6強', overall: 55 },
      '藤沢市': { flood: 35, earthquake: '6弱', overall: 45 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
  kyoto: {
    center: [35.0116, 135.7681],
    zoom: 11,
    displayName: '京都府',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '京都市中京区': [35.0116, 135.7681], '京都市下京区': [34.9886, 135.7581],
      '京都市上京区': [35.0281, 135.7581], '京都市東山区': [34.9981, 135.7821],
      '京都市左京区': [35.0421, 135.7821], '京都市右京区': [35.0121, 135.7181],
      '京都市伏見区': [34.9381, 135.7681], '京都市南区': [34.9781, 135.7481],
      '京都市北区': [35.0681, 135.7481], '京都市西京区': [34.9981, 135.6981],
      '京都市山科区': [34.9881, 135.8181], '宇治市': [34.8848, 135.7981],
      '長岡京市': [34.9251, 135.6881], '京田辺市': [34.8151, 135.7681],
      '亀岡市': [35.0051, 135.5781], '向日市': [34.9451, 135.6981],
    },
    landPrices: {
      '京都市中京区': { price: 5800000, change: 6.2 }, '京都市下京区': { price: 3500000, change: 5.1 },
      '京都市東山区': { price: 1200000, change: 8.5 }, '京都市上京区': { price: 420000, change: 3.2 },
      '京都市左京区': { price: 350000, change: 2.8 }, '京都市伏見区': { price: 230000, change: 1.8 },
      '宇治市': { price: 190000, change: 1.5 }, '長岡京市': { price: 260000, change: 2.1 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '京都市伏見区': { flood: 55, earthquake: '6強', overall: 58 },
      '京都市南区': { flood: 45, earthquake: '6弱', overall: 48 },
      '京都市中京区': { flood: 15, earthquake: '6弱', overall: 32 },
      '宇治市': { flood: 50, earthquake: '6弱', overall: 52 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
  hyogo: {
    center: [34.6913, 135.1956],
    zoom: 11,
    displayName: '兵庫県',
    capabilities: { humanFlow: false, education: false, corporate: false, crime: false, plateau: false, transport: false, commercial: false, medical: false },
    municipalities: {
      '神戸市中央区': [34.6913, 135.1956], '神戸市東灘区': [34.7201, 135.2681],
      '神戸市灘区': [34.7201, 135.2181], '神戸市兵庫区': [34.6781, 135.1681],
      '神戸市長田区': [34.6581, 135.1481], '神戸市須磨区': [34.6281, 135.1281],
      '神戸市垂水区': [34.6181, 135.0981], '神戸市西区': [34.6781, 135.0481],
      '神戸市北区': [34.7681, 135.1181], '姫路市': [34.8394, 134.6939],
      '西宮市': [34.7381, 135.3381], '尼崎市': [34.7351, 135.4061],
      '明石市': [34.6551, 134.9981], '宝塚市': [34.7981, 135.3581],
      '伊丹市': [34.7781, 135.4081], '芦屋市': [34.7281, 135.3081],
      '加古川市': [34.7551, 134.8381], '三田市': [34.8881, 135.2281],
    },
    landPrices: {
      '神戸市中央区': { price: 2800000, change: 3.2 }, '神戸市東灘区': { price: 450000, change: 2.8 },
      '神戸市灘区': { price: 350000, change: 2.2 }, '西宮市': { price: 480000, change: 3.0 },
      '尼崎市': { price: 270000, change: 1.8 }, '明石市': { price: 260000, change: 2.1 },
      '姫路市': { price: 160000, change: 1.0 }, '宝塚市': { price: 300000, change: 2.5 },
    },
    priceBuckets: TOKYO_PRICE_BUCKETS,
    risk: {
      '神戸市長田区': { flood: 30, earthquake: '7', overall: 72 },
      '神戸市東灘区': { flood: 25, earthquake: '7', overall: 68 },
      '尼崎市': { flood: 65, earthquake: '6強', overall: 70 },
      '神戸市中央区': { flood: 35, earthquake: '6強', overall: 58 },
    },
    humanFlow: {},
    school: {},
    corporate: {},
    plateau: [],
    transport: {},
    commercial: {},
    medical: {},
  },
};

let map: any;
let mapSecondary: any = null;
let currentLayer = 'land_price';
let currentPrefecture = 'aichi';
let selectedArea = '';
let currentOverlayGroup: any = null;
let secondaryOverlayGroup: any = null;
let comparisonMode = false;
let currentTimePreset: 'morning' | 'noon' | 'evening' = 'noon';
let currentDashboardMode: 'investment' | 'store' = 'investment';

function pref(key?: string): PrefectureConfig { return PREFECTURES[key ?? currentPrefecture]; }
function secondaryPrefKey(): string { return currentPrefecture === 'aichi' ? 'tokyo' : 'aichi'; }

// ── Dual-mode: layer lists ────────────────────────────────────────────────────

/** Layers that are always shown regardless of mode */
const BASE_LAYERS = ['land_price', 'flood_risk', 'transaction', 'population'];

/** Layers emphasized in investment mode (ordered for the control bar) */
const INVESTMENT_LAYERS = [
  'land_price', 'flood_risk', 'transaction', 'population',
  'human_flow', 'school_district', 'corporate_density',
  'plateau_3d', 'shadow',
  'transport', 'commercial_facilities', 'medical_facilities',
];

/** Layers emphasized in store mode (ordered: store-critical first) */
const STORE_LAYERS = [
  'human_flow', 'transport', 'commercial_facilities', 'medical_facilities',
  'land_price', 'flood_risk', 'population', 'transaction',
  'corporate_density', 'plateau_3d', 'shadow', 'school_district',
];

function getDefaultLayerForMode(mode: 'investment' | 'store'): string {
  return mode === 'store' ? 'human_flow' : 'land_price';
}

function getLayerOrderForMode(mode: 'investment' | 'store'): string[] {
  return mode === 'store' ? STORE_LAYERS : INVESTMENT_LAYERS;
}

/** Returns true if the layer is "primary" for the current mode (used for highlight) */
function isLayerPrimaryForMode(layer: string, mode: 'investment' | 'store'): boolean {
  const primary: Record<'investment' | 'store', string[]> = {
    investment: ['land_price', 'flood_risk', 'human_flow', 'school_district', 'corporate_density'],
    store: ['human_flow', 'transport', 'commercial_facilities', 'medical_facilities'],
  };
  return primary[mode].includes(layer);
}

function applyMode(mode: 'investment' | 'store') {
  currentDashboardMode = mode;
  // Update toggle button appearance
  document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });
  // Switch to mode default layer if current layer is not available
  const defaultLayer = getDefaultLayerForMode(mode);
  if (!isLayerAvailable(currentLayer)) {
    currentLayer = defaultLayer;
  } else if (mode === 'store' && currentLayer === 'land_price') {
    // Auto-switch to human_flow when entering store mode for the first time
    currentLayer = defaultLayer;
  } else if (mode === 'investment' && currentLayer === 'human_flow') {
    currentLayer = getDefaultLayerForMode('investment');
  }
  switchLayer(currentLayer);
  renderLayerControl();
  if (selectedArea) updateInsightPanel(selectedArea);
  // Show/hide mode hint banner
  const banner = document.getElementById('mode-hint-banner');
  if (banner) {
    if (mode === 'store') {
      banner.style.display = 'block';
      banner.textContent = '店舗出店戦略モード — 人流・交通・商業施設データを優先表示中';
    } else {
      banner.style.display = 'none';
    }
  }
}

function renderModeToggle() {
  const existing = document.getElementById('mode-toggle-bar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'mode-toggle-bar';
  bar.innerHTML = `
    <button class="mode-toggle-btn ${currentDashboardMode === 'investment' ? 'active' : ''}" data-mode="investment">
      <span class="mode-icon">🏢</span>
      <span class="mode-label">不動産投資</span>
    </button>
    <button class="mode-toggle-btn ${currentDashboardMode === 'store' ? 'active' : ''}" data-mode="store">
      <span class="mode-icon">🏪</span>
      <span class="mode-label">店舗出店戦略</span>
    </button>
  `;
  bar.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.mode-toggle-btn') as HTMLElement | null;
    const mode = target?.getAttribute('data-mode') as 'investment' | 'store' | undefined;
    if (mode && mode !== currentDashboardMode) applyMode(mode);
  });

  // Insert into the header element (right-side via margin-left: auto on the bar)
  const header = document.getElementById('header') as HTMLElement | null;
  if (header) {
    header.appendChild(bar);
  } else {
    document.body.prepend(bar);
  }
}

function renderModeBanner() {
  const existing = document.getElementById('mode-hint-banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'mode-hint-banner';
  banner.style.display = 'none';
  document.getElementById('map-wrapper')?.prepend(banner);
}

function priceToColor(price: number): string {
  return priceToColorFor(price, currentPrefecture);
}

function riskToColor(overall: number): string {
  if (overall >= 70) return '#ff2d55';
  if (overall >= 50) return '#ff6b35';
  if (overall >= 30) return '#ffb340';
  return '#34d399';
}

function createLeafletMap(containerId: string, prefKey: string): any {
  const cfg = pref(prefKey);
  const m = L.map(containerId, { center: cfg.center, zoom: cfg.zoom, zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(m);
  return m;
}

function toggleShadowControls(show: boolean) {
  const ctrl = document.getElementById('shadow-controls');
  if (ctrl) ctrl.classList.toggle('active', show);
}

function initShadowControls() {
  const container = document.getElementById('map-container');
  if (!container) return;
  const div = document.createElement('div');
  div.id = 'shadow-controls';
  div.innerHTML = `
    <label>影シミュレーション</label>
    <button class="time-btn" data-time="morning">朝 8:00</button>
    <button class="time-btn active" data-time="noon">正午 12:00</button>
    <button class="time-btn" data-time="evening">夕方 17:00</button>
  `;
  div.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const time = target.getAttribute('data-time') as 'morning' | 'noon' | 'evening' | null;
    if (!time) return;
    currentTimePreset = time;
    div.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    target.classList.add('active');
    if (currentLayer === 'shadow') renderShadowLayer();
  });
  container.appendChild(div);
}

function initMap() {
  map = createLeafletMap('map-container', currentPrefecture);
  renderLandPriceLayer();
  renderLayerControl();
  initShadowControls();
  renderLegend();
}

function enableComparisonLayout() {
  const wrapper = document.getElementById('map-wrapper');
  if (!wrapper) return;
  wrapper.classList.add('comparison-split');
  let secondary = document.getElementById('map-container-secondary');
  if (!secondary) {
    secondary = document.createElement('div');
    secondary.id = 'map-container-secondary';
    secondary.className = 'map-container-secondary';
    wrapper.appendChild(secondary);
  }
  const secKey = secondaryPrefKey();
  mapSecondary = createLeafletMap('map-container-secondary', secKey);
  setTimeout(() => { if (mapSecondary) mapSecondary.invalidateSize(); }, 200);
}

function disableComparisonLayout() {
  const wrapper = document.getElementById('map-wrapper');
  if (!wrapper) return;
  wrapper.classList.remove('comparison-split');
  if (mapSecondary) {
    mapSecondary.remove();
    mapSecondary = null;
    secondaryOverlayGroup = null;
  }
  const secondary = document.getElementById('map-container-secondary');
  if (secondary) secondary.remove();
}

function clearOverlayOn(mapInst: any, group: any): null {
  if (group) mapInst.removeLayer(group);
  return null;
}

function clearOverlay() {
  currentOverlayGroup = clearOverlayOn(map, currentOverlayGroup);
  if (mapSecondary) secondaryOverlayGroup = clearOverlayOn(mapSecondary, secondaryOverlayGroup);
}

function addLayerToMap(mapInst: any, group: any): any {
  group.addTo(mapInst);
  return group;
}

function buildLandPriceGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const data = config.landPrices[name];
    if (!data) continue;
    const color = priceToColorFor(data.price, prefKey);
    const circle = L.circle(center, {
      radius: 1200, fillColor: color, fillOpacity: 0.6, color, weight: 1, opacity: 0.8,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>平均地価</span><span>${(data.price / 10000).toFixed(1)}万円/㎡</span></div>
      <div class="popup-row"><span>変化率</span><span style="color:${data.change >= 0 ? '#34d399' : '#ff4d6a'}">${data.change >= 0 ? '+' : ''}${data.change}%</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildFloodRiskGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
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
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildTransactionGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    if (!config.landPrices[name]) continue;
    const txCount = Math.floor(5 + Math.random() * 20);
    const circle = L.circle(center, {
      radius: 300 + txCount * 50, fillColor: '#4f8cff', fillOpacity: 0.3, color: '#4f8cff', weight: 1,
    });
    circle.bindPopup(`<div class="popup-title">${name}</div><div class="popup-row"><span>取引件数</span><span>${txCount}件</span></div>`);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildPopulationGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const circle = L.circle(center, { radius: 1000, fillColor: '#34d399', fillOpacity: 0.3, color: '#34d399', weight: 1 });
    circle.bindPopup(`<div class="popup-title">${name}</div>`);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildHumanFlowGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const flow = config.humanFlow[name];
    if (!flow) continue;
    const avgFlow = (flow.weekday + flow.weekend) / 2;
    const radius = Math.max(500, Math.sqrt(avgFlow) * 2);
    const intensity = Math.min(1, avgFlow / 150000);
    const borderColor = flow.trend === 'increasing' ? '#34d399' : flow.trend === 'decreasing' ? '#ff4d6a' : '#4f8cff';
    const circle = L.circle(center, {
      radius, fillColor: `rgba(79,140,255,${0.2 + intensity * 0.6})`, fillOpacity: 0.5, color: borderColor, weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>平日人流</span><span>${flow.weekday.toLocaleString()}人/日</span></div>
      <div class="popup-row"><span>休日人流</span><span>${flow.weekend.toLocaleString()}人/日</span></div>
      <div class="popup-row"><span>平均滞在</span><span>${flow.stay}分</span></div>
      <div class="popup-row"><span>トレンド</span><span style="color:${borderColor}">${flow.trend === 'increasing' ? '↑増加' : flow.trend === 'decreasing' ? '↓減少' : '→安定'}</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildSchoolGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const school = config.school[name];
    if (!school) continue;
    const color = school.score >= 75 ? '#34d399' : school.score >= 60 ? '#ffb340' : '#ff4d6a';
    const circle = L.circle(center, { radius: 1000, fillColor: color, fillOpacity: 0.4, color, weight: 2 });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>教育スコア</span><span style="color:${color}">${school.score}/100</span></div>
      <div class="popup-row"><span>大学進学率</span><span>${school.advancement}%</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildCorporateGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const corp = config.corporate[name];
    if (!corp) continue;
    const radius = Math.max(500, Math.sqrt(corp.employees) * 1.5);
    const intensity = Math.min(0.8, corp.major / 200);
    const circle = L.circle(center, {
      radius, fillColor: `rgba(168,85,247,${0.2 + intensity})`, fillOpacity: 0.5, color: '#a855f7', weight: 1,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>事業所数</span><span>${corp.establishments.toLocaleString()}</span></div>
      <div class="popup-row"><span>大企業</span><span>${corp.major}社</span></div>
      <div class="popup-row"><span>従業者</span><span>${corp.employees.toLocaleString()}人</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildPlateauGroup(prefKey: string): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
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
    group.addLayer(circle);
  }
  return group;
}

function buildShadowGroup(prefKey: string, onClickArea?: (name: string) => void, timePreset?: 'morning' | 'noon' | 'evening'): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  const preset = timePreset ?? currentTimePreset;

  const sunParams: Record<string, { azimuthDeg: number; altitudeDeg: number; label: string }> = {
    morning: { azimuthDeg: 120, altitudeDeg: 20, label: '朝 8:00' },
    noon:    { azimuthDeg: 180, altitudeDeg: 65, label: '正午 12:00' },
    evening: { azimuthDeg: 240, altitudeDeg: 15, label: '夕方 17:00' },
  };
  const sun = sunParams[preset];
  const azRad = (sun.azimuthDeg * Math.PI) / 180;
  const altRad = (sun.altitudeDeg * Math.PI) / 180;

  for (const bldg of config.plateau) {
    const heightM = bldg.height;
    const shadowLen = heightM / Math.tan(altRad);
    const latRad = (bldg.lat * Math.PI) / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(latRad);

    const dxM = Math.sin(azRad) * shadowLen;
    const dyM = -Math.cos(azRad) * shadowLen;
    const dLat = dyM / mPerDegLat;
    const dLng = dxM / mPerDegLng;

    const footprintSide = Math.sqrt(heightM) * 0.5;
    const halfLatF = (footprintSide / 2) / mPerDegLat;
    const halfLngF = (footprintSide / 2) / mPerDegLng;

    const corners = [
      [bldg.lat - halfLatF, bldg.lng - halfLngF],
      [bldg.lat - halfLatF, bldg.lng + halfLngF],
      [bldg.lat + halfLatF, bldg.lng + halfLngF],
      [bldg.lat + halfLatF, bldg.lng - halfLngF],
    ];
    const shadowPoly = [
      corners[0],
      corners[1],
      [corners[1][0] + dLat, corners[1][1] + dLng],
      [corners[2][0] + dLat, corners[2][1] + dLng],
      [corners[3][0] + dLat, corners[3][1] + dLng],
      corners[3],
    ];

    const polygon = L.polygon(shadowPoly as [number, number][], {
      fillColor: '#000000', fillOpacity: 0.3, color: '#000000', weight: 0.5, opacity: 0.4,
    });
    polygon.bindPopup(`
      <div class="popup-title">${bldg.name} の影</div>
      <div class="popup-row"><span>時刻</span><span>${sun.label}</span></div>
      <div class="popup-row"><span>影の長さ</span><span>${Math.round(shadowLen)}m</span></div>
      <div class="popup-row"><span>影響範囲</span><span>${shadowLen > 200 ? '広範囲' : shadowLen > 100 ? '中程度' : '限定的'}</span></div>
    `);
    group.addLayer(polygon);

    const circle = L.circleMarker([bldg.lat, bldg.lng], {
      radius: 7, fillColor: '#8b5cf6', fillOpacity: 0.8, color: '#fff', weight: 1,
    });
    const shadowImpact = shadowLen > 200 ? '高' : shadowLen > 100 ? '中' : '低';
    const floors = Math.round(heightM / 3.5);
    circle.bindPopup(`
      <div class="popup-title">${bldg.name}</div>
      <div class="popup-row"><span>高さ</span><span>${heightM}m</span></div>
      <div class="popup-row"><span>階数(推定)</span><span>${floors}F</span></div>
      <div class="popup-row"><span>影の影響</span><span style="color:${shadowImpact === '高' ? '#ff4d6a' : shadowImpact === '中' ? '#ffb340' : '#34d399'}">${shadowImpact}</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(bldg.city));
    group.addLayer(circle);
  }
  return group;
}

function buildTransportGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const trans = config.transport[name];
    if (!trans) continue;
    const radius = Math.max(400, Math.sqrt(trans.dailyPassengers) * 0.3);
    const circle = L.circle(center, {
      radius, fillColor: '#14b8a6', fillOpacity: 0.5, color: '#14b8a6', weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>駅数</span><span>${trans.stations}</span></div>
      <div class="popup-row"><span>日乗降客数</span><span>${trans.dailyPassengers.toLocaleString()}人</span></div>
      <div class="popup-row"><span>路線</span><span>${trans.lines.join('、')}</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildCommercialGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const com = config.commercial[name];
    if (!com) continue;
    const radius = Math.max(400, Math.sqrt(com.totalGfa) * 0.5);
    const circle = L.circle(center, {
      radius, fillColor: '#f59e0b', fillOpacity: 0.5, color: '#f59e0b', weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>施設数</span><span>${com.facilities}</span></div>
      <div class="popup-row"><span>大型モール</span><span>${com.malls}</span></div>
      <div class="popup-row"><span>コンビニ</span><span>${com.cvs}</span></div>
      <div class="popup-row"><span>延床面積</span><span>${com.totalGfa.toLocaleString()}㎡</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function buildMedicalGroup(prefKey: string, onClickArea?: (name: string) => void): any {
  const group = L.layerGroup();
  const config = pref(prefKey);
  for (const [name, center] of Object.entries(config.municipalities)) {
    const med = config.medical[name];
    if (!med) continue;
    const radius = Math.max(400, med.facilities * 4);
    const circle = L.circle(center, {
      radius, fillColor: '#ec4899', fillOpacity: 0.5, color: '#ec4899', weight: 2,
    });
    circle.bindPopup(`
      <div class="popup-title">${name}</div>
      <div class="popup-row"><span>医療施設数</span><span>${med.facilities}</span></div>
      <div class="popup-row"><span>病院数</span><span>${med.hospitals}</span></div>
      <div class="popup-row"><span>病床数</span><span>${med.beds.toLocaleString()}</span></div>
    `);
    if (onClickArea) circle.on('click', () => onClickArea(name));
    group.addLayer(circle);
  }
  return group;
}

function priceToColorFor(price: number, prefKey: string): string {
  for (const bucket of pref(prefKey).priceBuckets) {
    if (price >= bucket.min) return bucket.color;
  }
  return '#69b7eb';
}

function renderLayerOn(mapInst: any, layer: string, prefKey: string, onClickArea?: (name: string) => void): any {
  switch (layer) {
    case 'land_price': return addLayerToMap(mapInst, buildLandPriceGroup(prefKey, onClickArea));
    case 'flood_risk': return addLayerToMap(mapInst, buildFloodRiskGroup(prefKey, onClickArea));
    case 'transaction': return addLayerToMap(mapInst, buildTransactionGroup(prefKey, onClickArea));
    case 'population': return addLayerToMap(mapInst, buildPopulationGroup(prefKey, onClickArea));
    case 'human_flow': return addLayerToMap(mapInst, buildHumanFlowGroup(prefKey, onClickArea));
    case 'school_district': return addLayerToMap(mapInst, buildSchoolGroup(prefKey, onClickArea));
    case 'corporate_density': return addLayerToMap(mapInst, buildCorporateGroup(prefKey, onClickArea));
    case 'plateau_3d': return addLayerToMap(mapInst, buildPlateauGroup(prefKey));
    case 'transport': return addLayerToMap(mapInst, buildTransportGroup(prefKey, onClickArea));
    case 'commercial_facilities': return addLayerToMap(mapInst, buildCommercialGroup(prefKey, onClickArea));
    case 'medical_facilities': return addLayerToMap(mapInst, buildMedicalGroup(prefKey, onClickArea));
    case 'shadow': return addLayerToMap(mapInst, buildShadowGroup(prefKey, onClickArea, currentTimePreset));
    default: return null;
  }
}

function renderLandPriceLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'land_price', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'land_price', secondaryPrefKey());
  }
}

function renderFloodRiskLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'flood_risk', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'flood_risk', secondaryPrefKey());
  }
}

function renderTransactionLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'transaction', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'transaction', secondaryPrefKey());
  }
}

function renderPopulationLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'population', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'population', secondaryPrefKey());
  }
}

function renderHumanFlowLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'human_flow', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'human_flow', secondaryPrefKey());
  }
}

function renderSchoolDistrictLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'school_district', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'school_district', secondaryPrefKey());
  }
}

function renderCorporateDensityLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'corporate_density', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'corporate_density', secondaryPrefKey());
  }
}

function renderPlateau3DLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'plateau_3d', currentPrefecture);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'plateau_3d', secondaryPrefKey());
  }
}

function renderTransportLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'transport', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'transport', secondaryPrefKey());
  }
}

function renderCommercialFacilitiesLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'commercial_facilities', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'commercial_facilities', secondaryPrefKey());
  }
}

function renderMedicalFacilitiesLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'medical_facilities', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'medical_facilities', secondaryPrefKey());
  }
}

function renderShadowLayer() {
  clearOverlay();
  currentOverlayGroup = renderLayerOn(map, 'shadow', currentPrefecture, selectArea);
  if (comparisonMode && mapSecondary) {
    secondaryOverlayGroup = renderLayerOn(mapSecondary, 'shadow', secondaryPrefKey());
  }
  toggleShadowControls(true);
}

const CAPABILITY_LAYERS: Record<string, keyof PrefectureConfig['capabilities']> = {
  human_flow: 'humanFlow',
  school_district: 'education',
  corporate_density: 'corporate',
  plateau_3d: 'plateau',
  transport: 'transport',
  commercial_facilities: 'commercial',
  medical_facilities: 'medical',
  shadow: 'plateau',
};

function isLayerAvailable(layer: string): boolean {
  const capKey = CAPABILITY_LAYERS[layer];
  if (!capKey) return true;
  return pref().capabilities[capKey];
}

function renderCurrentLayer() { switchLayer(currentLayer); }

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
    case 'transport': renderTransportLayer(); break;
    case 'commercial_facilities': renderCommercialFacilitiesLayer(); break;
    case 'medical_facilities': renderMedicalFacilitiesLayer(); break;
    case 'shadow': renderShadowLayer(); break;
  }
  if (layer !== 'shadow') toggleShadowControls(false);
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

const LAYER_LABELS: Record<string, string> = {
  land_price: '地価',
  flood_risk: '災害',
  transaction: '取引',
  population: '人口',
  human_flow: '人流',
  school_district: '学区',
  corporate_density: '企業',
  plateau_3d: '3D建物',
  transport: '🚉交通',
  commercial_facilities: '🏬商業',
  medical_facilities: '🏥医療',
  shadow: '🌑影',
};

function renderLayerControl() {
  const existing = document.querySelector('.layer-control');
  if (existing) existing.remove();

  const ctrl = document.createElement('div');
  ctrl.className = 'layer-control';

  // Build buttons in mode-specific order
  const orderedLayers = getLayerOrderForMode(currentDashboardMode);
  const buttonsHtml = orderedLayers.map(layer => {
    const label = LAYER_LABELS[layer] ?? layer;
    const primary = isLayerPrimaryForMode(layer, currentDashboardMode) ? ' layer-btn-primary' : '';
    return `<button class="layer-btn${primary}" data-layer="${layer}">${label}</button>`;
  }).join('');

  ctrl.innerHTML = buttonsHtml;
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

  const landPriceLegend = `<div class="legend-title">地価（万円/㎡） — ${pref().displayName}</div>` +
    pref().priceBuckets
      .map(b => `<div class="legend-item"><div class="legend-color" style="background:${b.color}"></div> ${b.label}</div>`)
      .join('');

  const legendMap: Record<string, string> = {
    land_price: landPriceLegend,
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
    transport: `<div class="legend-title">交通インフラ</div>
      <div class="legend-item"><div class="legend-color" style="background:#14b8a6"></div> 高乗降客数</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(20,184,166,0.3)"></div> 低乗降客数</div>`,
    commercial_facilities: `<div class="legend-title">商業施設</div>
      <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div> 大規模商業</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(245,158,11,0.3)"></div> 小規模商業</div>`,
    medical_facilities: `<div class="legend-title">医療施設</div>
      <div class="legend-item"><div class="legend-color" style="background:#ec4899"></div> 高密度医療</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(236,72,153,0.3)"></div> 低密度医療</div>`,
    shadow: `<div class="legend-title">影シミュレーション</div>
      <div class="legend-item"><div class="legend-color" style="background:#8b5cf6"></div> 建物位置</div>
      <div class="legend-item"><div class="legend-color" style="background:rgba(0,0,0,0.5)"></div> 影の範囲</div>
      <div class="legend-item" style="font-size:10px;color:var(--text-muted);margin-top:4px">※2Dヒューリスティック近似</div>`,
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

  // inject drill-down panel below the insight panel
  const existingDd = document.getElementById('drilldown-panel');
  if (existingDd) existingDd.remove();
  const panel = document.getElementById('insight-panel');
  if (panel && name) {
    const ddDiv = document.createElement('div');
    ddDiv.innerHTML = buildDrillDownPanel(name);
    panel.appendChild(ddDiv.firstElementChild as HTMLElement);
    attachDrillDownEvents();
  }
}

// ── SVG Radar Chart (5 axes: 価格/安全/人流/教育/企業) ──

function buildRadarSVG(
  datasets: { label: string; color: string; values: number[] }[],
  axes: string[],
  size = 220,
): string {
  const cx = size / 2, cy = size / 2, r = (size / 2) * 0.72;
  const n = axes.length;
  const PI2 = Math.PI * 2;
  const startAngle = -Math.PI / 2;

  const getXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const axisLines = axes.map((label, i) => {
    const angle = startAngle + (PI2 / n) * i;
    const { x: x2, y: y2 } = getXY(angle, r);
    const labelPt = getXY(angle, r + 18);
    return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`
      + `<text x="${labelPt.x.toFixed(1)}" y="${labelPt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="rgba(255,255,255,0.7)">${label}</text>`;
  }).join('');

  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const pts = axes.map((_, i) => {
      const angle = startAngle + (PI2 / n) * i;
      const { x, y } = getXY(angle, r * ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
  }).join('');

  const polygons = datasets.map((ds) => {
    const pts = ds.values.map((v, i) => {
      const angle = startAngle + (PI2 / n) * i;
      const { x, y } = getXY(angle, r * Math.min(1, Math.max(0, v / 100)));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${ds.color}" fill-opacity="0.18" stroke="${ds.color}" stroke-width="2"/>`;
  }).join('');

  const legendItems = datasets.map((ds, i) =>
    `<rect x="${8 + i * 90}" y="${size - 18}" width="10" height="10" fill="${ds.color}" rx="2"/>`
    + `<text x="${22 + i * 90}" y="${size - 9}" font-size="9" fill="rgba(255,255,255,0.8)">${ds.label}</text>`,
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:0 auto">`
    + gridLines + axisLines + polygons + legendItems + `</svg>`;
}

// ── Comparison Panel ──

interface ComparisonData {
  prefA: string;
  prefB: string;
  dataA: PrefectureConfig;
  dataB: PrefectureConfig;
}

function buildComparisonPanel(): string {
  const prefA = currentPrefecture;
  const prefB = secondaryPrefKey();
  const cfgA = pref(prefA);
  const cfgB = pref(prefB);

  const getAvgPrice = (cfg: PrefectureConfig) => {
    const prices = Object.values(cfg.landPrices);
    if (prices.length === 0) return null;
    return prices.reduce((s, p) => s + p.price, 0) / prices.length;
  };
  const getAvgChange = (cfg: PrefectureConfig) => {
    const prices = Object.values(cfg.landPrices);
    if (prices.length === 0) return null;
    return prices.reduce((s, p) => s + p.change, 0) / prices.length;
  };
  const getAvgRisk = (cfg: PrefectureConfig) => {
    const risks = Object.values(cfg.risk);
    if (risks.length === 0) return null;
    return risks.reduce((s, r) => s + r.overall, 0) / risks.length;
  };
  const getAvgHumanFlow = (cfg: PrefectureConfig) => {
    const flows = Object.values(cfg.humanFlow);
    if (flows.length === 0) return null;
    return flows.reduce((s, f) => s + f.weekday, 0) / flows.length;
  };
  const getAvgEdu = (cfg: PrefectureConfig) => {
    const schools = Object.values(cfg.school);
    if (schools.length === 0) return null;
    return schools.reduce((s, sc) => s + sc.score, 0) / schools.length;
  };
  const getAvgCorp = (cfg: PrefectureConfig) => {
    const corps = Object.values(cfg.corporate);
    if (corps.length === 0) return null;
    return corps.reduce((s, c) => s + c.establishments, 0) / corps.length;
  };
  const getAvgTransport = (cfg: PrefectureConfig) => {
    const entries = Object.values(cfg.transport);
    if (entries.length === 0) return null;
    return entries.reduce((s, t) => s + t.dailyPassengers, 0) / entries.length;
  };
  const getAvgCommercial = (cfg: PrefectureConfig) => {
    const entries = Object.values(cfg.commercial);
    if (entries.length === 0) return null;
    return entries.reduce((s, c) => s + c.totalGfa, 0) / entries.length;
  };
  const getAvgMedical = (cfg: PrefectureConfig) => {
    const entries = Object.values(cfg.medical);
    if (entries.length === 0) return null;
    return entries.reduce((s, m) => s + m.facilities, 0) / entries.length;
  };

  const priceA = getAvgPrice(cfgA), priceB = getAvgPrice(cfgB);
  const changeA = getAvgChange(cfgA), changeB = getAvgChange(cfgB);
  const riskA = getAvgRisk(cfgA), riskB = getAvgRisk(cfgB);
  const flowA = getAvgHumanFlow(cfgA), flowB = getAvgHumanFlow(cfgB);
  const eduA = getAvgEdu(cfgA), eduB = getAvgEdu(cfgB);
  const corpA = getAvgCorp(cfgA), corpB = getAvgCorp(cfgB);
  const transA = getAvgTransport(cfgA), transB = getAvgTransport(cfgB);
  const comA = getAvgCommercial(cfgA), comB = getAvgCommercial(cfgB);
  const medA = getAvgMedical(cfgA), medB = getAvgMedical(cfgB);

  const norm2 = (a: number | null, b: number | null, invert = false) => {
    if (a == null || b == null) return [50, 50];
    const max = Math.max(Math.abs(a), Math.abs(b), 1);
    const na = Math.round((a / max) * 100);
    const nb = Math.round((b / max) * 100);
    return invert ? [100 - na, 100 - nb] : [na, nb];
  };

  const [priceNA, priceNB] = norm2(priceA, priceB, true);
  const [riskNA, riskNB] = norm2(riskA, riskB, true);
  const [flowNA, flowNB] = norm2(flowA, flowB);
  const [eduNA, eduNB] = norm2(eduA, eduB);
  const [corpNA, corpNB] = norm2(corpA, corpB);
  const [transNA, transNB] = norm2(transA, transB);
  const [comNA, comNB] = norm2(comA, comB);
  const [medNA, medNB] = norm2(medA, medB);

  // Reorder axes based on current dashboard mode
  const allAxes   = ['価格手頃', '安全', '人流', '教育', '企業', '交通', '商業', '医療'];
  const allValsA  = [priceNA, riskNA, flowNA, eduNA, corpNA, transNA, comNA, medNA];
  const allValsB  = [priceNB, riskNB, flowNB, eduNB, corpNB, transNB, comNB, medNB];

  // Store mode: prioritise 人流, 交通, 商業, 医療 (indices 2,5,6,7) then rest
  const storeOrder  = [2, 5, 6, 7, 0, 1, 3, 4];
  // Investment mode: keep original order
  const investOrder = [0, 1, 2, 4, 3, 5, 6, 7];
  const axisOrder   = currentDashboardMode === 'store' ? storeOrder : investOrder;

  const radarAxes   = axisOrder.map(i => allAxes[i]);
  const radarValuesA = axisOrder.map(i => allValsA[i]);
  const radarValuesB = axisOrder.map(i => allValsB[i]);

  const radar = buildRadarSVG(
    [
      { label: cfgA.displayName, color: '#4f8cff', values: radarValuesA },
      { label: cfgB.displayName, color: '#ff6b35', values: radarValuesB },
    ],
    radarAxes,
    240,
  );

  const scoreA = Math.round(radarValuesA.reduce((s, v) => s + v, 0) / radarValuesA.length);
  const scoreB = Math.round(radarValuesB.reduce((s, v) => s + v, 0) / radarValuesB.length);

  const fmtPrice = (v: number | null) => v ? `${(v / 10000).toFixed(0)}万円/㎡` : '-';
  const fmtChange = (v: number | null) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '-';
  const fmtRisk = (v: number | null) => v != null ? `${v.toFixed(0)}/100` : '-';

  const rows = [
    { label: '投資スコア', va: `${scoreA}/100`, vb: `${scoreB}/100` },
    { label: '平均地価', va: fmtPrice(priceA), vb: fmtPrice(priceB) },
    { label: '価格変化率', va: fmtChange(changeA), vb: fmtChange(changeB) },
    { label: 'リスクスコア', va: fmtRisk(riskA), vb: fmtRisk(riskB) },
    { label: '人流データ', va: cfgA.capabilities.humanFlow ? '対応' : '未対応', vb: cfgB.capabilities.humanFlow ? '対応' : '未対応' },
    { label: '教育データ', va: cfgA.capabilities.education ? '対応' : '未対応', vb: cfgB.capabilities.education ? '対応' : '未対応' },
  ];

  return `
    <div class="comparison-section">
      <div class="comparison-header">
        <span class="pref-badge pref-a">${cfgA.displayName}</span>
        <span class="vs-label">vs</span>
        <span class="pref-badge pref-b">${cfgB.displayName}</span>
      </div>
      ${radar}
      <div class="ranking-table-wrapper">
        <table class="ranking-table">
          <thead><tr><th>指標</th><th class="pref-a-col">${cfgA.displayName}</th><th class="pref-b-col">${cfgB.displayName}</th></tr></thead>
          <tbody>
            ${rows.map((r) => {
              const win = r.label === '投資スコア' ? (scoreA >= scoreB ? 'a' : 'b') : null;
              return `<tr>
                <td>${r.label}</td>
                <td class="${win === 'a' ? 'highlight-best' : ''}">${r.va}</td>
                <td class="${win === 'b' ? 'highlight-best' : ''}">${r.vb}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="bestfor-row">
        <div class="bestfor-item"><span class="bestfor-label">投資</span><span class="bestfor-val">${scoreA >= scoreB ? cfgA.displayName : cfgB.displayName}</span></div>
        <div class="bestfor-item"><span class="bestfor-label">安全</span><span class="bestfor-val">${(riskA ?? 100) <= (riskB ?? 100) ? cfgA.displayName : cfgB.displayName}</span></div>
        <div class="bestfor-item"><span class="bestfor-label">成長</span><span class="bestfor-val">${(changeA ?? -999) >= (changeB ?? -999) ? cfgA.displayName : cfgB.displayName}</span></div>
      </div>
    </div>`;
}

// ── Drill-down panel (city click) ──

function buildDrillDownPanel(area: string): string {
  const config = pref();
  const price = config.landPrices[area];
  const risk = config.risk[area];
  const flow = config.humanFlow[area];
  const school = config.school[area];
  const corp = config.corporate[area];
  const trans = config.transport[area];
  const com = config.commercial[area];
  const med = config.medical[area];

  const riskBadge = risk
    ? `<span style="color:${riskToColor(risk.overall)}">${risk.overall}/100</span>`
    : '-';
  const floodBadge = risk ? `<span style="color:${riskToColor(risk.flood)}">${risk.flood}/100</span>` : '-';

  const isStoreMode = currentDashboardMode === 'store';

  // Store evaluation block — shown at TOP in store mode, bottom in investment mode
  const storeEvalHtml = `
    <div class="store-eval-row${isStoreMode ? ' store-eval-prominent' : ''}" id="store-eval-block">
      <div class="store-eval-header${isStoreMode ? ' store-eval-header-active' : ''}">
        🏪 店舗出店評価
        ${isStoreMode ? '<span class="store-mode-badge">店舗モード優先</span>' : ''}
      </div>
      <label style="font-size:12px;color:var(--text-muted)">業態を選択して出店適性を確認</label>
      <select id="store-eval-select" class="neighborhood-input" style="margin-top:4px">
        <option value="">-- 業態を選択 --</option>
        <option value="convenience">コンビニ</option>
        <option value="family_restaurant">ファミレス</option>
        <option value="cafe">カフェ</option>
        <option value="drugstore">ドラッグストア</option>
        <option value="supermarket">スーパーマーケット</option>
      </select>
      ${isStoreMode && (flow || trans || com) ? `
      <div class="store-quick-scores" style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:11px">
        ${flow ? `<div class="store-score-chip" title="人流スコア">👥 ${Math.min(100, Math.round(flow.weekday / 1000))}</div>` : ''}
        ${trans ? `<div class="store-score-chip" title="交通スコア">🚉 ${Math.min(100, Math.round(trans.dailyPassengers / 10000))}</div>` : ''}
        ${com ? `<div class="store-score-chip" title="商業集積">🏬 ${Math.min(100, com.facilities * 2)}</div>` : ''}
      </div>` : ''}
      <div id="store-eval-result" class="neighborhood-note" style="margin-top:6px"></div>
    </div>`;

  // Investment data table
  const investDataHtml = `
      <table class="drilldown-table">
        <tr><th colspan="2">価格</th></tr>
        <tr><td>平均地価</td><td>${price ? `${(price.price / 10000).toFixed(1)} 万円/㎡` : '-'}</td></tr>
        <tr><td>変化率</td><td>${price ? `${price.change >= 0 ? '+' : ''}${price.change}%` : '-'}</td></tr>
        <tr><th colspan="2">災害リスク</th></tr>
        <tr><td>総合</td><td>${riskBadge}</td></tr>
        <tr><td>浸水</td><td>${floodBadge}</td></tr>
        <tr><td>震度</td><td>${risk?.earthquake ?? '-'}</td></tr>
        ${flow ? `<tr><th colspan="2">人流</th></tr>
        <tr><td>平日</td><td>${flow.weekday.toLocaleString()} 人/日</td></tr>
        <tr><td>休日</td><td>${flow.weekend.toLocaleString()} 人/日</td></tr>` : ''}
        ${trans ? `<tr><th colspan="2">交通</th></tr>
        <tr><td>駅数</td><td>${trans.stations}</td></tr>
        <tr><td>日乗降客数</td><td>${trans.dailyPassengers.toLocaleString()}人</td></tr>
        <tr><td>路線</td><td style="font-size:10px">${trans.lines.join('、')}</td></tr>` : ''}
        ${com ? `<tr><th colspan="2">商業施設</th></tr>
        <tr><td>施設数</td><td>${com.facilities}</td></tr>
        <tr><td>大型モール</td><td>${com.malls}</td></tr>
        <tr><td>コンビニ</td><td>${com.cvs}</td></tr>` : ''}
        ${med ? `<tr><th colspan="2">医療</th></tr>
        <tr><td>施設数</td><td>${med.facilities}</td></tr>
        <tr><td>病院</td><td>${med.hospitals}</td></tr>
        <tr><td>病床数</td><td>${med.beds.toLocaleString()}</td></tr>` : ''}
        ${school ? `<tr><th colspan="2">教育</th></tr>
        <tr><td>教育スコア</td><td>${school.score}/100</td></tr>
        <tr><td>進学率</td><td>${school.advancement}%</td></tr>` : ''}
        ${corp ? `<tr><th colspan="2">企業立地</th></tr>
        <tr><td>事業所数</td><td>${corp.establishments.toLocaleString()}</td></tr>
        <tr><td>大企業</td><td>${corp.major}社</td></tr>` : ''}
      </table>`;

  return `
    <div class="drilldown-panel${isStoreMode ? ' drilldown-panel-store' : ''}" id="drilldown-panel">
      <div class="drilldown-header">
        <strong>${config.displayName} / ${area}</strong>
        <span class="drilldown-mode-tag">${isStoreMode ? '🏪 店舗モード' : '🏢 投資モード'}</span>
        <button class="drilldown-close" id="drilldown-close">✕</button>
      </div>
      ${isStoreMode ? storeEvalHtml : ''}
      ${investDataHtml}
      <div class="neighborhood-input-row">
        <label>町丁目で絞り込み</label>
        <input type="text" id="neighborhood-input" placeholder="例: 名駅南1丁目" class="neighborhood-input"/>
        <div id="neighborhood-note" class="neighborhood-note"></div>
      </div>
      ${!isStoreMode ? storeEvalHtml : ''}
    </div>`;
}

function attachDrillDownEvents() {
  document.getElementById('drilldown-close')?.addEventListener('click', () => {
    document.getElementById('drilldown-panel')?.remove();
  });
  const nbInput = document.getElementById('neighborhood-input') as HTMLInputElement | null;
  const nbNote = document.getElementById('neighborhood-note');
  nbInput?.addEventListener('input', () => {
    const val = nbInput.value.trim();
    if (nbNote) {
      nbNote.textContent = val
        ? `「${val}」の詳細データはv2.2以降対応予定。現在は市区町村レベル集計を表示中。`
        : '';
    }
  });
  const storeSelect = document.getElementById('store-eval-select') as HTMLSelectElement | null;
  const storeResult = document.getElementById('store-eval-result');
  storeSelect?.addEventListener('change', () => {
    const storeType = storeSelect.value;
    if (storeResult) {
      storeResult.textContent = storeType
        ? `店舗評価はツール側で実行してください。storeType: ${storeType}`
        : '';
    }
  });
}

function updateInsightPanel(area: string) {
  const panel = document.getElementById('insight-panel')!;
  const config = pref();
  const price = config.landPrices[area];
  const risk = config.risk[area];
  const flow = config.humanFlow[area];
  const school = config.school[area];
  const corp = config.corporate[area];
  const trans = config.transport[area];
  const com = config.commercial[area];
  const med = config.medical[area];

  const investmentScore = price
    ? Math.round(Math.max(0, Math.min(100,
        (price.change + 10) * 2 + (100 - (risk?.overall ?? 30)) * 0.3 + 15)))
    : 50;

  const storeScore = flow && trans && com
    ? Math.round(Math.max(0, Math.min(100,
        (flow.weekday / 2000) * 0.4 + (trans.dailyPassengers / 50000) * 0.3 + (com.facilities * 2) * 0.3)))
    : flow
      ? Math.round(Math.min(100, flow.weekday / 1000))
      : 50;

  const displayScore = currentDashboardMode === 'store' ? storeScore : investmentScore;
  const scoreLabel   = currentDashboardMode === 'store' ? '出店適性スコア' : '投資スコア';

  const scoreClass = displayScore >= 70 ? 'high' : displayScore >= 40 ? 'medium' : 'low';
  const riskClass = (risk?.overall ?? 0) >= 60 ? 'high' : (risk?.overall ?? 0) >= 30 ? 'medium' : 'low';

  let comparisonHtml = '';
  if (comparisonMode) {
    comparisonHtml = `
    <div class="panel-section comparison-panel-section">
      <h3>都道府県比較</h3>
      ${buildComparisonPanel()}
    </div>`;
  }

  panel.innerHTML = `
    <div class="panel-section">
      <h3>${area || 'エリアを選択'}</h3>
      <div style="font-size:11px;color:var(--text-muted)">${config.displayName}</div>
    </div>

    <div class="score-card">
      <div class="score-value ${scoreClass}">${displayScore}</div>
      <div class="score-label">${scoreLabel}</div>
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

    ${trans ? `
    <div class="panel-section">
      <h3>交通</h3>
      <div style="font-size:12px;margin:4px 0">駅数: ${trans.stations} / 日乗降客数: ${trans.dailyPassengers.toLocaleString()}人</div>
      <div style="font-size:11px;margin:4px 0;color:var(--text-muted)">${trans.lines.join('、')}</div>
    </div>
    ` : ''}

    ${com ? `
    <div class="panel-section">
      <h3>商業施設</h3>
      <div style="font-size:12px;margin:4px 0">施設: ${com.facilities} / モール: ${com.malls} / コンビニ: ${com.cvs}</div>
    </div>
    ` : ''}

    ${med ? `
    <div class="panel-section">
      <h3>医療</h3>
      <div style="font-size:12px;margin:4px 0">施設: ${med.facilities} / 病院: ${med.hospitals} / 病床: ${med.beds.toLocaleString()}</div>
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
    if (comparisonMode) {
      enableComparisonLayout();
      renderCurrentLayer();
    } else {
      disableComparisonLayout();
    }
    updateInsightPanel(selectedArea);
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
  renderModeToggle();
  renderModeBanner();
  updateInsightPanel('');

  // Respect ?mode= URL parameter for initialMode
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  if (urlMode === 'store' || urlMode === 'investment') {
    applyMode(urlMode);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
