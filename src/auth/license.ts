import crypto from 'node:crypto';
import { moduleLogger } from '../logger.js';
import type { Tier } from '../tiers.js';

const log = moduleLogger('license');

// Hardcoded ECDSA prime256v1 Public Key of Sugukuru Real Estate Intel
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEUSLZPMnfFmYExfdQaNqsg5N3TdLm
HDIYBepbSZhw7+xzQ1swxYbuoW3Hj8t0qi4tz42JqsbVSxGb3G5ksYMfAA==
-----END PUBLIC KEY-----`;

export interface LicenseVerificationResult {
  success: boolean;
  tier: Tier;
  clientName?: string;
  expiresAt?: string;
  reason?: string;
}

/**
 * Decodes and cryptographically verifies a signed license key offline.
 * Key is expected to be a Base64-encoded JSON string:
 * {
 *   "clientName": "...",
 *   "tier": "pro" | "enterprise",
 *   "expiresAt": "2027-12-31T23:59:59Z",
 *   "signature": "<hex-encoded ECDSA signature>"
 * }
 */
export function verifyLicenseKeyOffline(licenseKey: string): LicenseVerificationResult {
  try {
    const decodedStr = Buffer.from(licenseKey, 'base64').toString('utf8');
    const payload = JSON.parse(decodedStr);

    const { clientName, tier, expiresAt, signature } = payload;

    if (!clientName || !tier || !expiresAt || !signature) {
      return { success: false, tier: 'free', reason: '欠損パラメータのあるライセンス形式です' };
    }

    if (tier !== 'pro' && tier !== 'enterprise' && tier !== 'free') {
      return { success: false, tier: 'free', reason: '不正なプランが指定されています' };
    }

    // Verify expiration date
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return { success: false, tier: 'free', reason: '不正な有効期限フォーマットです' };
    }
    if (expiry.getTime() < Date.now()) {
      return { success: false, tier: 'free', reason: 'ライセンスの有効期限が切れています' };
    }

    // Validate ECDSA signature
    const validationString = `${clientName}:${tier}:${expiresAt}`;
    const verifier = crypto.createVerify('SHA256');
    verifier.update(validationString);
    
    const isValid = verifier.verify(PUBLIC_KEY_PEM, signature, 'hex');

    if (!isValid) {
      return { success: false, tier: 'free', reason: 'ライセンス署名が改ざんされているか不正です' };
    }

    return {
      success: true,
      tier: tier as Tier,
      clientName,
      expiresAt,
    };
  } catch (err) {
    return {
      success: false,
      tier: 'free',
      reason: `ローカル署名検証エラー: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Validates the license key online against the official activation server.
 * Fallbacks to offline check if the server is unreachable or times out.
 */
export async function verifyLicenseKey(licenseKey: string | undefined): Promise<LicenseVerificationResult> {
  if (!licenseKey || licenseKey.trim() === '') {
    return { success: false, tier: 'free', reason: 'ライセンスキーが空です' };
  }

  // Development & Test special bypasses
  if (process.env.NODE_ENV === 'test') {
    if (licenseKey === 'test-valid-pro-key') {
      return { success: true, tier: 'pro', clientName: 'Test Client', expiresAt: '2028-12-31T23:59:59Z' };
    }
    if (licenseKey === 'test-valid-enterprise-key') {
      return { success: true, tier: 'enterprise', clientName: 'Test Enterprise', expiresAt: '2028-12-31T23:59:59Z' };
    }
    if (licenseKey === 'test-expired-key') {
      return { success: false, tier: 'free', reason: 'ライセンスの有効期限が切れています' };
    }
  }

  // Pro demo key for developer testing
  if (licenseKey === 'demo-pro-key') {
    log.info('Demo-Pro bypass key used (Internal evaluation only)');
    return { success: true, tier: 'pro', clientName: 'Demo Evaluation', expiresAt: '2029-12-31T23:59:59Z' };
  }

  const endpoint = process.env.LICENSE_SERVER_URL ?? 'https://api.realestate-mcp.jp/licenses/validate';

  // Online verification with 2 seconds timeout
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (response.ok) {
      const data = await response.json() as LicenseVerificationResult;
      log.info({ tier: data.tier, client: data.clientName }, 'Online license verification succeeded');
      return data;
    }
    
    // Server responded with non-200 (e.g. explicitly rejected / invalid license key)
    const errBody = (await response.json().catch(() => ({}))) as any;
    log.warn({ status: response.status, error: errBody }, 'Online license verification explicitly rejected');
    return {
      success: false,
      tier: 'free',
      reason: errBody.description || `オンライン検証失敗 (HTTP ${response.status})`,
    };
  } catch (err) {
    // Network error or Timeout -> fallback to local offline cryptographical verification
    const isAbort = err instanceof Error && err.name === 'AbortError';
    log.warn(
      { reason: isAbort ? 'timeout' : 'network_error' },
      'License server unreachable, falling back to local cryptographic check',
    );
    
    return verifyLicenseKeyOffline(licenseKey);
  }
}
