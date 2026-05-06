import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedHtml: string | null = null;

export function getDashboardHtml(): string {
  if (cachedHtml) return cachedHtml;
  try {
    const htmlPath = resolve(__dirname, '..', '..', 'ui', 'dashboard.html');
    cachedHtml = readFileSync(htmlPath, 'utf-8');
    return cachedHtml;
  } catch {
    return '<html><body><h1>Dashboard not built. Run: pnpm build:ui</h1></body></html>';
  }
}
