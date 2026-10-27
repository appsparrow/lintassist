# Stripe Setup — LintAssist
## Complete guide: products → checkout links → webhook → worker

---

## Step 1 — Create a Stripe account
1. Go to https://stripe.com → Sign up
2. Fill business details (can be "Sole Trader" / individual)
3. Go to **Dashboard → Developers → toggle Test mode ON** while building

---

## Step 2 — Create Products in Stripe

Go to **Dashboard → Products → Add product**

### Product 1: LintAssist Starter
- Name: `LintAssist — Starter`
- Pricing: **Recurring** · $8.00 · Monthly
- Click Save → copy the **Price ID** (looks like `price_1AbcXYZ...`)
- Paste it in worker-stripe.js: `'price_STARTER_ID': 'starter'`

### Product 2: LintAssist Pro
- Name: `LintAssist — Pro`
- Pricing: **Recurring** · $16.00 · Monthly
- Copy **Price ID** → paste in worker: `'price_PRO_ID': 'pro'`

### Product 3: Top-up Credits (10 audits)
- Name: `LintAssist — Top-up (10 audits)`
- Pricing: **One-time** · $5.00
- Copy **Price ID** → paste in worker: `'price_TOPUP_ID': 'topup'`

---

## Step 3 — Create Payment Links (no code checkout)

Go to **Dashboard → Payment Links → Create**

### Starter link
- Product: LintAssist Starter
- ✅ Check "Collect customer email"
- ✅ Check "Allow promotion codes" (optional)
- Under **After payment** → Redirect to your site or a "thank you" page
- Create → copy URL (e.g. `https://buy.stripe.com/abc123`)
- Paste in index.html: `href="https://buy.stripe.com/abc123"`

### Pro link
- Same as above but with Pro product
- Paste in index.html pro plan href

### Top-up link
- Product: Top-up Credits
- ✅ Collect email
- Create → paste in index.html topup-btn href

---

## Step 4 — Set up Webhook

Go to **Dashboard → Developers → Webhooks → Add endpoint**

- Endpoint URL: `https://ux-audit-worker.YOUR-SUBDOMAIN.workers.dev/webhook/stripe`
- Select events:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.deleted`
- Click **Add endpoint**
- Copy the **Signing secret** (starts with `whsec_...`)

Then run:
```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# paste: whsec_xxxxxxxxxxxx
```

---

## Step 5 — Update schema.sql (add Stripe column)

Run this on your D1 database to add the Stripe subscription ID column:

```bash
wrangler d1 execute ux-audit-db --remote --command \
  "ALTER TABLE subscribers ADD COLUMN stripe_subscription_id TEXT;"
```

---

## Step 6 — Deploy updated worker

```bash
# Make sure you have the secrets set
wrangler secret put ANTHROPIC_API_KEY   # your sk-ant-... key
wrangler secret put ADMIN_SECRET        # long random string
wrangler secret put STRIPE_WEBHOOK_SECRET  # whsec_... from step 4

# Deploy
wrangler deploy worker-stripe.js
```

---

## Step 7 — Test the full flow

1. Go to your Stripe Starter payment link
2. Use test card: `4242 4242 4242 4242` · any future date · any CVC
3. Complete checkout
4. Check your Worker logs: `wrangler tail`
   - You should see: `action: subscriber_created`
5. Check D1: `wrangler d1 execute ux-audit-db --remote --command "SELECT * FROM subscribers"`
6. Token should appear — paste it in the web app and verify it works

---

## How Top-ups Work (subscriber-only logic)

The web app:
1. After token verified, calls `/status`
2. `/status` returns `is_subscriber: true` if plan is starter or pro
3. If subscriber AND usage ≥ 80%, top-up banner appears
4. Top-up link includes `?client_reference_id=TOKEN` — Stripe passes this to webhook
5. Webhook sees it's a `topup` price → adds 10 credits to that exact token
6. Non-subscribers never see the top-up option

---

## Pricing summary (check your margins)

| Plan    | Price | Audits | Per audit | Claude cost | Net/user/mo |
|---------|-------|--------|-----------|-------------|-------------|
| Starter | $8    | 20     | $0.40     | ~$0.32      | ~$7.37*     |
| Pro     | $16   | 50     | $0.32     | ~$0.80      | ~$14.76*    |
| Top-up  | $5    | 10     | $0.50     | ~$0.16      | ~$4.41*     |

*After Stripe fees (2.9% + $0.30 per transaction)

Break-even: ~70 paying users → ~$700/mo net

---

## Going live (remove test mode)

1. Stripe Dashboard → toggle **Live mode**
2. Recreate products in live mode (test products don't transfer)
3. Get new price IDs → update worker
4. Get new webhook signing secret → `wrangler secret put STRIPE_WEBHOOK_SECRET`
5. Recreate payment links in live mode → update index.html hrefs
6. Deploy worker again

---

## What Stripe handles for you (so you don't have to)
- Payment processing (cards, Apple Pay, Google Pay)
- Receipts emailed automatically
- Failed payment retries
- Cancellation & refund portal
- VAT/tax collection (enable in Settings → Tax)
- Monthly invoices
