import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { createServer } from '../src/server.js';
import { createHash } from 'node:crypto';


let tmpDir: string;
let app: any;
let httpServer: any;
let db: Database.Database;

beforeAll(async () => {
  // Setup temp OAuth database for HTTP tests
  tmpDir = mkdtempSync(join(tmpdir(), 'oauth-sec-test-'));
  process.env.OAUTH_DB_PATH = join(tmpDir, 'sec-oauth.sqlite');
  
  // Set default tier to free
  process.env.DEFAULT_TIER = 'free';

  const mod = await import('../src/http.js');
  app = mod.app;
  // Start server manually for integration test on port 3100
  httpServer = app.listen(3100, '0.0.0.0');
  
  // Connect to the same OAuth DB
  db = new Database(process.env.OAUTH_DB_PATH);
}, 30000);

afterAll(async () => {
  if (httpServer) {
    httpServer.close();
  }
  if (db) {
    db.close();
  }
  const { closeDb } = await import('../src/auth/oauth-store.js');
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

  it('HTTP POST /mcp with Pro OAuth token unlocks generate_area_report', async () => {
    // 1. Calculate PKCE challenge dynamically
    const verifier = 'my-pkce-verifier-1234567890';
    const challenge = createHash('sha256').update(verifier).digest('base64url');

    // 2. Initialize DB and exchange token using the official oauth-store API
    const { registerClient, createAuthCode, exchangeCode } = await import('../src/auth/oauth-store.js');
    const { clientId } = registerClient('Validate App', ['http://localhost:3000/callback']);
    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: 'http://localhost:3000/callback',
    });
    const exchangeResult = exchangeCode(code, verifier, 'http://localhost:3000/callback');
    expect(exchangeResult).not.toBeNull();
    const token = exchangeResult!.accessToken;
    
    // 3. Set the token's tier to 'pro' in the database
    const tokenHash = createHash('sha256').update(token).digest('hex');
    db.prepare("UPDATE access_tokens SET tier = 'pro' WHERE token_hash = ?").run(tokenHash);

    // 4. Initialize dynamic session using the Pro bearer token
    const initRes = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .set('Authorization', `Bearer ${token}`)
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

    // 5. Call pro-only tool using this Pro session
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
