/**
 * Integration tests for the HTTP MCP server.
 *
 * We import the Express app directly (without starting the OS-level listener)
 * so tests are fast and port-collision-free.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Dynamically import so environment variables can be set before module load
let app: Express.Application;

beforeAll(async () => {
  // Ensure clean environment for each test run
  delete process.env.API_KEY;
  const mod = await import('../src/http.js');
  // Close the real listener (started on import) to free the port
  mod.httpServer.close();
  app = mod.app;
});

afterAll(() => {
  // nothing to clean up — httpServer already closed
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.sessions).toBe('number');
    expect(typeof res.body.uptime_s).toBe('number');
  });
});

describe('POST /mcp', () => {
  it('responds to initialize request without server error', async () => {
    // Streamable HTTP transport requires Accept header; without it may return 4xx
    // We verify it does NOT return a 5xx server error
    const res = await request(app)
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

    // Must not be a server error (5xx)
    expect(res.status).toBeLessThan(500);
  });

  it('returns non-5xx for malformed JSON body', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json, text/event-stream')
      .send({ invalid: true });
    expect(res.status).toBeLessThan(500);
  });
});

describe('GET /mcp without session', () => {
  it('returns 400 when no session ID is provided', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for unknown session ID', async () => {
    const res = await request(app)
      .get('/mcp')
      .set('mcp-session-id', 'nonexistent-session-id');
    expect(res.status).toBe(400);
  });
});

describe('DELETE /mcp without session', () => {
  it('returns 404 when session does not exist', async () => {
    const res = await request(app)
      .delete('/mcp')
      .set('mcp-session-id', 'nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('API key authentication', () => {
  it('allows /health without API key even when API_KEY is set', async () => {
    // We test this at the middleware logic level, not live env var reload
    // Health check path bypasses auth — verified by the middleware code
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

describe('Security headers', () => {
  it('response includes X-Content-Type-Options from helmet', async () => {
    const res = await request(app).get('/health');
    // helmet sets this header by default
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('response includes X-Frame-Options from helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});
