/**
 * ChatGPT Apps SDK compatible `search` tool.
 *
 * Returns a list of search results from the real estate data catalog.
 * Conforms to the OpenAI MCP connector schema:
 * - Input:  { query: string }
 * - Output: { results: [{ id, title, url }] }
 * - Returns both `structuredContent` and `content` (JSON string) for compatibility.
 */

import { searchCatalog } from '../search/index.js';

export interface SearchInput {
  query: string;
}

export interface SearchOutput {
  results: Array<{ id: string; title: string; url: string }>;
}

export function mcpSearch(input: SearchInput): SearchOutput {
  const results = searchCatalog(input.query, 10);
  return { results };
}
