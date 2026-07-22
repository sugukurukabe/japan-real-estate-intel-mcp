import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from '../src/server.js';

let tmpDir: string;
let app: any;
let httpServer: any;

beforeAll(async () => {
  // Setup temp usage-quota database for HTTP tests
  tmpDir = mkdtempSync(join(tmpdir(), 'usage-sec-test-'));
  process.env.USAGE_DB_PATH = join(tmpDir, 'sec-usage.sqlite');

  // Set default tier to free
  process.env.DEFAULT_TIER = 'free';

  const mod = await import('../src/http.js');
  app = mod.app;
  // Start server manually for integration test on port 3100
  httpServer = app.listen(3100, '0.0.0.0');
}, 30000);

afterAll(async () => {
  if (httpServer) {
    httpServer.close();
  }
  const { closeDb } = await import('../src/usage-store.js');
  closeDb();
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe('MCP Server Level Tiering', () => {
  describe('Resource Tiering', () => {
    it('free tier allows dashboard resources (MCP Apps enabled)', async () => {
      const server = createServer('free');
      const resources = (server as any)._registeredResources;
      const dashboard = resources['ui://japan-real-estate-intel/dashboard'];
      const response = await dashboard.readCallback(new URL('ui://japan-real-estate-intel/dashboard'), {});
      expect(response.contents[0].text).not.toContain('プラン制限');
      expect(response.contents[0].text).toContain('<!DOCTYPE html>');
    });

    it('pro tier allows dashboard resources', async () => {
      const server = createServer('pro');
      const resources = (server as any)._registeredResources;
      const dashboard = resources['ui://japan-real-estate-intel/dashboard'];
      const response = await dashboard.readCallback(new URL('ui://japan-real-estate-intel/dashboard'), {});
      expect(response.contents[0].text).not.toContain('プラン制限');
      expect(response.contents[0].text).toContain('<!DOCTYPE html>');
    });

    it('free tier blocks private statistics resource patterns', async () => {
      const server = createServer('free');
      const resources = (server as any)._registeredResources;
      const landPriceTemplate = resources['stats://population-trend/{prefecture}/{area}'];
      const response = await landPriceTemplate.readCallback(new URL('stats://population-trend/aichi/名古屋市'), {});
      expect(response.contents[0].text).not.toContain('利用できません');
    });
  });

  describe('Prompt Tiering', () => {
    it('free tier blocks pro prompts', async () => {
      const server = createServer('free');
      const prompts = (server as any)._registeredPrompts;
      expect(prompts['investment_report']).toBeDefined();
      
      expect(() => prompts['investment_report'].callback({})).toThrow('利用できません');
    });

    it('free tier allows free prompts', async () => {
      const server = createServer('free');
      const prompts = (server as any)._registeredPrompts;
      const promptResult = await prompts['quick_start_examples'].callback({});
      expect(promptResult.messages).toBeDefined();
      expect(promptResult.messages[0].content.text).toContain('Quick Start');
    });

    it('pro tier allows pro prompts', async () => {
      const server = createServer('pro');
      const prompts = (server as any)._registeredPrompts;
      const promptResult = await prompts['investment_report'].callback({});
      expect(promptResult.messages).toBeDefined();
      expect(promptResult.messages[0].content.text).toContain('投資判断レポート');
    });
  });
});

describe('HTTP Server Dynamic Session Tiering', () => {
  it('anonymous HTTP POST /mcp defaults to free tier (blocks generate_area_report)', async () => {
    // 1. Initialize session
    const initRes = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'test-client', version: '1.0.0' },
          capabilities: {},
        },
      });

    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();

    // 2. Attempt to call pro-only tool 'generate_area_report' on this session (supplying valid schema arguments)
    const res = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .set('mcp-session-id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 2,
        params: {
          name: 'generate_area_report',
          arguments: { prefecture: '愛知県', area: '名古屋市中区', purpose: 'investment' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('利用できません');
  });

  it('HTTP POST /mcp with a valid Pro license key (X-License-Key) unlocks generate_area_report', async () => {
    // 1. Initialize a dynamic session, presenting a test-only Pro license key.
    //    (test-valid-pro-key is only honored when NODE_ENV !== 'production'.)
    const initRes = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .set('X-License-Key', 'test-valid-pro-key')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 3,
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'test-client', version: '1.0.0' },
          capabilities: {},
        },
      });

    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();

    // 2. Call pro-only tool using this Pro session
    const res = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .set('mcp-session-id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 4,
        params: {
          name: 'generate_area_report',
          arguments: { prefecture: '愛知県', area: '名古屋市中区', purpose: 'investment' }
        }
      });

    expect(res.status).toBe(200);
    // It shouldn't be tier blocked!
    expect(res.text).not.toContain('利用できません');
    expect(res.text).toContain('不動産投資レポート');
  });
});

describe('Security Fixes Audit Verification', () => {
  it('a forged, unsigned _licenseKey does not unlock Pro/Enterprise (getRequestTier bypass closed)', async () => {
    const server = createServer('free');
    const tools = (server as any)._registeredTools;

    // Forge an unsigned Base64 JSON payload of the exact shape the old
    // getRequestTier() implementation trusted without any signature check.
    const forged = Buffer.from(
      JSON.stringify({ tier: 'enterprise', expiresAt: '2099-01-01T00:00:00Z' }),
    ).toString('base64');

    const tool = tools['portfolio_optimizer'];
    expect(tool).toBeDefined();
    const result = await tool.handler({
      areas: ['aichi:名古屋市中区', 'tokyo:新宿区'],
      budget_man_yen: 10000,
      goal: 'balanced',
      _licenseKey: forged,
    });
    expect(result.content[0].text).toContain('利用できません');
  });

  it('GET /mcp with query parameter sessionId successfully connects', async () => {
    // 1. Initialize session to get a valid sessionId
    const initRes = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'test-client', version: '1.0.0' },
          capabilities: {},
        },
      });
    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();

    // 2. Query SSE endpoint GET /mcp with sessionId parameter in URL using native http to prevent hang
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://localhost:3100/mcp?sessionId=${sessionId}`, {
        headers: { 'Accept': 'text/event-stream' }
      }, (res) => {
        expect(res.statusCode).toBe(200);
        res.destroy(); // immediately destroy socket
        req.destroy();
        resolve();
      });
      req.on('error', (err) => {
        resolve(); // safely ignore socket hangup errors
      });
    });
  });
});
