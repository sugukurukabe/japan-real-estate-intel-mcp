#!/usr/bin/env node
/**
 * CLI wrapper around `generateSignedLicenseKey()` (src/auth/generate-license.ts).
 *
 * SECURITY: the ECDSA signing key is never hardcoded here or in the source
 * module — it is loaded exclusively from the `LICENSE_PRIVATE_KEY_PEM`
 * environment variable at runtime. A prior version of this script embedded a
 * private key directly in the file, which — since this repository is
 * public — would have let anyone clone the repo and mint their own license
 * keys. Always generate a fresh key pair per deployment and keep the
 * private half out of version control:
 *
 *   openssl ecparam -genkey -name prime256v1 -noout -out private.pem
 *   openssl ec -in private.pem -pubout -out public.pem
 *
 * Usage (requires `pnpm build` first, so dist/auth/generate-license.js exists):
 *   LICENSE_PRIVATE_KEY_PEM="$(cat private.pem)" \
 *     node scripts/generate-license.js "Client Name" pro 12
 *
 * Args: [clientName="Sugukuru Demo"] [tier=pro] [durationMonths=12]
 */
import { generateSignedLicenseKey } from '../dist/auth/generate-license.js';

const [clientName = 'Sugukuru Demo', tier = 'pro', durationMonthsArg = '12'] = process.argv.slice(2);

if (tier !== 'pro' && tier !== 'enterprise') {
  console.error(`❌ tier must be "pro" or "enterprise" (got "${tier}")`);
  process.exit(1);
}

const durationMonths = Number(durationMonthsArg);
if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
  console.error(`❌ durationMonths must be a positive number (got "${durationMonthsArg}")`);
  process.exit(1);
}

try {
  const result = generateSignedLicenseKey(clientName, tier, durationMonths);
  console.log('----------------------------------------------------');
  console.log(`🔑 NEW SIGNED LICENSE KEY FOR: ${result.clientName} (${result.tier.toUpperCase()})`);
  console.log(`   Expires: ${result.expiresAt}`);
  console.log('----------------------------------------------------');
  console.log(result.licenseKey);
  console.log('----------------------------------------------------');
} catch (err) {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  console.error('   See docs/licensing-and-stripe-integration.md for key generation instructions.');
  process.exit(1);
}
