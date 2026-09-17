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
     (a free token from `lintassist.pages.dev`, paid tiers coming
     later). A line like *"Requires a free token from
     lintassist.pages.dev — some tiers may require payment"* covers it.
3. **Page 2 — Visuals:**
   - Icon: 128×128px.
   - Cover thumbnail: 1920×1080px.
   - Optional: a playground file, up to 9 carousel images/videos.
4. **Page 3 — Data Security (optional):** a security disclosure form;
   Figma notes review can take up to two weeks if submitted.
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
  `lintassist.pages.dev`, Google Fonts, and `ko-fi.com`.

## Still open before submitting

Nothing left in this repo — everything below is ready. What remains is
just running through the actual Publish flow steps above in the Figma
desktop app (name/tagline/description/assets/submit), which only you
can do (it's tied to your Figma account).

## Done

- **Privacy policy** — live at `public/privacy.html`
  (`https://lintassist.pages.dev/privacy.html`), linked from both the
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
  > just an email (no password) — get a token at lintassist.pages.dev.
  > The same token also works on the web app, for anything you can
  > screenshot, not just Figma frames. Paid monthly plans are coming
  > soon for heavier use.
  >
  > Nothing is stored: your screenshot is sent for that one analysis and
  > never kept — copy or place the report before you navigate away.
  > Privacy policy: lintassist.pages.dev/privacy.html

  This description already includes the third-party-account/payment
  disclosure the review guidelines require.
- **Icon (128×128) and cover thumbnail (1920×1080)** — in
  `figma-plugin/assets/icon-128.png` and
  `figma-plugin/assets/cover-1920x1080.png`. Both come from images you
  made yourself (`uxauditplugin.png` — a 28160×28160 source, downsized
  cleanly to 128px — and `uxauditplugin-screen.png`, which was already
  exactly 1920×1080). Claude's image-generation tool wasn't available
  (needs a premium Magnific account) to offer AI-generated
  alternatives, but your existing assets didn't need them — the icon
  reads clearly at small size and the cover is a strong showcase slide
  as-is.

## The Ko-fi tip link — is it allowed?

Yes. Figma's own review guidelines: *"We allow plugins and widgets to
direct users to a third party to allow for monetization, but we reserve
the right to reject plugins and widgets that attempt to monetize in poor
taste."* A quiet, optional, clearly-labeled tip link (no functionality
gated behind it) is squarely inside that allowance — it's the same
pattern many published plugins already use, just lower-key. Kept as a
direct link in the plugin's settings panel rather than redirecting to
the web app first; no policy reason to add the extra click.
