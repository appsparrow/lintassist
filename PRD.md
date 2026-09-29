# Product Requirements Document (PRD) — LintAssist

## 1. The idea, simply

People are generating UI faster than ever — with Figma, with v0/Lovable/Bolt,
with a screenshot from a live site they want to improve. What's missing is a
fast, unbiased second opinion: *is this any good, and specifically why not?*

**LintAssist** takes a screenshot (upload it, drag it in, or select a Figma
frame) and returns a structured UX audit — a 0–100 score plus a ranked list
of findings (critical/warning/minor/pass) with a concrete fix for each,
evaluated against real frameworks (Nielsen's heuristics, WCAG contrast,
Gestalt principles, mobile readiness, etc.) instead of vague "looks nice"
feedback. Review, learn, fix it yourself. Nothing is stored — it's a mirror,
not a database.

It ships as two surfaces reading the same backend: a **web app**
(`lintassist.com`) for anything you can screenshot, and a **Figma
plugin** for auditing a frame without leaving the canvas.

## Release history

### v1.0.1 — Current update

- Focused default audit selection on Nielsen's Heuristics, Gestalt, and
  Accessibility so a new audit starts with the highest-signal checks.
- Added a compact contextual support carousel to the web app and Figma
  plugin. It explains the problem LintAssist is helping with before
  offering an optional Ko-fi support link.
- Added a persistent Figma footer with links to the web app, release notes,
  and privacy policy.
- Added the release-notes page at `/releases.html` and recorded v1.0.0 as
  the previous published release.

### v1.0.0 — First published release

- Launched the web app and Figma plugin with shared audit behavior.
- Added screenshot and Figma-frame analysis with a 0–100 score, ranked
  findings, and concrete recommendations.
- Added the anonymous trial, email-based free access, shared tokens, and
  the Figma canvas report placement flow.
- Added the multi-provider AI fallback pipeline, privacy policy, admin
  visibility, and Figma Community publishing preparation.

## 2. Target Audience
- **UI/UX Designers**: an unbiased second pass before a design review.
- **"Vibe coders" / AI-generated UI**: you asked an AI tool to build a
  screen — is it actually usable, or just plausible-looking?
- **Product Managers**: a quick accessibility/UX sanity check before
  development handoff, without waiting on a design review cycle.
- **Agencies and Freelancers**: a quantitative, professional-looking audit
  to hand a client alongside subjective feedback.

## 3. Key Features
- **Two ways in**: upload/drag a screenshot on the web, or select a frame
  directly in Figma — same audit engine, same report shape, either way.
- **AI-Powered Evaluation** across 8 toggleable frameworks: Nielsen's
  Heuristics, Visual Hierarchy & Layout, Gestalt Principles, Typography,
  Color & Contrast (WCAG), Accessibility, CTA & Conversion, Mobile
  Readiness.
- **Structured Reporting**: a 0–100 UX Score, an executive summary, and
  8–14 findings, each tagged by severity with a specific recommendation —
  copyable as a report, or paste-able onto the Figma canvas as its own
  frame.
- **Cost-optimized, multi-provider AI**: every audit tries a cheap
  vision-language model first (Qwen3-VL, then DeepSeek — roughly 15–20x
  cheaper per audit than a frontier model) and falls back to Claude only
  if both fail, entirely server-side — neither surface knows or cares
  which model actually answered. A subtle, low-opacity marker
  (`· Q`/`· D`/`· C`) shows which one served each result.
- **Access model, deliberately simple while pre-launch**: 2 anonymous
  audits with zero friction (no signup) → enter your name + email for
  5/day, resetting daily, no password (same email recovers access on
  any device, idempotently — a repeat signup hands back the *same*
  token rather than minting a new one). The token is shown on-screen
  with a copy button on every successful signup (new or returning), so
  it can be pasted straight into the Figma plugin. Name and email are
  both required client- and server-side, so the admin subscriber list
  never has blank names. Paid monthly plans exist in the product and
  pricing but are currently hidden pending a real Stripe integration;
  the pricing panel presents this as an explicit three-tier ladder
  (no email → email → unlimited/coming soon) rather than a single
  paragraph.
- **Contextual support prompt**: registered users see a small three-message
  carousel after an audit. It first names a problem LintAssist helps with
  (what to fix first, getting a second pair of eyes, or preparing a
  handoff), then offers an optional Ko-fi support link. The pricing panel
  presents access plainly: **Try** (2 free, no email) → **Free** (5/day,
  email required) → optional support with a +50-audit thank-you.
- **Ko-fi donations self-serve a bonus-token pack**: `POST
  /webhook/kofi` verifies Ko-fi's shared secret, matches the donor by
  email (idempotent — same shape as `/access`), and grants 50 bonus
  audits, creating an account if the donor's email is new. Those bonus
  credits are a real depleting pool: consumed only once someone's own
  period allowance runs out, so a single coffee doesn't silently
  re-inflate the daily free limit forever (this fixed the same latent
  issue in the older Stripe top-up, which is now a proper one-time pack
  too — no schema change needed, just corrected consumption order).
- **No data retention**: screenshots and reports are never stored
  server-side — the product explicitly tells users to save/copy what
  they want to keep before navigating away.
- **Admin visibility, not gatekeeping**: an internal dashboard shows every
  signup (including anonymous-trial cost), per-user request count and
  estimated spend broken down by which AI engine served it, and
  live-adjustable anti-abuse controls (a kill switch, a per-IP signup
  cap, a global daily signup cap) that need no redeploy to change.

## 4. Technical Architecture
- **Web app** (`public/index.html`): a single static HTML file — no
  build step, no framework — talking directly to the Worker API.
