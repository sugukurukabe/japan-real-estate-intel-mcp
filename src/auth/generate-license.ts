/**
 * ECDSA License Key Generator
 *
 * Generates cryptographically signed license keys that can be verified
 * offline by `verifyLicenseKeyOffline()` in `./license.ts`.
 *
 * The private key MUST be provided via the `LICENSE_PRIVATE_KEY_PEM`
 * environment variable. NEVER commit it to version control.
 *
 * Key pair generation:
 *   openssl ecparam -genkey -name prime256v1 -noout -out private.pem
 *   openssl ec -in private.pem -pubout -out public.pem
 */
import crypto from 'node:crypto';
import { moduleLogger } from '../logger.js';
import type { Tier } from '../tiers.js';

const log = moduleLogger('license_gen');

export interface GeneratedLicense {
  licenseKey: string; // Base64-encoded signed payload
  clientName: string;
  tier: Tier;
  expiresAt: string; // ISO 8601
}

/**
 * Loads the ECDSA private key from environment.
 * Supports both raw PEM and escaped newline format.
 */
function loadPrivateKey(): string {
  const raw = process.env.LICENSE_PRIVATE_KEY_PEM;
  if (!raw) {
    throw new Error(
      'LICENSE_PRIVATE_KEY_PEM environment variable is not set. ' +
        'Cannot generate license keys without the signing private key.',
    );
  }
  // Support both literal newlines and escaped \\n in env vars
  return raw.replace(/\\n/g, '\n');
}

/**
 * Generates a signed ECDSA license key.
 *
 * @param clientName - Name of the license holder (e.g. company name or email)
 * @param tier - 'pro' or 'enterprise'
 * @param durationMonths - License validity duration in months (default: 12)
 * @returns Generated license with Base64-encoded key
 */
export function generateSignedLicenseKey(
  clientName: string,
  tier: 'pro' | 'enterprise',
  durationMonths = 12,
): GeneratedLicense {
  const privateKeyPem = loadPrivateKey();

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  const expiresAtIso = expiresAt.toISOString();

  // Create signature: same format as verifyLicenseKeyOffline expects
  const validationString = `${clientName}:${tier}:${expiresAtIso}`;
  const signer = crypto.createSign('SHA256');
  signer.update(validationString);
  const signature = signer.sign(privateKeyPem, 'hex');

  // Build payload matching the expected license format
  const payload = {
    clientName,
    tier,
    expiresAt: expiresAtIso,
    signature,
  };

  const licenseKey = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

  log.info(
    { clientName, tier, expiresAt: expiresAtIso },
    'License key generated',
  );

  return {
    licenseKey,
    clientName,
    tier,
    expiresAt: expiresAtIso,
  };
}
