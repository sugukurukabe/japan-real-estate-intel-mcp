const PREFECTURE_KEYS: Record<string, string> = {
  '愛知県': 'aichi', '愛知': 'aichi', 'aichi': 'aichi', 'JP-23': 'aichi',
  '東京都': 'tokyo', '東京': 'tokyo', 'tokyo': 'tokyo', 'JP-13': 'tokyo',
  '大阪府': 'osaka', '大阪': 'osaka', 'osaka': 'osaka', 'JP-27': 'osaka',
  '福岡県': 'fukuoka', '福岡': 'fukuoka', 'fukuoka': 'fukuoka', 'JP-40': 'fukuoka',
  '北海道': 'hokkaido', 'hokkaido': 'hokkaido', 'JP-01': 'hokkaido',
};

const DISPLAY_NAMES: Record<string, string> = {
  aichi: '愛知県',
  tokyo: '東京都',
  osaka: '大阪府',
  fukuoka: '福岡県',
  hokkaido: '北海道',
};

export function resolvePrefecture(input: string): string {
  const normalized = input.trim().toLowerCase();
  if (PREFECTURE_KEYS[input]) return PREFECTURE_KEYS[input];
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
