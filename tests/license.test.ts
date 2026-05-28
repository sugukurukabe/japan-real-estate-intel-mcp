import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { verifyLicenseKeyOffline, verifyLicenseKey } from '../src/auth/license.js';
import { resolveTier } from '../src/tiers.js';

// Elliptic Curve Private Key (matching the public key hardcoded in src/auth/license.ts)
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJGy05cAJ1bjGMEwc
76HU6OSVBqvk9jlnbShfEUOcRM2hRANCAARRItk8yd8WZgTF91Bo2qyDk3dN0uYc
MhgF6ltJmHDv7HNDWzDFhu6hbcePy3SqLi3PjYmqxtVLEZvcbmSxgx8A
-----END PRIVATE KEY-----`;

// Helper to generate a cryptographically signed license key for tests
function generateTestLicenseKey(clientName: string, tier: string, expiresAt: string): string {
  const validationString = `${clientName}:${tier}:${expiresAt}`;
  const signer = crypto.createSign('SHA256');
  signer.update(validationString);
  const signature = signer.sign(PRIVATE_KEY_PEM, 'hex');

  const payload = { clientName, tier, expiresAt, signature };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

describe('License Verification System', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('LICENSE_SERVER_URL', 'https://api.realestate-mcp.jp/licenses/validate');
  });

  describe('Offline Cryptographic Signature Check', () => {
    it('should successfully verify a valid signed Pro license key', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow
      const licenseKey = generateTestLicenseKey('Aichi Real Estate Group', 'pro', expiresAt);

      const result = verifyLicenseKeyOffline(licenseKey);
      expect(result.success).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.clientName).toBe('Aichi Real Estate Group');
      expect(result.expiresAt).toBe(expiresAt);
    });

    it('should successfully verify a valid signed Enterprise license key', () => {
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
      const licenseKey = generateTestLicenseKey('Nagoya Development Corp', 'enterprise', expiresAt);

      const result = verifyLicenseKeyOffline(licenseKey);
      expect(result.success).toBe(true);
      expect(result.tier).toBe('enterprise');
    });

    it('should reject a license with an invalid signature', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const licenseKey = generateTestLicenseKey('Tampered Client', 'pro', expiresAt);
      
      // Decode, modify the JSON payload, and encode back
      const decodedStr = Buffer.from(licenseKey, 'base64').toString('utf8');
      const payload = JSON.parse(decodedStr);
      payload.signature = payload.signature.replace(/./, '0'); // change first character of signature
      
      const tamperedKey = Buffer.from(JSON.stringify(payload)).toString('base64');

      const result = verifyLicenseKeyOffline(tamperedKey);
      expect(result.success).toBe(false);
      expect(result.tier).toBe('free');
    });

    it('should reject a license whose expiration date has passed', () => {
      const expiredDate = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
      const licenseKey = generateTestLicenseKey('Expired Client LLC', 'pro', expiredDate);

      const result = verifyLicenseKeyOffline(licenseKey);
      expect(result.success).toBe(false);
      expect(result.tier).toBe('free');
      expect(result.reason).toContain('有効期限が切れています');
    });

    it('should reject a malformed or corrupt license key string', () => {
      const result = verifyLicenseKeyOffline('this-is-not-base64-json-at-all');
      expect(result.success).toBe(false);
      expect(result.tier).toBe('free');
    });
  });

  describe('Online/Offline Integrated Validation', () => {
    it('should handle mock valid developer keys directly', async () => {
      const res1 = await verifyLicenseKey('test-valid-pro-key');
      expect(res1.success).toBe(true);
      expect(res1.tier).toBe('pro');

      const res2 = await verifyLicenseKey('test-valid-enterprise-key');
      expect(res2.success).toBe(true);
      expect(res2.tier).toBe('enterprise');

      const res3 = await verifyLicenseKey('test-expired-key');
      expect(res3.success).toBe(false);
      expect(res3.tier).toBe('free');
    });

    it('should handle empty or missing license key', async () => {
      const result = await verifyLicenseKey(undefined);
      expect(result.success).toBe(false);
      expect(result.tier).toBe('free');
    });

    it('should fall back to offline verification when online service times out', async () => {
      // Mock global fetch to trigger a timeout/abort
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const licenseKey = generateTestLicenseKey('Corporate Offline Ltd', 'pro', expiresAt);

      const result = await verifyLicenseKey(licenseKey);
      expect(result.success).toBe(true); // Falls back to offline and succeeds!
      expect(result.tier).toBe('pro');
      expect(result.clientName).toBe('Corporate Offline Ltd');

      global.fetch = originalFetch; // restore
    });
  });

  describe('Dynamic Tier Resolver (resolveTier)', () => {
    it('should allow free requested tier without any license key', async () => {
      const result = await resolveTier('free', undefined);
      expect(result.tier).toBe('free');
      expect(result.errorReason).toBeUndefined();
    });

    it('should upgrade to requested pro tier when valid pro license key is provided', async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const licenseKey = generateTestLicenseKey('Investor Corp', 'pro', expiresAt);

      // Disable NODE_ENV=test bypass for this specific key
      vi.stubEnv('NODE_ENV', 'production');
      // Mock fetch to simulate successful online validation returning pro
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, tier: 'pro', clientName: 'Investor Corp', expiresAt }),
      } as Response);

      const result = await resolveTier('pro', licenseKey);
      expect(result.tier).toBe('pro');
      expect(result.errorReason).toBeUndefined();

      global.fetch = originalFetch;
    });

    it('should downgrade to free tier if license verification fails for pro request', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const result = await resolveTier('pro', 'invalid-license-key');
      expect(result.tier).toBe('free');
      expect(result.errorReason).toBeDefined();
    });

    it('should reject requested enterprise tier if license is only for pro', async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const licenseKey = generateTestLicenseKey('Pro Client', 'pro', expiresAt);

      vi.stubEnv('NODE_ENV', 'production');
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, tier: 'pro', clientName: 'Pro Client', expiresAt }),
      } as Response);

      const result = await resolveTier('enterprise', licenseKey);
      expect(result.tier).toBe('free');
      expect(result.errorReason).toContain('一致しません');

      global.fetch = originalFetch;
    });
  });
});
