import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * ツール結果(content/structuredContent)をダッシュボードが消費しやすい単一オブジェクトに正規化する。
 * Normalizes a tool result (content/structuredContent) into a single object the dashboard can consume.
 * Menormalkan hasil tool (content/structuredContent) menjadi satu objek yang mudah dikonsumsi dashboard.
 */
export function mergeToolResult(result: CallToolResult | undefined | null): Record<string, unknown> | null {
  if (!result) return null;
  const structured = result.structuredContent;
  const content = result.content;
  let textPart: string | null = null;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === 'object' && 'type' in block && block.type === 'text' && 'text' in block) {
        textPart = (block as { text: string }).text;
        break;
      }
    }
  }

  const merged: Record<string, unknown> = {};
  if (textPart) {
    try {
      const parsed: unknown = JSON.parse(textPart);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(merged, parsed as Record<string, unknown>);
      }
    } catch {
      // Not JSON — fall through to structuredContent / rawText below.
    }
  }
  if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
    Object.assign(merged, structured as Record<string, unknown>);
  }
  if (textPart && Object.keys(merged).length === 0) {
    merged.rawText = textPart;
  }
  return Object.keys(merged).length > 0 ? merged : null;
}
