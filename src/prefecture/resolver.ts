const PREFECTURE_KEYS: Record<string, string> = {
  愛知県: 'aichi',
  愛知: 'aichi',
  aichi: 'aichi',
  'JP-23': 'aichi',
  東京都: 'tokyo',
  東京: 'tokyo',
  tokyo: 'tokyo',
  'JP-13': 'tokyo',
  大阪府: 'osaka',
  大阪: 'osaka',
  osaka: 'osaka',
  'JP-27': 'osaka',
  福岡県: 'fukuoka',
  福岡: 'fukuoka',
  fukuoka: 'fukuoka',
  'JP-40': 'fukuoka',
  北海道: 'hokkaido',
  hokkaido: 'hokkaido',
  'JP-01': 'hokkaido',
  神奈川県: 'kanagawa',
  神奈川: 'kanagawa',
  kanagawa: 'kanagawa',
  'JP-14': 'kanagawa',
  京都府: 'kyoto',
  京都: 'kyoto',
  kyoto: 'kyoto',
  'JP-26': 'kyoto',
  兵庫県: 'hyogo',
  兵庫: 'hyogo',
  hyogo: 'hyogo',
  'JP-28': 'hyogo',
  埼玉県: 'saitama',
  埼玉: 'saitama',
  saitama: 'saitama',
  'JP-11': 'saitama',
  千葉県: 'chiba',
  千葉: 'chiba',
  chiba: 'chiba',
  'JP-12': 'chiba',
};

const DISPLAY_NAMES: Record<string, string> = {
  aichi: '愛知県',
  tokyo: '東京都',
  osaka: '大阪府',
  fukuoka: '福岡県',
  hokkaido: '北海道',
  kanagawa: '神奈川県',
  kyoto: '京都府',
  hyogo: '兵庫県',
  saitama: '埼玉県',
  chiba: '千葉県',
};

const DEFAULT_PREFECTURE = 'aichi';

export function resolvePrefecture(input: string | undefined | null): string {
  if (input == null) return DEFAULT_PREFECTURE;
  const trimmed = input.trim();
  if (trimmed === '') return DEFAULT_PREFECTURE;
  const normalized = trimmed.toLowerCase();
  if (PREFECTURE_KEYS[trimmed]) return PREFECTURE_KEYS[trimmed];
  if (PREFECTURE_KEYS[normalized]) return PREFECTURE_KEYS[normalized];
  for (const [key, value] of Object.entries(PREFECTURE_KEYS)) {
    if (key.toLowerCase() === normalized) return value;
  }
  return normalized;
}

export function getPrefectureDisplayName(key: string): string {
  return DISPLAY_NAMES[key] ?? key;
}

export function isKnownPrefecture(key: string): boolean {
  return key in DISPLAY_NAMES;
}
