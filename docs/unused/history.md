# History — From "check my Figma frame" to LintAssist

How this product went from a rough local tool to a live, publicly-deployed
web app + Figma plugin with a real backend, a cost-optimized AI pipeline,
and an admin console. Written from the actual git history of both repos
involved (`uxauditplugin` — the original, still deployed at
`designaudit.pages.dev` — and `lintassist`, the current canonical repo at
`lintassist.com`) plus the build sessions themselves. Dates are commit
dates, not memory.

## 0. Before this build log starts (2026-03-05)

The original tool already existed as a working prototype — a static web
app that sent a screenshot to Claude and got back a structured UX report.
`uxauditplugin`'s first four commits (`e4e9284` → `2dd8842`, all
2026-03-05) show it already had the core shape: upload a screenshot,
call an AI model, render a scored report. It sat mostly untouched for
over six months.

## 1. Getting it running again, and the first real bug (2026-09-12)

Picking the project back up started with just trying to run it locally
— and immediately hitting a wall: every real analysis returned
`[object Object]` instead of a report. The root cause was a hardcoded,
retired model ID (`claude-sonnet-4-20250514`); Anthropic's API returned
a structured error object for it, and `new Error(data.error)` stringified
that badly instead of showing the real message.

Fixing that surfaced a second, unrelated confusion: the code being
edited locally (`uxaudit`, no git repo at all) wasn't the same folder
that had just been pushed to GitHub and deployed (`uxauditplugin`, a
real repo). Once that was sorted out, the actual deploy could be
debugged: Cloudflare Pages was failing because the project had no
`package.json` for its configured build step, and once that was added,
because the build output landed in `public/` while Pages expected
`dist/`. Both fixed same day (`356c3ec`, `c6fcb68`).

That same day also brought the first real design pass — moving off a
"Claude-branded" look (cream background, serif italic headlines) toward
the Apple-inspired neutral/white aesthetic the product still uses today
(`5addff2`).

## 2. Making AI inference actually affordable (2026-09-13)

Running every audit through Claude directly worked, but wasn't
sustainable at any real free-tier volume. `eafa9b3` introduced the
architecture that's still in place: a **multi-provider fallback chain**
— try Qwen3-VL-32B first, then DeepSeek V4.1 Flash, and only fall back
to Claude Sonnet if both fail — all server-side, so neither the web app
nor the Figma plugin know or care which model actually answered. This
cut the effective cost per audit roughly 15–23x versus Claude alone,
which is what made a generous free tier possible at all.

The admin panel (new this same day, `d211eaa`) got a subtle marker
(`· Q` / `· D` / `· C`) next to each report showing which engine served
it, plus per-user request counts and estimated cost — visibility without
gatekeeping. `092b619` brought the Figma plugin's UI up to match the
redesigned web app, including that same engine marker.

## 3. The pricing model, worked out in public (2026-09-13)

This is the part that visibly iterated the most in a single day. The
free-tier question — *how do we let people try this without giving away
unlimited inference, and without over-engineering it* — went through
several shapes before landing:

1. Start simple: 2 free audits total, no signup (`7bbafdf`,
   `66058db` — "lead with free access; mark paid plans as coming soon").
2. Add a real self-serve signup path once 2 free audits ran out
   (`12cde95` — `POST /access`, token by email, no password).
3. Worry about abuse: fake emails, Gmail aliases, bots minting unlimited
   free accounts. Rather than hardcode a fixed answer, `7e19065` built
   the guardrails as **admin-configurable settings** — a disposable-email
   blocklist, Gmail alias normalization, a per-IP daily signup cap, a
   global daily signup cap, and a kill switch — all live-editable from
   the admin panel, no redeploy needed, because the actual thresholds
   were still an open business question.
4. Settle the free-tier shape itself. It moved from "2/month" to ideas
   like "5/day + a coffee unlocks 50" before landing on the final,
   simpler version in `bb76dcf`: **5 audits/day, resetting daily**,
   granted the moment someone gives an email — deliberately daily rather
   than monthly, both to bring people back more often and because the
   email-collection itself was treated as a goal, not just a limiter.
5. Add the Ko-fi tip link (`acfa887`) — explicitly **no credits or perks
   attached**, just an optional way for someone who liked the tool to
   say thanks.

By the end of the day, paid plans were coded and visible in the UI but
deliberately hidden (`35a29b6`) pending a real Stripe integration —
the free/email-signup flow was the actual live product.

## 4. Publishing prep and content (2026-09-13 → 09-14)

