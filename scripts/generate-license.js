import crypto from 'node:crypto';

// The private key matches the hardcoded public key in `src/auth/license.ts`
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgfXm75P3zX8x0f3+B
a3z4l5Vw/2L2qN33iS6Jv8w/9v+hRANCAARRItk8yd8WZgTF91Bo2qyDk3dN0uYc
MhgF6ltJmHDv7HNDWzDFhu6hbcePy3SqLi3PjYmqxtVLEZvcbmSxgx8A
-----END PRIVATE KEY-----`;

/**
 * Generates a signed, Base64-encoded license key
 * @param {string} clientName - Name of the license holder (e.g. "Acme Corp")
 * @param {'pro'|'enterprise'} tier - The active plan tier
 * @param {string} expiresAt - ISO string expiration date (e.g., "2027-12-31T23:59:59Z")
 */
function generateSignedKey(clientName, tier, expiresAt) {
  const validationString = `${clientName}:${tier}:${expiresAt}`;
  
  const signer = crypto.createSign('SHA256');
  signer.update(validationString);
  const signature = signer.sign(PRIVATE_KEY_PEM, 'hex');

  const payload = {
    clientName,
    tier,
    expiresAt,
    signature
  };

  const payloadStr = JSON.stringify(payload);
  const base64Key = Buffer.from(payloadStr, 'utf8').toString('base64');
  
  console.log('----------------------------------------------------');
  console.log(`🔑 NEW SIGNED LICENSE KEY FOR: ${clientName} (${tier.toUpperCase()})`);
  console.log('----------------------------------------------------');
  console.log(base64Key);
  console.log('----------------------------------------------------');
  return base64Key;
}

// Generate example keys
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 2); // 2 years valid for demo/production template

generateSignedKey('Sugukuru Real Estate Partner', 'pro', nextYear.toISOString());
