# Pre-Release Checklist - LintAssist Plugin

This checklist ensures all test data and placeholders are replaced with production credentials and settings before launching the plugin.

## 1. Stripe Setup (Live Mode)
- [ ] Toggle **Live mode** on in the Stripe Dashboard.
- [ ] Recreate all 3 Payment Products in Live mode:
  - Starter ($8/mo)
  - Pro ($16/mo)
  - Top-up ($5 one-time)
- [ ] Copy the new **Live Price IDs** (`price_...`) and update `worker-stripe.js`:
  ```javascript
  const STRIPE_PRICE_MAP = {
    'price_LIVE_STARTER_ID': 'starter',
    'price_LIVE_PRO_ID': 'pro',
    'price_LIVE_TOPUP_ID': 'topup',
  };
  ```
- [ ] Create new Live Payment Links for the products and update your marketing site (`index.html` on `designaudit.pages.dev`).
- [ ] Re-create the Stripe Webhook pointing to your worker (`https://ux-audit-worker.YOUR-SUBDOMAIN.workers.dev/webhook/stripe`) and copy the Live Signing Secret (`whsec_...`).

## 2. Cloudflare Worker Deployment
- [ ] Ensure the D1 Database has the correct schema applied (specifically the `stripe_subscription_id` column):
  ```bash
  wrangler d1 execute ux-audit-db --remote --command "ALTER TABLE subscribers ADD COLUMN stripe_subscription_id TEXT;"
  ```
- [ ] Set all production secrets in Cloudflare Workers using Wrangler:
  ```bash
  wrangler secret put ANTHROPIC_API_KEY
  wrangler secret put ADMIN_SECRET
  wrangler secret put STRIPE_WEBHOOK_SECRET  # Must be the Live Mode secret
  ```
- [ ] Deploy the final worker code to production:
  ```bash
  wrangler deploy worker-stripe.js
  ```

## 3. Plugin Code Updates
- [ ] Verify `ui.html` points to the correct production worker URL:
  ```javascript
  var WORKER = 'https://ux-audit-worker.domain-sparrow.workers.dev';
  ```
- [ ] Ensure the Claude model specified in `ui.html` (`claude-sonnet-4-20250514` or equivalent) is the correct version you intend to use. (Note: Anthropic's current model is typically `claude-3-5-sonnet-20241022`, double check `ui.html` line 464).
- [ ] Remove any leftover testing `console.log` statements in `code.js` and `ui.html`.

## 4. Figma Publishing
- [ ] Select the plugin from the local development menu in Figma.
- [ ] Click **"Publish new release"**.
- [ ] Fill out the required Figma Community metadata (Plugin Name, Description, Icon, Cover Art).
- [ ] Submit for review.
