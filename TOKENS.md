# Tokens — how access works, how to get one, how to assign one

Internal ops notes. **Not deployed** — this file lives only in the git repo
(root, next to `worker-stripe.js`), not inside `public/`, so it never ships
to `lintassist.pages.dev` or anywhere else.

Deliberately does **not** contain any real token, email, or secret value —
those shouldn't live in git history even in a private repo. Look them up
live with the commands below instead.

## 1. What a "token" is

A token is the access credential the app checks on every request. The
client sends it as a header:

```
x-ux-token: tok_xxxxxxxxxx
```

or, for anonymous free-trial use, a synthetic `free_<random-id>` value
generated client-side (no real token, no database row — just a
localStorage-based counter capped at 2 audits).

Real tokens live in the `subscribers` table in the `ux-audit-db` D1
database, one row per customer:

| column | meaning |
|---|---|
| `token` | the credential itself, e.g. `tok_e4n954zm` |
| `email` | customer email |
| `plan` | `free` / `starter` / `pro` — controls the monthly audit limit (see `PLANS` in `worker-stripe.js`) |
| `extra_credits` | one-off top-up credits added on top of the plan limit |
| `active` | 1/0 |
| `stripe_subscription_id` | set only if created via the Stripe webhook |

Usage counts (audits used per calendar month) live in a separate `usage`
table, keyed by `(token, month_key)`.

## 2. How a customer is *supposed* to get a token (not live yet)

The intended flow, already coded in `worker-stripe.js` (`POST
/webhook/stripe`, `checkout.session.completed` handler):

1. Customer clicks **Subscribe** on the pricing section → goes to a Stripe
   Checkout page.
2. Stripe sends a `checkout.session.completed` webhook to the worker.
3. Worker auto-generates a token (`tok_` + last 12 chars of the Stripe
   subscription id), inserts/updates the `subscribers` row, and the
   customer is subscribed.

**This is NOT wired up yet.** The Stripe links in `public/index.html` and
`figma-plugin/ui.html` are still placeholders:

```
https://buy.stripe.com/STARTER_LINK
https://buy.stripe.com/PRO_LINK
https://buy.stripe.com/TOPUP_LINK
```

Until real Stripe Payment Links replace those (see `stripe-setup.md` for
the setup steps and `STRIPE_PRICE_MAP` in `worker-stripe.js` for wiring
price IDs to plans), nobody can pay for a real plan through the app —
paid tokens are still created **manually**, as in §3.

## 2b. Free-tier signup — live today (`POST /access`)

As an interim step before Stripe is wired up, there's a self-serve path
for the **free plan only** — **5 audits/day**, resetting daily (deliberately
daily rather than monthly: it brings people back more often and this
period is as much about collecting emails and seeing real usage
patterns as it is about giving audits, ahead of real paid subscriptions
going live). A small form in the paywall section (shown once the
anonymous 2-try trial runs out) asks for first name, last name, and
email, then calls:

```
POST /access
{"email": "...", "first_name": "...", "last_name": "..."}
→ {"ok": true, "token": "tok_...", "plan": "free", "is_new": true|false}
```

The 5/day figure is admin-configurable (`free_plan_daily_limit` in the
**Free Signup Controls** admin card, or the `PLANS.free` code default in
`worker-stripe.js` if you want to change what a *fresh* deploy starts
with). No email verification happens — anyone can type any email —
which is exactly why this only ever grants the `free` plan, never a paid
one. It's **idempotent by email**: calling it again with an email that
already has a token just returns that same token (`is_new: false`)
instead of granting a fresh 5/day, so it doubles as a "log back in on
another device" mechanism — no password, just the email.

Every signup lands as a normal row in `subscribers` (plan `free`), so it
shows up in the admin table automatically — no separate approval queue,
no manual step. If someone's abusing it, deactivate/delete them like any
other subscriber (§3).

### Abuse guards on `/access`

No email verification means someone (or a bot) could otherwise mint
unlimited free accounts with fake addresses. Defenses, in order:

1. **Disposable-email domain blocklist** — hardcoded list
   (`DISPOSABLE_EMAIL_DOMAINS` in `worker-stripe.js`); rejected outright.
   Ask to extend the list if a new throwaway-mail service shows up.
2. **Gmail alias normalization** — `j.doe+audit1@gmail.com` and
   `jdoe+audit2@gmail.com` collapse to the same signup (Gmail ignores
   dots and `+tags` in the local part; other providers don't share this
   convention, so only gmail.com/googlemail.com are normalized).
3. **Per-IP daily cap** (`free_signup_ip_daily_cap`, default 5) — new
   signups only; returning users (idempotent lookup) never count against it.
4. **Global daily cap** (`free_signup_daily_cap`, default 20) — total new
   free-plan signups across everyone, per day.
5. **Kill switch** (`free_signup_enabled`, default `true`) — flip to
   pause all new free signups instantly, no redeploy.

