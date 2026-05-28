# 🔑 Japan Real Estate Intel License Key Signature Utility

This utility allows system administrators or checkout billing handlers to generate secure, cryptographically signed license keys using ECDSA (prime256v1).

These keys can be verified offline by the MCP server or the Web UI dashboard without requiring constant database connection.

---

## 🛠️ Requirements

- **Node.js**: v18 or later

---

## 🚀 How to Generate a Key

You can run the script below using `node` to generate a new valid signed license key.

### 1. Save this script as `scripts/generate-license.js`

```javascript
import crypto from 'node:crypto';

// The private key must match the hardcoded public key in `src/auth/license.ts`
// For production setup, generate a secure prime256v1 private key PEM.
// Here is the pre-configured private key that matches our built-in public key:
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

// Example usage: Create a Pro key valid for 1 year
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
generateSignedKey('Real Estate Partner LLC', 'pro', nextYear.toISOString());
```

### 2. Run the generator
```bash
node scripts/generate-license.js
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
