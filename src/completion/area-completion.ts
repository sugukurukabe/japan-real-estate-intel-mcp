import { getLoader, listAvailable } from '../data-loaders/index.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';

const MAX_SUGGESTIONS = 20;
const READING_ALIASES: Record<string, string[]> = {
  '名古屋市中村区': ['なごやしなかむらく', 'ナゴヤシナカムラク', 'nagoya nakamura'],
  '名古屋市中区': ['なごやしなかく', 'ナゴヤシナカク', 'nagoya naka'],
  '名古屋市東区': ['なごやしひがしく', 'ナゴヤシヒガシク', 'nagoya higashi'],
  '名古屋市千種区': ['なごやしちくさく', 'ナゴヤシチクサク', 'nagoya chikusa'],
  '名古屋市名東区': ['なごやしめいとうく', 'ナゴヤシメイトウク', 'nagoya meito'],
  '新宿区': ['しんじゅくく', 'シンジュクク', 'shinjuku'],
  '渋谷区': ['しぶやく', 'シブヤク', 'shibuya'],
  '世田谷区': ['せたがやく', 'セタガヤク', 'setagaya'],
  '大阪市北区': ['おおさかしきたく', 'オオサカシキタク', 'osaka kita'],
  '大阪市中央区': ['おおさかしちゅうおうく', 'オオサカシチュウオウク', 'osaka chuo'],
  '横浜市西区': ['よこはましにしく', 'ヨコハマシニシク', 'yokohama nishi'],
  '福岡市博多区': ['ふくおかしはかたく', 'フクオカシハカタク', 'fukuoka hakata'],
};

const ALL_PREFECTURE_NAMES: string[] = (() => {
  const keys = listAvailable();
  const names: string[] = [];
  for (const key of keys) {
    names.push(getPrefectureDisplayName(key));
  }
  return names.sort();
})();

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '');
}

function prefixMatch(candidates: string[], partial: string, aliases: Record<string, string[]> = {}): string[] {
  const normalized = normalize(partial);
  if (!normalized) return candidates.slice(0, MAX_SUGGESTIONS);
  return candidates
    .filter(c => {
      const candidate = normalize(c);
      if (candidate.startsWith(normalized) || candidate.includes(normalized)) return true;
      return (aliases[c] ?? []).some(alias => {
        const normalizedAlias = normalize(alias);
        return normalizedAlias.startsWith(normalized) || normalizedAlias.includes(normalized);
      });
    })
    .slice(0, MAX_SUGGESTIONS);
}

export function completePrefecture(
  value: string | undefined,
): string[] {
  const raw = value ?? '';
  const lastToken = raw.split(',').pop()?.trim() ?? raw;
  return prefixMatch(ALL_PREFECTURE_NAMES, lastToken);
}

export function completeArea(
  value: string | undefined,
  context?: { arguments?: Record<string, string> },
): string[] {
  const prefInput = context?.arguments?.prefecture;
  const prefKey = resolvePrefecture(prefInput);
  const loader = getLoader(prefKey);
  const cities = loader.getCities();
  return prefixMatch(cities, value ?? '', READING_ALIASES);
}

export function searchAreaCandidates(input: {
  prefecture?: string;
  query?: string;
  limit?: number;
}): { prefecture: string; candidates: string[] } {
  const prefKey = resolvePrefecture(input.prefecture);
  const candidates = completeArea(input.query ?? '', {
    arguments: { prefecture: input.prefecture ?? getPrefectureDisplayName(prefKey) },
  }).slice(0, input.limit ?? MAX_SUGGESTIONS);
  return {
    prefecture: getPrefectureDisplayName(prefKey),
    candidates,
  };
}
