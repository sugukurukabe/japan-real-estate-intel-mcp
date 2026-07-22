/**
 * End-to-end verification that the report/CSV/XLSX-producing tools
 * (generate_area_report, compare_prefectures, portfolio_optimizer,
 * generate_contract_support_package, assess_contract_risk) persist their
 * generated blob via src/artifacts.ts and return a `resource_link` content
 * block instead of embedding raw Base64 in `structuredContent` — the change
 * this suite exists to lock in place.
 *
 * Wires a real MCP Client to the server over an InMemoryTransport pair (as in
 * tests/output_schemas.test.ts) so `tools/call` / `resources/read` go through
 * the SDK's real dispatch path, not a direct handler call.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

let tmpDir: string;
let client: Client;

type ContentBlock = { type: string; uri?: string; mimeType?: string; text?: string };

function resourceLinks(content: unknown): ContentBlock[] {
  return (content as ContentBlock[]).filter((c) => c.type === 'resource_link');
}

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'artifact-links-test-'));
  process.env.ARTIFACT_DIR = join(tmpDir, 'artifacts');
  process.env.ARTIFACT_DB_PATH = join(tmpDir, 'artifacts.sqlite');

  // stdio transport mode (default) — resource_link must point at artifact://
  const server = createServer('enterprise');
  client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

afterAll(async () => {
  await client.close();
  const { closeDb } = await import('../src/artifacts.js');
  closeDb();
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  delete process.env.ARTIFACT_DIR;
  delete process.env.ARTIFACT_DB_PATH;
});

describe('generate_area_report', () => {
  it('format=pdf returns a PDF resource_link (artifact:// in stdio mode) and drops pdfBase64', async () => {
    const result = await client.callTool({
      name: 'generate_area_report',
      arguments: {
        prefecture: '愛知県',
        area: '名古屋市中区',
        purpose: 'investment',
        format: 'pdf',
      },
    });
    const links = resourceLinks(result.content);
    expect(links).toHaveLength(1);
    expect(links[0].uri).toMatch(/^artifact:\/\//);
    expect(links[0].mimeType).toBe('application/pdf');
    expect(result.structuredContent).not.toHaveProperty('pdfBase64');
  });

  it('format=markdown (default) returns no resource_link — no PDF was generated', async () => {
    const result = await client.callTool({
      name: 'generate_area_report',
      arguments: { prefecture: '愛知県', area: '名古屋市中区', purpose: 'investment' },
    });
    expect(resourceLinks(result.content)).toHaveLength(0);
  });
});

describe('compare_prefectures', () => {
  it('exportFormat=xlsx returns an Excel resource_link and drops xlsxBase64', async () => {
    const result = await client.callTool({
      name: 'compare_prefectures',
      arguments: { prefectures: ['愛知県', '東京都'], exportFormat: 'xlsx' },
    });
    const links = resourceLinks(result.content);
    expect(links).toHaveLength(1);
    expect(links[0].mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.structuredContent).not.toHaveProperty('xlsxBase64');
  });

  it('exportFormat=json (default) returns no resource_link', async () => {
    const result = await client.callTool({
      name: 'compare_prefectures',
      arguments: { prefectures: ['愛知県', '東京都'] },
    });
    expect(resourceLinks(result.content)).toHaveLength(0);
  });
});

describe('portfolio_optimizer', () => {
  it('always returns a CSV resource_link of the allocation table', async () => {
    const result = await client.callTool({
      name: 'portfolio_optimizer',
      arguments: {
        targets: [
          {
            prefecture: '愛知県',
            city: '名古屋市中区',
            propertyType: 'residential',
            budgetManYen: 5000,
          },
          {
            prefecture: '愛知県',
            city: '名古屋市中村区',
            propertyType: 'commercial',
            budgetManYen: 8000,
          },
        ],
      },
    });
    const links = resourceLinks(result.content);
    expect(links).toHaveLength(1);
    expect(links[0].mimeType).toBe('text/csv');
    expect(links[0].uri).toMatch(/^artifact:\/\//);
  });
});

describe('generate_contract_support_package', () => {
  it('always returns a Markdown resource_link', async () => {
    const result = await client.callTool({
      name: 'generate_contract_support_package',
      arguments: { ward: '中区', buildingAge: 25, floorArea: 60, price: 30000000 },
    });
    const links = resourceLinks(result.content);
    expect(links).toHaveLength(1);
    expect(links[0].mimeType).toBe('text/markdown');
  });
});

describe('assess_contract_risk', () => {
  it('always returns a Markdown resource_link', async () => {
    const result = await client.callTool({
      name: 'assess_contract_risk',
      arguments: { ward: '中区', proposedTerms: { financing_contingency: true } },
    });
    const links = resourceLinks(result.content);
    expect(links).toHaveLength(1);
    expect(links[0].mimeType).toBe('text/markdown');
  });
});

describe('artifact://{id} MCP resource', () => {
  it('resolves the same artifact referenced by a resource_link', async () => {
    const result = await client.callTool({
      name: 'portfolio_optimizer',
      arguments: {
        targets: [
          {
            prefecture: '愛知県',
            city: '名古屋市中区',
            propertyType: 'residential',
            budgetManYen: 5000,
          },
          {
            prefecture: '愛知県',
            city: '名古屋市中村区',
            propertyType: 'commercial',
            budgetManYen: 8000,
          },
        ],
      },
    });
    const link = resourceLinks(result.content)[0];
    expect(link).toBeDefined();
    const read = await client.readResource({ uri: link.uri! });
    expect((read.contents[0] as { text?: string }).text ?? '').toContain('都道府県');
  });

  it('returns a not-found message rather than throwing for a bogus ID', async () => {
    const read = await client.readResource({
      uri: 'artifact://00000000-0000-0000-0000-000000000000',
    });
    expect((read.contents[0] as { text?: string }).text ?? '').toContain('見つかりません');
  });
});