All three settings live in the admin panel's **Free Signup Controls**
card (backed by `GET`/`POST /admin/settings`, admin-secret gated) — no
code change or deploy needed to tighten/loosen them. They're stored in
a plain `key`/`value` `settings` table (`migrations/0003_signup_guard.sql`),
along with `signup_ip_log` (`ip`, `day_key`, `count`) that backs the
per-IP cap.

## 3. How to manually create / assign a token today

Two ways — pick whichever's convenient. Both need the admin secret
(see §4).

### Option A — Admin panel (easiest)

1. Open `/admin/` (locally: `http://localhost:8789/admin/`; live:
   `https://lintassist.pages.dev/admin/`).
2. Paste in:
   - Worker URL: `https://ux-audit-worker.domain-sparrow.workers.dev`
   - Your admin secret (§4)
3. Use the **Add / Update Subscriber** form: email, a token string you make
   up (convention: `tok_` + random chars), plan (`free`/`starter`/`pro`),
   optional starting `extra_credits`.
4. The **Subscribers** table lists everyone, with a delete action per row.
5. **Add Credits** form bumps `extra_credits` on an existing token (for
   ad-hoc top-ups outside the paid top-up flow).

### Option B — Raw API call (curl)

```bash
curl -X POST https://ux-audit-worker.domain-sparrow.workers.dev/admin/subscribers \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: <your admin secret>" \
  -d '{"token":"tok_yourname01","email":"you@example.com","plan":"pro","extra_credits":0}'
```

Add credits to an existing token:

```bash
curl -X POST https://ux-audit-worker.domain-sparrow.workers.dev/admin/add-credits \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: <your admin secret>" \
  -d '{"token":"tok_yourname01","credits":25}'
```

List everyone (returns real tokens/emails — don't paste this output into
a committed file):

```bash
curl https://ux-audit-worker.domain-sparrow.workers.dev/admin/subscribers \
  -H "x-admin-secret: <your admin secret>"
```

### Option C — Direct D1 query (no admin secret needed)

If you have Cloudflare account access (via `wrangler login` / an OAuth
token with D1 scope), you can read/write the `subscribers` table directly
against the Cloudflare API, bypassing the admin secret entirely:

```bash
curl -sS "https://api.cloudflare.com/client/v4/accounts/<account_id>/d1/database/<db_id>/query" \
  -H "Authorization: Bearer <cloudflare oauth token>" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM subscribers;"}'
```

`<account_id>` and `<db_id>` are in `wrangler.toml` (`database_id`) and
`wrangler whoami`. Note: the `wrangler d1 execute` CLI subcommand errored
on an account-token-scope issue when this was last tried — the raw D1 REST
API above worked fine with the same OAuth token, so prefer it if the CLI
acts up.

## 4. The admin secret — what it is, and how to get one

`ADMIN_SECRET` is a Cloudflare Worker **secret** (`wrangler secret put
ADMIN_SECRET`), checked on every `/admin/*` route via the `x-admin-secret`
header. It gates the admin panel and the raw API calls in §3.

**It is write-only.** Once set, there is no way — not the dashboard, not
the API, not the CLI — to read back its plaintext value. If nobody
currently has it written down (password manager, `.env` file, wherever),
it is **gone**, not just hidden.

To get a working admin secret, set a **new** one:

```bash
cd /path/to/uxauditplugin
wrangler secret put ADMIN_SECRET
```

It'll prompt for a value — type/paste anything reasonably long and
random, hit enter. That's your new admin secret from then on. Save it
somewhere durable (a password manager) — losing it means repeating this
step, same as now.

No redeploy needed — Workers read secrets live.

## 5. Cost & usage per user

The admin panel's **Usage & Cost per User** section (backed by `GET
/admin/stats`) shows, per token — including anonymous `free_` trial
tokens, which cost real money too even though they're not in
`subscribers` — total requests, estimated total cost, and a breakdown of
how many requests each engine (Qwen / DeepSeek / Claude) served.

This reads from a `request_log` table (see `migrations/0001_request_log.sql`)
that the worker writes one row to on every successful `/analyze` call:
token, engine, exact model id, input/output token counts, and an
estimated cost computed from `MODEL_PRICING` in `worker-stripe.js`. Cost
is an estimate — pricing is hardcoded and needs manual updates if
OpenRouter/Anthropic pricing changes.

`GET /admin/requests?token=<tok>` returns the last 100 raw log rows for
one token, if you need to see individual requests rather than the
aggregate.

## 6. Checking what tokens currently exist

Run the D1 query from §3C (`SELECT * FROM subscribers;`) any time you need
to see who has a token and what plan/credits they're on — the live
database is the source of truth, not this file. As of 2026-09-13 there was
exactly one subscriber, on the `pro` plan (50 audits/month), with plenty
of unused audits left for that month.
