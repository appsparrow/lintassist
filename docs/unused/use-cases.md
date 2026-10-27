# Use Cases — LintAssist

Reflects the product as it actually runs today (see `PRD.md` for full
architecture). Paid plans exist in code but are hidden pending a live
Stripe integration — see `PRE_RELEASE_CHECKLIST.md`.

## Use Case 1: First-Time User Trial (Figma)

**Actor**: A designer trying the plugin for the first time.

1. Designer opens "LintAssist" in Figma's Plugins menu, selects a frame,
   clicks Analyze.
2. No token is saved yet, so the plugin uses a synthetic anonymous
   `free_<id>` counter (client-side, capped at 2 audits — no signup, no
   server-side row).
3. The frame is exported and sent to the backend, which tries Qwen3-VL
   first, then DeepSeek, then falls back to Claude Sonnet 5 if both
   fail — transparent to the plugin either way.
4. The report is placed as a new frame on the canvas (🔍 LintAssist —
   `<frame name>`), and the UI shows "1 audit remaining."

## Use Case 2: Free Email Signup After the Anonymous Trial

**Actor**: A designer who's used both anonymous audits.

1. On the 3rd attempt, the plugin/web app shows a paywall explaining
   the anonymous trial is used up, with a small form (first name, last
   name, email — no password).
2. Submitting calls `POST /access`; the backend runs the abuse guards
   (disposable-email blocklist, Gmail alias normalization, per-IP and
   global daily signup caps) and, if they pass, returns a real token
   good for **5 audits/day**, resetting daily.
3. The same call is idempotent by email — entering the same email again
   later (e.g. on another device) returns the same token instead of a
   fresh grant, so it doubles as a passwordless login.
4. The token is stored (`figma.clientStorage` in the plugin, browser
   storage on the web), the paywall hides, and the usage strip reflects
   the new 5/day limit.

## Use Case 3: A Senior Designer Reviewing a Junior's Work

**Actor**: A senior designer auditing a specific screen before a review.

1. Selects the frame, optionally toggles which of the 8 frameworks to
   run (Nielsen's Heuristics, Visual Hierarchy, Gestalt, Typography,
   Color & Contrast/WCAG, Accessibility, CTA & Conversion, Mobile
   Readiness).
2. Clicks Analyze; the UI shows lightweight progress states while the
   backend calls out to whichever model answers.
3. Gets back a 0–100 score plus 8–14 ranked findings
   (critical/warning/minor/pass), each with a concrete recommendation —
   placed on canvas next to the frame, or copyable as text.
4. Uses the critical findings (e.g. a WCAG contrast failure) as a
   starting point, not a verdict — exactly the framing in the plugin's
   own tagline: *"a quick AI second opinion... not the final word."*

## Use Case 4: Same Token, Web App Instead of Figma

**Actor**: Someone reviewing a live site or a non-Figma mockup.

1. Has a token already (from either surface — they share the same
   backend) or starts a fresh anonymous trial on `lintassist.com`.
2. Drags in or uploads any screenshot — not limited to Figma frames.
3. Gets the identical report shape and scoring as the plugin.
4. Nothing is stored server-side either way — the app explicitly tells
   the user to save or copy the report before navigating away.

## Use Case 5 (not live yet): Paid Plan Purchase

**Actor**: Someone who wants more than 5 audits/day.

Once Stripe is wired up (see `PRE_RELEASE_CHECKLIST.md`), the intended
flow is: click a paid plan → Stripe Checkout → webhook auto-provisions a
subscriber token → paste it into the app/plugin's token field → `/status`
verifies it and unlocks the higher monthly limit. Coded and ready in
`worker-stripe.js`, but not reachable from the product today — the
pricing cards are hidden and the Payment Link buttons are placeholders.
