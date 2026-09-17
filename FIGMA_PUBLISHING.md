# Publishing to the Figma Community

Internal reference (git-only, not deployed). Sourced from Figma's own
current docs on 2026-09-13:
- [Publish plugins to the Figma Community](https://help.figma.com/hc/en-us/articles/360042293394-Publish-plugins-to-the-Figma-Community)
- [Plugin and widget review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines)

## Prerequisites

- **Figma desktop app** (macOS/Windows) — publishing isn't available from
  the browser.
- **Two-factor authentication** enabled on your Figma account.
- The plugin working and tested (`figma-plugin/` in this repo).

## Steps

1. Open any file in the Figma desktop app → Figma menu (top-left) →
   **Plugins → Manage plugins** → find the plugin → **Publish**.
2. **Page 1 — Describe it:**
   - Name, tagline, full description, category (**Design tools** fits).
   - **Must disclose** in the description if the plugin requires a
     separate third-party account or additional payment — ours does
     (a free token from `lintassist.com`, paid tiers coming
     later). A line like *"Requires a free token from
     lintassist.com — some tiers may require payment"* covers it.
3. **Page 2 — Visuals:**
   - Icon: 128×128px.
   - Cover thumbnail: 1920×1080px.
   - Optional: a playground file, up to 9 carousel images/videos.
4. **Page 3 — Data Security (optional):** a security disclosure form;
   Figma notes review can take up to two weeks if submitted. Answers
   for LintAssist's actual behavior are in the "Data Security
   Disclosure" section below — worth submitting since compliant
   answers get shown on the Community page and build trust.
5. **Page 4 — Final details:** publish destination (Community vs. your
   org), publisher identity, support contact, review of the
   network-access labels (see below), pricing (leave free for now).
6. **Submit.** Status shows **"In review."** You can still push updates
   while it's under review. Figma emails a decision to your account
   email — no fixed timeline; if rejected, you can fix and resubmit.

## Things already fixed in this repo to reduce review friction

- **`figma-plugin/manifest.json`** — `networkAccess.allowedDomains` was a
  wildcard (`"*"`), which is exactly the kind of thing review flags.
  Narrowed to the plugin's actual domains: the backend worker,
  `lintassist.com`, Google Fonts, and `ko-fi.com`.

## Still open before submitting

Nothing left in this repo — everything below is ready. What remains is
just running through the actual Publish flow steps above in the Figma
desktop app (name/tagline/description/assets/submit), which only you
can do (it's tied to your Figma account).

## Done

- **Privacy policy** — live at `public/privacy.html`
  (`https://lintassist.com/privacy.html`), linked from both the
  web app footer and the plugin's Settings panel. Covers what's
  collected (email/name on signup, screenshots only for the one
  request, never stored), who it's shared with (OpenRouter/Anthropic
  for the audit itself, Cloudflare for hosting, Stripe once payments
  are live), retention, and how to request deletion.
- **Description copy** (paste into the Publish flow's Page 1):

  **Tagline** (one line):
  > LintAssist — a quick AI second opinion on any Figma frame. Not the final word, just a fast, honest starting point.

  **Description:**
  > LintAssist selects any frame and gives you a structured design check
  > back in seconds — a 0–100 score plus specific, ranked findings
  > (critical/warning/minor) against real frameworks: Nielsen's 10
  > Usability Heuristics, Visual Hierarchy, Gestalt Principles,
  > Typography, Color & Contrast (WCAG), Accessibility, CTA &
  > Conversion, and Mobile Readiness. Each finding comes with a concrete
  > recommendation, not vague feedback — and the full report can be
  > placed directly onto your canvas next to the frame it's about.
  >
  > This is a peer review, not a verdict: fast, suggestive feedback to
  > use with your own judgment — not a substitute for a real design or
  > accessibility review.
  >
  > Free to try: 2 audits with no signup, then 5 more every day with
  > just an email (no password) — get a token at lintassist.com.
  > The same token also works on the web app, for anything you can
  > screenshot, not just Figma frames. Paid monthly plans are coming
  > soon for heavier use.
  >
  > Nothing is stored: your screenshot is sent for that one analysis and
  > never kept — copy or place the report before you navigate away.
  > Privacy policy: lintassist.com/privacy.html

  (Once a real custom domain like lintassist.com is actually registered
  and live, swap it in here and in manifest.json/the plugin's links —
  until then, use lintassist.com everywhere; it's the only one
  that currently resolves.)

  This description already includes the third-party-account/payment
  disclosure the review guidelines require.
- **Icon (128×128)** — `figma-plugin/assets/icon-128.png`, downsized
  cleanly from a 28160×28160 source image you made yourself.
- **Cover thumbnail (1920×1080)** — `figma-plugin/assets/cover-1920x1080.png`
  and `figma-plugin/assets/lintassist-cover.png` (same image, two
  filenames). This is the updated LintAssist-branded showcase slide —
  logo, tagline ("Better interfaces, faster."), feature icons, and
  real plugin screenshots. It was originally exported at 1672×941; since
  that's the same aspect ratio as 1920×1080, it was cleanly upscaled
  with no cropping or visible distortion to match Figma's exact
  required dimensions.

## Data Security Disclosure — recommended answers

Figma's Page 3 form ("Share how your plugin handles data"). Check **"I
agree to share this information"** — compliant answers get shown on
the Community listing, which builds trust rather than costing you
anything. Answers below are based on exactly what LintAssist's code
actually does, not a generic template.

**1. Do you host a backend service for your plugin/widget?**
→ **"Yes, and data read/derived from Figma's plugin API is sent to
this backend."**
The plugin exports the selected frame as an image (via Figma's
`exportAsync`, plugin-API-derived) and sends it to our own backend
(`ux-audit-worker`) for analysis. That's Figma-derived data going to a
backend we host, which is exactly this option — not the second one
("but doesn't send...").

This reveals two follow-up fields:

- **"Do you have a publicly documented process for managing security
  vulnerabilities...?"** →
  > As an independent, solo-developer project, security issues can be
  > reported via GitHub's private vulnerability reporting at
  > github.com/appsparrow/lintassist/security, or by opening a GitHub
  > issue at github.com/appsparrow/lintassist/issues. See SECURITY.md
  > in the repository for the full policy. Reports are acknowledged
  > and addressed promptly.

  (Both the repo and this feature are live — the repo was made public
  and GitHub's private vulnerability reporting was enabled specifically
  so this answer is backed by something real, not just a sentence.)

- **"Are you accredited to any relevant security standards...?"** →
  > Not accredited to any formal security standards (SOC 2, PCI DSS,
  > HITRUST, ISO 27001, SSAE 18) — this is an independent,
  > solo-developer project.

**2. Does your plugin/widget make any network requests with services
you do not host? Select all that apply.**
→ Check **"makes network requests for static assets eg. fonts,
images. None of these requests include data read/derived from Figma's
plugin API"** (Google Fonts, loaded in the UI).
→ Also check **"not captured by the above"** and describe: *"Opens
ko-fi.com (optional tip link) and lintassist.com (get a
token/pricing) in the user's browser as external links — no Figma
frame data or plugin-API data is included in either."*
→ Do NOT check "does not make any network requests" (it does — fonts
at minimum) or "analytics tools" (no Mixpanel/Sentry/etc. — genuinely
none).

**3. Does your plugin/widget use any user authentication?**
→ **"Yes, my plugin/widget has user authentication that is handled via
a site that I host."**
There's no login screen or third-party identity provider (no Auth0, no
"Log in with Google") — but the token/email-based access system
(`POST /access`, `GET /status`) is a real, self-hosted access-gating
mechanism, so "no authentication at all" would understate it. This is
the most honest of the three options, even though it's lightweight
(a bearer token, not a full identity/login flow).

**4. Do you store any data read/derived from Figma's plugin API?
Select all that apply.**
→ **"No, my plugin/widget does not store any data read/derived from
Figma's plugin API."**
The frame name and image are used transiently for one request (sent to
the AI provider, or placed back as a new frame in the *user's own*
file) and never persisted in our systems. What *is* stored via
`figma.clientStorage` (the token, the free-use counter, an anonymous
ID) are values LintAssist itself generates and issues — not data read
from Figma's API — so this doesn't count against that option.

**5. How do you manage updates to your plugin/widget?**
→ **"I am a solo developer. I manage and update my plugin/widget
myself."**
Matches reality; switch this if that changes.

## The Ko-fi tip link — is it allowed?

Yes. Figma's own review guidelines: *"We allow plugins and widgets to
direct users to a third party to allow for monetization, but we reserve
the right to reject plugins and widgets that attempt to monetize in poor
taste."* A quiet, optional, clearly-labeled tip link (no functionality
gated behind it) is squarely inside that allowance — it's the same
pattern many published plugins already use, just lower-key. Kept as a
direct link in the plugin's settings panel rather than redirecting to
the web app first; no policy reason to add the extra click.
