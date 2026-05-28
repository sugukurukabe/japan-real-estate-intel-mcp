import type { Express, Request, Response } from 'express';
import {
  getClient,
  createAuthCode,
  exchangeCode,
  refreshAccessToken,
  cleanupExpired,
} from './oauth-store.js';
import { moduleLogger } from '../logger.js';

const log = moduleLogger('oauth');

export function registerOAuthRoutes(app: Express): void {
  // Periodic cleanup (every 15 min)
  setInterval(() => cleanupExpired(), 15 * 60 * 1000);

  // ── Authorization endpoint ──────────────────────────────────────────────
  app.get('/oauth/authorize', (req: Request, res: Response) => {
    const {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
      scope,
      state,
    } = req.query as Record<string, string>;

    if (response_type !== 'code') {
      res.status(400).json({ error: 'unsupported_response_type' });
      return;
    }

    if (!code_challenge) {
      res
        .status(400)
        .json({ error: 'invalid_request', description: 'PKCE code_challenge required' });
      return;
    }

    const client = getClient(client_id);
    if (!client) {
      res.status(400).json({ error: 'invalid_client' });
      return;
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      res.status(400).json({ error: 'invalid_redirect_uri' });
      return;
    }

    const code = createAuthCode({
      clientId: client_id,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method ?? 'S256',
      scope,
      redirectUri: redirect_uri,
    });

    log.info({ clientId: client_id, scope }, 'Auth code issued');
    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);
    res.redirect(url.toString());
  });

  // ── Token endpoint ──────────────────────────────────────────────────────
  app.post('/oauth/token', (req: Request, res: Response) => {
    const { grant_type, code, code_verifier, redirect_uri, refresh_token } = req.body;

    if (grant_type === 'authorization_code') {
      if (!code || !code_verifier || !redirect_uri) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const result = exchangeCode(code, code_verifier, redirect_uri);
      if (!result) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }

      log.info('Access token issued via authorization_code');
      res.json({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_type: 'Bearer',
        expires_in: result.expiresIn,
        scope: result.scope,
      });
      return;
    }

    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const result = refreshAccessToken(refresh_token);
      if (!result) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }

      log.info('Access token refreshed');
      res.json({
        access_token: result.accessToken,
        token_type: 'Bearer',
        expires_in: result.expiresIn,
      });
      return;
    }

    res.status(400).json({ error: 'unsupported_grant_type' });
  });

  // ── OAuth metadata (RFC 8414) ───────────────────────────────────────────
  app.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
    const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? '3100'}`;
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['read', 'write', 'admin'],
    });
  });
}