With the product itself stable, the next arc was getting it in front of
people: a Figma Community publishing guide grounded in Figma's actual
current docs (`fa3f4d0`), a real privacy policy page (`8de03a4`), and
final submission assets — a 128×128 icon and a 1920×1080 cover image,
both derived from the founder's own artwork (`5d76eaa`).

## 5. The rebrand: LintAssist (2026-09-16)

The product had been living under a placeholder name ("Design Audit" /
"UX Audit") the whole time. Once its actual purpose was clear — a fast,
opinionated peer-review pass, not a final verdict — it was renamed
**LintAssist** everywhere in one sweep: manifest, plugin UI, web app,
docs, D1-adjacent naming, `clientStorage` keys (`da_*` → `la_*`), the
placed-report frame name in Figma, all of it (`7f34d3d` in
`uxauditplugin`, then carried into the fresh `lintassist` repo).

The rebrand came with a second, harder decision: instead of continuing
to iterate in `uxauditplugin`, the code was duplicated into a brand-new
folder, a new GitHub repo, and a new Cloudflare Pages project — all
named `lintassist` — becoming the canonical home going forward. Both
projects still share the same backend Worker and the same D1 database;
`uxauditplugin` / `designaudit.pages.dev` was left running but frozen.

The same day: an "Est. AI Cost" tile was added to the admin dashboard
(`7326546`), and the web app picked up its current visual signature — a
soft grey backdrop with a barely-there four-color gradient wash behind
an elevated white card (`75a3ed5`).

## 6. Domain, security posture, and Figma review readiness (2026-09-16)

The last stretch was about making the public-facing details actually
correct instead of placeholder:

- The canonical domain moved twice: first to `lintassist.pages.dev`
  once that Pages project existed (`f41cb9a`), then to the real
  registered domain, `lintassist.com`, once it was actually live —
  swept across the manifest, the plugin's network-access list, the web
  app, and every doc that referenced the old domain (`646e2da`).
- `SECURITY.md` was added and GitHub's private vulnerability reporting
  was enabled on the (newly public) repo, specifically so the answer
  given in Figma's Data Security disclosure form would be backed by
  something real rather than a sentence with nothing behind it
  (`041c0b0`, `7e5baf4`, `b91f64a`).
- A couple of small but real polish fixes: the placed Figma report frame
  said "📊 Audit" instead of "🔍 LintAssist" (`f41cb9a`), and the
  plugin's header showed the LintAssist wordmark twice — once as the
  logo, once as a redundant label — fixed by replacing the second one
  with a one-line tagline instead (`18292af`):

  > A quick AI second opinion on any Figma frame. Not the final word,
  > just a fast, honest starting point.

## Where things stand today

- **Live**: `lintassist.com` (canonical) and `lintassist.pages.dev`,
  both on Cloudflare Pages, both talking to the same
  `ux-audit-worker` Cloudflare Worker and `ux-audit-db` D1 database.
  The older `designaudit.pages.dev` (from `uxauditplugin`) still
  resolves on the same backend but is frozen — not edited further.
- **Access model**: 2 anonymous audits, then 5/day free with just an
  email (no password, no verification — abuse-guarded instead). Paid
  monthly plans exist in code and UI but are hidden pending a real
  Stripe integration (see `stripe-setup.md`).
- **AI pipeline**: Qwen3-VL → DeepSeek → Claude Sonnet 5 fallback chain
  via OpenRouter, ~15–23x cheaper per audit than calling Claude alone,
  fully transparent to both frontends.
- **Figma plugin**: submitted to the Figma Community, status "In
  review" as of this writing; can still be updated while under review.
- **Repo**: `appsparrow/lintassist`, public, with GitHub private
  vulnerability reporting enabled.

## What's genuinely still open

Kept here so it doesn't get lost between sessions — none of this is
urgent, none of it blocks the current live product:

- Real Stripe products/prices/webhook aren't live yet — `STRIPE_PRICE_MAP`
  and the Payment Link placeholders in `worker-stripe.js` / `index.html`
  / `ui.html` are still test values (see `stripe-setup.md`).
- No backup strategy for the D1 database beyond Cloudflare's own
  durability, no uptime/error alerting, and no funnel analytics
  (signup → first audit → repeat use) — all fine at current scale, all
  worth revisiting if usage grows.
- `CONTENT_STRATEGY.md` and `MARKETING_PLAN.md` are ideation drafts,
  written before most of this history happened — treat them as a
  starting point for launch content, not a record of what's shipped.
