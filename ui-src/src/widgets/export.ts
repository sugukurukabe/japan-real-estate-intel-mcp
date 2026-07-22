/**
 * ウィジェットカードのCSV/PNGエクスポート。
 *
 * Export utilities for a rendered widget card: CSV (built from the
 * declarative `WidgetConfig`'s KPI/list fields, entirely client-side from
 * data already in `structuredContent`) and PNG (rasterized card DOM node via
 * `html-to-image`, which runs locally and needs no new CSP entry).
 *
 * Utilitas ekspor untuk kartu widget: CSV (dibangun dari field KPI/list pada
 * `WidgetConfig`, sepenuhnya di sisi klien dari data `structuredContent` yang
 * sudah ada) dan PNG (merender node DOM kartu via `html-to-image`, berjalan
 * lokal tanpa entri CSP baru).
 *
 * MCP Apps run in a sandboxed iframe where a plain `<a download>` click can
 * silently fail depending on the host. The official ext-apps SDK's
 * `app.downloadFile()` is host-mediated and works across hosts; we fall back
 * to a Blob + `<a>` click only when no `app` is connected (e.g. the
 * standalone dev server) or the host explicitly rejects the request.
 */
import { toPng } from 'html-to-image';
import type { App } from '@modelcontextprotocol/ext-apps';
import { formatValue, getByPath, type WidgetConfig } from './types';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsvText(rows: string[][]): string {
  const lines = rows.map((row) => row.map(csvEscape).join(','));
  // Leading BOM so Excel opens Japanese headers as UTF-8 rather than
  // mangling them via a Shift-JIS guess.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

function widgetToCsvRows(config: WidgetConfig, data: Record<string, unknown>): string[][] {
  const rows: string[][] = [['項目', '値']];
  for (const kpi of config.kpis) {
    rows.push([kpi.label, formatValue(getByPath(data, kpi.path), kpi.format)]);
  }
  for (const list of config.lists ?? []) {
    const raw = getByPath(data, list.path);
    if (!Array.isArray(raw) || raw.length === 0) continue;
    rows.push(['', '']);
    rows.push([list.label, '']);
    raw.forEach((item, i) => {
      rows.push([`#${i + 1}`, list.itemFormatter ? list.itemFormatter(item) : String(item)]);
    });
  }
  return rows;
}

function downloadBlobFallback(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export a widget's KPI/list data as a downloadable CSV. */
export async function exportWidgetCsv(
  app: App | null | undefined,
  config: WidgetConfig,
  data: Record<string, unknown>,
): Promise<void> {
  const csvText = toCsvText(widgetToCsvRows(config, data));
  const filename = `${config.toolName}.csv`;

  if (app) {
    try {
      const { isError } = await app.downloadFile({
        contents: [
          {
            type: 'resource',
            resource: { uri: `file:///${filename}`, mimeType: 'text/csv', text: csvText },
          },
        ],
      });
      if (!isError) return;
    } catch {
      // Host doesn't support ui/download-file — fall through to the Blob path.
    }
  }
  downloadBlobFallback(new Blob([csvText], { type: 'text/csv;charset=utf-8' }), filename);
}

/** Rasterize a widget card DOM node to PNG and offer it for download. */
export async function exportWidgetPng(
  app: App | null | undefined,
  element: HTMLElement,
  toolName: string,
  backgroundColor?: string,
): Promise<void> {
  const filename = `${toolName}.png`;
  // The card node itself has no background (its parent's glassmorphism blur
  // does) — without an explicit fill, html-to-image renders a transparent
  // PNG that looks broken pasted onto a light background.
  const dataUrl = await toPng(element, { pixelRatio: 2, cacheBust: true, backgroundColor });

  if (app) {
    try {
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const { isError } = await app.downloadFile({
        contents: [
          {
            type: 'resource',
            resource: { uri: `file:///${filename}`, mimeType: 'image/png', blob: base64 },
          },
        ],
      });
      if (!isError) return;
    } catch {
      // Host doesn't support ui/download-file — fall through to the Blob path.
    }
  }
  const res = await fetch(dataUrl);
  downloadBlobFallback(await res.blob(), filename);
}
