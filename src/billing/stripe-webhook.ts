/**
 * Stripe Webhook Handler
 *
 * Handles Stripe events to automate license key lifecycle:
 * - checkout.session.completed → Generate & store ECDSA license key
 * - customer.subscription.deleted → Revoke licenses
 *
 * Requires:
 * - STRIPE_SECRET_KEY: Stripe API secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook endpoint signing secret (whsec_...)
 * - LICENSE_PRIVATE_KEY_PEM: ECDSA private key for license signing
 */
import type { Request, Response, Router } from 'express';
import { moduleLogger } from '../logger.js';
import { generateSignedLicenseKey } from '../auth/generate-license.js';
import { issueLicense, revokeLicensesByCustomer } from './license-store.js';

const log = moduleLogger('stripe_webhook');

/**
 * Tier mapping from Stripe Price ID metadata to internal tier.
 * Configurable via environment variables.
 */
function resolveTierFromSession(session: {
  metadata?: Record<string, string> | null;
}): 'pro' | 'enterprise' {
  const tierMeta = session.metadata?.tier;
  if (tierMeta === 'enterprise') return 'enterprise';
  return 'pro'; // default to Pro
}

/**
 * Registers Stripe webhook routes on the given Express router.
 *
 * IMPORTANT: The webhook route must use `express.raw()` middleware
 * because Stripe signature verification requires the raw request body.
 */
export function registerStripeWebhookRoutes(router: Router): void {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    log.info(
      'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set — Stripe webhook routes disabled',
    );
    return;
  }

  // Lazy-load Stripe to avoid import errors when not configured
  let stripeInstance: import('stripe').default | null = null;

  async function getStripe(): Promise<import('stripe').default> {
    if (stripeInstance) return stripeInstance;
    const { default: Stripe } = await import('stripe');
    stripeInstance = new Stripe(secretKey!);
    return stripeInstance;
  }

  router.post('/stripe/webhook', async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string | undefined;

    if (!sig) {
      log.warn('Missing stripe-signature header');
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: import('stripe').Stripe.Event;

    try {
      const stripe = await getStripe();
      // req.body must be the raw Buffer (set via express.raw() middleware)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret!);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ error: msg }, 'Stripe webhook signature verification failed');
      res.status(400).json({ error: `Webhook signature verification failed: ${msg}` });
      return;
    }

    log.info({ type: event.type, id: event.id }, 'Stripe webhook event received');

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await handleCheckoutCompleted(event);
          break;
        }
        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event);
          break;
        }
        default:
          log.info({ type: event.type }, 'Unhandled Stripe event type — ignored');
      }

      res.status(200).json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ error: msg, type: event.type }, 'Error processing Stripe webhook event');
      // Return 200 to prevent Stripe from retrying (log the error for investigation)
      res.status(200).json({ received: true, error: msg });
    }
  });

  log.info('Stripe webhook route registered: POST /stripe/webhook');
}

/**
 * Handles checkout.session.completed — generates and stores a license key.
 */
async function handleCheckoutCompleted(
  event: import('stripe').Stripe.Event,
): Promise<void> {
  const session = event.data.object as import('stripe').Stripe.Checkout.Session;

  const email = session.customer_details?.email ?? session.customer_email;
  const clientName =
    session.customer_details?.name ?? email ?? 'Unknown Customer';

  if (!email) {
    log.warn({ sessionId: session.id }, 'No email in checkout session — cannot issue license');
    return;
  }

  const tier = resolveTierFromSession(session);
  const durationMonths = tier === 'enterprise' ? 24 : 12;

  // Generate ECDSA-signed license key
  let generated;
  try {
    generated = generateSignedLicenseKey(clientName, tier, durationMonths);
  } catch (err) {
    log.error(
      { error: err instanceof Error ? err.message : String(err) },
      'Failed to generate license key — LICENSE_PRIVATE_KEY_PEM may not be set',
    );
    return;
  }

  // Store in SQLite
  issueLicense({
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
    stripeSessionId: session.id,
    clientName,
    email,
    tier,
    licenseKey: generated.licenseKey,
    expiresAt: generated.expiresAt,
  });

  log.info(
    {
      email,
      tier,
      expiresAt: generated.expiresAt,
      stripeSessionId: session.id,
    },
    'License key issued via Stripe checkout',
  );
}

/**
 * Handles customer.subscription.deleted — revokes all active licenses.
 */
async function handleSubscriptionDeleted(
  event: import('stripe').Stripe.Event,
): Promise<void> {
  const subscription = event.data.object as import('stripe').Stripe.Subscription;
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.toString();

  const revokedCount = revokeLicensesByCustomer(customerId);

  log.info(
    { customerId, revokedCount },
    'Licenses revoked due to subscription cancellation',
  );
}
