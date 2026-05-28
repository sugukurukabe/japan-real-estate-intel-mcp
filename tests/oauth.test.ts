import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmpDir: string;
let registerClient: typeof import('../src/auth/oauth-store.js').registerClient;
let getClient: typeof import('../src/auth/oauth-store.js').getClient;
let createAuthCode: typeof import('../src/auth/oauth-store.js').createAuthCode;
let exchangeCode: typeof import('../src/auth/oauth-store.js').exchangeCode;
let refreshAccessToken: typeof import('../src/auth/oauth-store.js').refreshAccessToken;
let validateAccessToken: typeof import('../src/auth/oauth-store.js').validateAccessToken;
let cleanupExpired: typeof import('../src/auth/oauth-store.js').cleanupExpired;
let closeDb: typeof import('../src/auth/oauth-store.js').closeDb;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'oauth-test-'));
  process.env.OAUTH_DB_PATH = join(tmpDir, 'test-oauth.sqlite');
  const mod = await import('../src/auth/oauth-store.js');
  registerClient = mod.registerClient;
  getClient = mod.getClient;
  createAuthCode = mod.createAuthCode;
  exchangeCode = mod.exchangeCode;
  refreshAccessToken = mod.refreshAccessToken;
  validateAccessToken = mod.validateAccessToken;
  cleanupExpired = mod.cleanupExpired;
  closeDb = mod.closeDb;
});

afterAll(() => {
  closeDb();
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

describe('oauth-store', () => {
  const REDIRECT = 'http://localhost:3000/callback';

  it('registerClient creates a client with clientId', () => {
    const result = registerClient('Test App', [REDIRECT]);
    expect(result).toHaveProperty('clientId');
    expect(typeof result.clientId).toBe('string');
    expect(result.clientId.length).toBeGreaterThan(10);
  });

  it('getClient retrieves the registered client', () => {
    const { clientId } = registerClient('Another App', [REDIRECT, 'http://example.com/cb']);
    const client = getClient(clientId);
    expect(client).not.toBeNull();
    expect(client!.clientName).toBe('Another App');
    expect(client!.redirectUris).toContain(REDIRECT);
    expect(client!.redirectUris).toHaveLength(2);
  });

  it('getClient returns null for unknown client', () => {
    expect(getClient('nonexistent-id')).toBeNull();
  });

  it('createAuthCode returns a code string', () => {
    const { clientId } = registerClient('Code App', [REDIRECT]);
    const { challenge } = pkce();
    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      scope: 'read',
      redirectUri: REDIRECT,
    });
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(20);
  });

  it('full OAuth flow: register → auth code → exchange → access token', () => {
    const { clientId } = registerClient('Full Flow App', [REDIRECT]);
    const { verifier, challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read write',
      redirectUri: REDIRECT,
    });

    const result = exchangeCode(code, verifier, REDIRECT);
    expect(result).not.toBeNull();
    expect(result!.accessToken).toBeTruthy();
    expect(result!.refreshToken).toBeTruthy();
    expect(result!.expiresIn).toBe(3600);
    expect(result!.scope).toBe('read write');
    expect(result!.tier).toBe('free');
  });

  it('exchangeCode fails with wrong verifier', () => {
    const { clientId } = registerClient('Bad Verifier App', [REDIRECT]);
    const { challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: REDIRECT,
    });

    const result = exchangeCode(code, 'wrong-verifier', REDIRECT);
    expect(result).toBeNull();
  });

  it('exchangeCode fails with wrong redirect_uri', () => {
    const { clientId } = registerClient('Bad Redirect App', [REDIRECT]);
    const { verifier, challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: REDIRECT,
    });

    const result = exchangeCode(code, verifier, 'http://evil.example.com/callback');
    expect(result).toBeNull();
  });

  it('exchangeCode rejects already-used code', () => {
    const { clientId } = registerClient('Replay App', [REDIRECT]);
    const { verifier, challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: REDIRECT,
    });

    const first = exchangeCode(code, verifier, REDIRECT);
    expect(first).not.toBeNull();

    const second = exchangeCode(code, verifier, REDIRECT);
    expect(second).toBeNull();
  });

  it('validateAccessToken returns client info for valid token', () => {
    const { clientId } = registerClient('Validate App', [REDIRECT]);
    const { verifier, challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: REDIRECT,
    });

    const result = exchangeCode(code, verifier, REDIRECT);
    expect(result).not.toBeNull();

    const validation = validateAccessToken(result!.accessToken);
    expect(validation).not.toBeNull();
    expect(validation!.clientId).toBe(clientId);
    expect(validation!.scope).toBe('read');
    expect(validation!.tier).toBe('free');
  });

  it('validateAccessToken returns null for invalid token', () => {
    expect(validateAccessToken('invalid-token-string')).toBeNull();
  });

  it('refreshAccessToken issues a new access token', () => {
    const { clientId } = registerClient('Refresh App', [REDIRECT]);
    const { verifier, challenge } = pkce();

    const code = createAuthCode({
      clientId,
      codeChallenge: challenge,
      scope: 'read',
      redirectUri: REDIRECT,
    });

    const initial = exchangeCode(code, verifier, REDIRECT);
    expect(initial).not.toBeNull();

    const refreshed = refreshAccessToken(initial!.refreshToken);
    expect(refreshed).not.toBeNull();
    expect(refreshed!.accessToken).toBeTruthy();
    expect(refreshed!.accessToken).not.toBe(initial!.accessToken);
    expect(refreshed!.expiresIn).toBe(3600);
  });

  it('refreshAccessToken returns null for invalid refresh token', () => {
    expect(refreshAccessToken('invalid-refresh-token')).toBeNull();
  });

  it('cleanupExpired returns number of deleted records', () => {
    const deleted = cleanupExpired();
    expect(typeof deleted).toBe('number');
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});

describe('oauth-routes (integration)', () => {
  it('module exports registerOAuthRoutes function', async () => {
    const mod = await import('../src/auth/oauth-routes.js');
    expect(typeof mod.registerOAuthRoutes).toBe('function');
  });
});
