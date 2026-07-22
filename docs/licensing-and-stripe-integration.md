# 🔑 Japan Real Estate Intel License Key Signature Utility

This utility allows system administrators or checkout billing handlers to generate secure, cryptographically signed license keys using ECDSA (prime256v1).

These keys can be verified offline by the MCP server or the Web UI dashboard without requiring constant database connection.

---

## 🛠️ Requirements

- **Node.js**: v20 or later
- `pnpm build` has been run at least once (the generator imports the compiled `dist/auth/generate-license.js`, which wraps `src/auth/generate-license.ts`)

---

## 🚀 How to Generate a Key

The signing logic lives in `src/auth/generate-license.ts` and is exercised by `scripts/generate-license.js` (a thin CLI wrapper) and `pnpm test` (`tests/generate-license.test.ts`). Both **always** load the private key from the `LICENSE_PRIVATE_KEY_PEM` environment variable — it is never hardcoded in the repository.

⚠️ **SECURITY**: this repository is public. If a private key is ever hardcoded into a committed file (as an earlier revision of `scripts/generate-license.js` briefly did with a test-only key), anyone who clones the repo could mint their own "valid" license keys for any tier. Always keep `LICENSE_PRIVATE_KEY_PEM` out of version control — pass it only via environment variable or secret manager.

### 1. Generate a key pair (once, store the private half securely)

```bash
openssl ecparam -genkey -name prime256v1 -noout -out private.pem
openssl ec -in private.pem -pubout -out public.pem
```

Update the **non-test** branch of `PUBLIC_KEY_PEM` in `src/auth/license.ts` with the contents of `public.pem`, then rebuild and redeploy.

### 2. Build once, then run the generator

```bash
pnpm build:server
LICENSE_PRIVATE_KEY_PEM="$(cat private.pem)" \
  node scripts/generate-license.js "Real Estate Partner LLC" pro 12
# args: clientName tier(pro|enterprise) durationMonths — all optional, defaults shown
```

---

## ⚡ Stripe Checkout Integration (Webhook handler)

To automate key delivery when a customer pays via **Stripe Checkout**, set up a serverless function (e.g., AWS Lambda, Vercel Serverless, or a route in your billing platform) that listens to the `checkout.session.completed` event:

```javascript
import Stripe from 'stripe';
// Import the generation logic above...

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const clientName = session.customer_details.name || session.customer_details.email;
    const planTier = 'pro'; // Set based on line items or metadata
    
    // Create expiration date (1 year out)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    // Generate signed key
    const newLicenseKey = generateSignedKey(clientName, planTier, expiry.toISOString());
    
    // TODO: Send email to session.customer_details.email containing the license key!
  }

  res.json({ received: true });
}
```