- **Figma plugin**:
  - `manifest.json` — plugin metadata and network access.
  - `code.js` — runs in the Figma sandbox: canvas interaction, frame
    export to Base64, rendering the report as a frame on the canvas.
  - `ui.html` — the plugin's UI iframe, functionally and visually
    matched to the web app. It includes the shared framework defaults,
    contextual support carousel, and a footer linking to the web app,
    release notes, privacy policy, version, and creator.
- **Backend** (`worker-stripe.js`, Cloudflare Workers):
  - `POST /analyze` — the audit call. Tries OpenRouter (Qwen, then
    DeepSeek), falls back to Anthropic directly if both fail or
    OpenRouter isn't configured; normalizes every provider's response
    back to one shape so the frontend never needs to know which one
    answered. Logs model, token counts, and estimated cost per request.
  - `POST /access` — self-serve free-tier signup by email (no
    verification possible, so it's capped, rate-limited, and
    disposable-domain/Gmail-alias guarded — see §5).
  - `GET /status` — token validity + remaining usage this period.
  - `GET/POST /admin/*` — subscriber management, usage/cost stats, and
    the abuse-control settings, gated by an admin secret header.
  - `POST /webhook/stripe` — coded and ready for real subscriptions
    (`checkout.session.completed`, `customer.subscription.deleted`);
    not yet wired to live Stripe Payment Links.
  - `POST /webhook/kofi` — live. Verifies Ko-fi's `verification_token`
    (a Worker secret), grants the 50-audit bonus pack on any one-time
    donation (memberships/shop orders are accepted by Ko-fi but don't
    trigger anything yet), matched/created by email. Deduped by
    `kofi_transaction_id` against `kofi_donations` (a retried webhook
    delivery — Ko-fi resends on a non-200 — can't double-grant).
- **Database** (Cloudflare D1):
  - `subscribers` — token, email, name, plan, extra credits.
  - `usage` — per-token audit counts, keyed by a period (day for free,
    month for paid) rather than always monthly.
  - `request_log` — one row per audit: which engine/model served it,
    input/output tokens, estimated cost — powers the admin cost view.
  - `settings` — plain key/value store the admin panel reads/writes for
    the abuse controls, no deploy required to change them.
  - `signup_ip_log` — per-IP, per-day signup counts backing the rate limit.
  - `kofi_donations` — one row per donation (email, amount, currency,
    Ko-fi transaction id), the only place a real dollar figure is
    recorded — powers the Reports tab's totals.
- **Admin panel** (`public/admin/index.html`): a single static page (not
  linked from the product, URL kept private) that talks to the same
  Worker with an admin secret. Organized as a left-nav with four
  sections rather than one long scroll:
  - **Overview** — registered-subscriber counts, Ko-fi supporter count,
    total requests/cost across *everyone* (registered + anonymous
    trial), and a model-usage breakdown (Qwen/DeepSeek/Claude). No MRR
    figure — there are no live paid subscriptions yet, so a dollar
    number there would be fiction.
  - **Subscribers** — real, registered (by email) accounts only, with
    filter chips (All/Free/Has Bonus ☕), a Name column, and sortable
    Email/Created headers (latest-first by default). Manual "create
    subscriber" / "add credits" tools are tucked behind a collapsed
    "+ Manually grant access" toggle, since normal signups now happen
    automatically via `/access` or the Ko-fi webhook — this is a
    support-only escape hatch, not a primary workflow.
  - **Trial Usage** — anonymous `free_` trial tokens are single-use (2
    audits, then dead) and were previously listed as individual rows
    with nothing actionable in them. Replaced with an aggregate-only
    view: total trial tokens seen, total requests, requests in the last
    7 days, the most recent trial request's timestamp, total cost, and
    the model breakdown for trial traffic specifically.
  - **Reports** — a plain-English summary line (total registered users,
    Ko-fi supporter count, total $ donated across N donations), a
    30-day line chart (Trial / Free / Ko-fi Bonus request volume, one
    color each, plain inline SVG — no charting dependency), and a raw
    Ko-fi donations log (email, amount, date). Backed by two new
    endpoints: `GET /admin/timeline` (daily request counts bucketed by
    each user's *current* plan state — a trend signal, not historical
    accounting) and `GET /admin/kofi-donations` (reads the new
    `kofi_donations` table — see §4 database and the Ko-fi webhook
    entry above).
  - **Settings** — the free-signup abuse controls, unchanged.

  A connection-failure message is protocol-aware: the "serve this over a
  local server" instructions only show when actually opened via
  `file://` — everywhere else (e.g. `lintassist.com/admin/` on another
  device) it shows the real cause instead (bad Worker URL, worker not
  deployed, network/extension blocking the request).
- **Local development**: `npm run dev` serves `public/` on
  `localhost:8080` (no build step needed — it's static); `npm run
  dev:worker` runs the Worker locally via `wrangler dev` when the API
  itself needs testing.

## 5. Security, Privacy & Abuse Controls
- API keys (Anthropic, OpenRouter, Stripe, the admin secret) are
  Cloudflare Worker secrets — never in code, never in the client.
- Screenshots are sent as Base64 over HTTPS directly to the model
  provider for that one request and are not persisted anywhere.
- The free-signup endpoint can't verify an email is real, so it doesn't
  try to — instead: disposable-email domains are blocklisted, Gmail
  dot/plus aliases collapse to one signup, and both a per-IP and a
  global daily cap on *new* signups exist (returning users are never
  capped). All three are adjustable live from the admin panel.
- PII stored is limited to email + first/last name for signups, with no
  password (access is by token or by re-entering the same email).
