/**
 * Runtime search engine for the ChatGPT-compatible `search` tool.
 *
 * Uses a lightweight keyword-based scoring approach that works well
 * for domain-specific Japanese text without external ML dependencies.
 * Scoring: exact substring match > partial keyword match > token overlap.
 */

import { buildCatalog, type CatalogEntry } from './catalog.js';

let catalog: CatalogEntry[] | null = null;

function ensureCatalog(): CatalogEntry[] {
  if (!catalog) {
    catalog = buildCatalog();
  }
  return catalog;
}

/** Split Japanese + ASCII text into scoring tokens. */
function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];

  const asciiWords = lower.match(/[a-z0-9_]+/g);
  if (asciiWords) tokens.push(...asciiWords);

  // CJK characters: extract individual chars and 2-grams
  const cjk = lower.replace(/[a-z0-9_\s\p{P}]/gu, '');
  for (const ch of cjk) tokens.push(ch);
  for (let i = 0; i < cjk.length - 1; i++) tokens.push(cjk.slice(i, i + 2));

  return tokens;
}

function scoreEntry(entry: CatalogEntry, queryTokens: string[], rawQuery: string): number {
  const lower = rawQuery.toLowerCase();
  let score = 0;

  // Exact substring in title (strong signal)
  if (entry.title.toLowerCase().includes(lower)) score += 100;
  if (entry.description.toLowerCase().includes(lower)) score += 50;

  // Per-keyword matching
  for (const kw of entry.keywords) {
    const kwLower = kw.toLowerCase();
    if (lower.includes(kwLower) || kwLower.includes(lower)) score += 30;
    if (lower === kwLower) score += 40;
  }

  // Token overlap scoring
  const entryText = `${entry.title} ${entry.description} ${entry.keywords.join(' ')}`.toLowerCase();
  const entryTokens = new Set(tokenize(entryText));
  for (const qt of queryTokens) {
    if (entryTokens.has(qt)) score += 5;
    if (entryText.includes(qt)) score += 3;
  }

  return score;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
}

export function searchCatalog(query: string, topK = 10): SearchResult[] {
  const entries = ensureCatalog();
  const queryTokens = tokenize(query);

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, queryTokens, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ entry }) => ({
    id: entry.id,
    title: entry.title,
    url: entry.url,
  }));
}

/** Force-reload the catalog (useful after hot data changes in tests). */
export function resetCatalog(): void {
  catalog = null;
}

/** Expose catalog size for testing / health checks. */
export function catalogSize(): number {
  return ensureCatalog().length;
}
