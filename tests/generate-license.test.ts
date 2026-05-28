/**
 * Tests for license key generation round-trip:
 * generate → verify offline → confirm match.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'node:crypto';

// We need a key pair for testing
let privateKeyPem: string;
let publicKeyPem: string;

beforeAll(() => {
  // Generate a fresh ECDSA key pair for testing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });
  privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

  // Set the private key for the generator
  process.env.LICENSE_PRIVATE_KEY_PEM = privateKeyPem;
});

afterAll(() => {
  delete process.env.LICENSE_PRIVATE_KEY_PEM;
});

describe('generate-license', () => {
  it('generates a valid Base64-encoded license key', async () => {
    const { generateSignedLicenseKey } = await import(
      '../src/auth/generate-license.js'
    );

    const result = generateSignedLicenseKey('Test Corp', 'pro', 12);

    expect(result.clientName).toBe('Test Corp');
    expect(result.tier).toBe('pro');
    expect(result.licenseKey).toBeTruthy();
    expect(result.expiresAt).toBeTruthy();

    // Verify the Base64 decodes to valid JSON
    const decoded = JSON.parse(
      Buffer.from(result.licenseKey, 'base64').toString('utf8'),
    );
    expect(decoded.clientName).toBe('Test Corp');
    expect(decoded.tier).toBe('pro');
    expect(decoded.signature).toBeTruthy();
  });

  it('generates a key that can be cryptographically verified', async () => {
    const { generateSignedLicenseKey } = await import(
      '../src/auth/generate-license.js'
    );

    const result = generateSignedLicenseKey('Verify Corp', 'enterprise', 24);

    // Manually verify the signature (same logic as verifyLicenseKeyOffline)
    const decoded = JSON.parse(
      Buffer.from(result.licenseKey, 'base64').toString('utf8'),
    );

    const validationString = `${decoded.clientName}:${decoded.tier}:${decoded.expiresAt}`;
    const verifier = crypto.createVerify('SHA256');
    verifier.update(validationString);

    const isValid = verifier.verify(publicKeyPem, decoded.signature, 'hex');
    expect(isValid).toBe(true);
  });

  it('sets correct expiration for enterprise (24 months)', async () => {
    const { generateSignedLicenseKey } = await import(
      '../src/auth/generate-license.js'
    );

    const result = generateSignedLicenseKey('Enterprise Inc', 'enterprise', 24);
    const expires = new Date(result.expiresAt);
    const now = new Date();

    // Should be roughly 24 months from now (allow 1 day tolerance)
    const diffMonths =
      (expires.getFullYear() - now.getFullYear()) * 12 +
      (expires.getMonth() - now.getMonth());
    expect(diffMonths).toBeGreaterThanOrEqual(23);
    expect(diffMonths).toBeLessThanOrEqual(24);
  });

  it('throws when LICENSE_PRIVATE_KEY_PEM is not set', async () => {
    const saved = process.env.LICENSE_PRIVATE_KEY_PEM;
    delete process.env.LICENSE_PRIVATE_KEY_PEM;

    // Need to re-import to clear the cached module
    const mod = await import('../src/auth/generate-license.js');

    expect(() => mod.generateSignedLicenseKey('Fail', 'pro', 12)).toThrow(
      'LICENSE_PRIVATE_KEY_PEM',
    );

    process.env.LICENSE_PRIVATE_KEY_PEM = saved;
  });
});
