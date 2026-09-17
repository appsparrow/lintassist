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
(`designaudit.pages.dev`) for anything you can screenshot, and a **Figma
plugin** for auditing a frame without leaving the canvas.

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
  audits with zero friction (no signup) → enter an email for 5/day,
  resetting daily, no password (same email recovers access on any
  device) → paid monthly plans exist in the product and pricing but are
  currently hidden pending a real Stripe integration.
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
    matched to the web app.
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
- **Database** (Cloudflare D1):
  - `subscribers` — token, email, name, plan, extra credits.
  - `usage` — per-token audit counts, keyed by a period (day for free,
    month for paid) rather than always monthly.
  - `request_log` — one row per audit: which engine/model served it,
    input/output tokens, estimated cost — powers the admin cost view.
  - `settings` — plain key/value store the admin panel reads/writes for
    the abuse controls, no deploy required to change them.
  - `signup_ip_log` — per-IP, per-day signup counts backing the rate limit.
- **Admin panel** (`public/admin/index.html`): a single static page (not
  linked from the product, URL kept private) that talks to the same
  Worker with an admin secret. One merged, click-to-expand subscriber
  table (not two separate views) rather than a maze of screens.

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
