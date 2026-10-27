# Pre-Release Checklist — LintAssist

What's actually left before the product is fully "live" (not just
deployed). The web app, Figma plugin, admin panel, AI pipeline, and
free/email-signup access model are already live in production at
`lintassist.com` — this checklist covers what's still pending, mainly
turning on real payments. See `HISTORY.md` for how the product got here
and `PRD.md` for the current architecture in full.

## 1. Stripe (not live yet — everything below is still a placeholder)

Full step-by-step is in `stripe-setup.md`; this is just the go-live
sequence.

- [ ] Create the 3 products in Stripe **Live mode** (test-mode products
      don't carry over): Starter ($8/mo), Pro ($16/mo), Top-up ($5
      one-time, 10 credits).
- [ ] Copy the Live Price IDs into `STRIPE_PRICE_MAP` in
      `worker-stripe.js` (currently placeholder IDs).
- [ ] Create Live Payment Links for each product and swap them into
      `public/index.html` and `figma-plugin/ui.html` (currently
      `https://buy.stripe.com/STARTER_LINK` etc. — see `TOKENS.md` §2).
- [ ] Re-create the Stripe webhook pointing at
      `https://ux-audit-worker.domain-sparrow.workers.dev/webhook/stripe`,
      select `checkout.session.completed` and
      `customer.subscription.deleted`, copy the **Live** signing secret.
- [ ] `wrangler secret put STRIPE_WEBHOOK_SECRET` with that live secret.
- [ ] Un-hide the paid-plan pricing cards in `public/index.html` — drop
      the `style="display:none;"` on the wrapper `div` right after the
      "Hidden for now, not removed" comment (currently ~line 1423–1425);
      same pattern in `figma-plugin/ui.html` if it hides them too.
- [ ] Test the full flow with a real low-value charge or Stripe's test
      clock in live mode before announcing it.

## 2. Ongoing / not urgent, but worth doing before heavy traffic

- [ ] Decide a backup strategy for the D1 database (`ux-audit-db`) —
      currently relies on Cloudflare's own durability only.
- [ ] Add basic uptime/error alerting for the Worker (currently none —
      failures are only visible via `wrangler tail` or the admin panel).
- [ ] Consider lightweight funnel tracking (anonymous trial → email
      signup → repeat use) — nothing beyond the admin panel's raw counts
      exists today.
- [ ] Review `MODEL_PRICING` in `worker-stripe.js` periodically — it's a
      hardcoded snapshot of OpenRouter/Anthropic pricing, not live.

## 3. Already done (kept here so it's not re-checked by mistake)

- [x] AI pipeline: OpenRouter (Qwen → DeepSeek) with Claude fallback,
      cost-tracked per request.
- [x] Free access model: 2 anonymous + 5/day via email signup, with
      abuse guards (disposable-email blocklist, Gmail alias
      normalization, per-IP/global daily caps, kill switch — all
      admin-configurable).
- [x] Admin panel: subscribers, usage/cost per user, request log,
      signup controls.
- [x] `lintassist.com` / `www.lintassist.com` live as Cloudflare Pages
      custom domains.
- [x] Privacy policy live at `/privacy.html`.
- [x] `SECURITY.md` + GitHub private vulnerability reporting enabled.
- [x] Figma Community submission: description, assets, Data Security
      disclosure answers all prepared (`FIGMA_PUBLISHING.md`) and
      submitted — status "In review" as of 2026-09-16.
