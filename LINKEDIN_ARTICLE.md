# I built LintAssist in my spare time — a quick, no-nonsense AI design check. Here's the whole thing, as a designer, a builder, an AI generalist, and a PM.

Every week I see more interfaces that were *generated* — by Figma, by v0,
by Lovable, by a prompt. Fewer of them get *reviewed*. Not because people
don't care, but because a proper design review takes a person, a
calendar invite, and goodwill you don't want to spend on a first draft.

So I built **LintAssist**: paste a screenshot, or select a frame in
Figma, and get back a structured UX audit — a 0–100 score, and a ranked
list of specific findings against real frameworks (Nielsen's heuristics,
WCAG contrast, Gestalt principles, mobile readiness) instead of "looks
good to me." Review it, learn from it, fix it yourself. Nothing is
stored — it's a mirror, not a database.

Here's how it actually came together, from four angles.

## As a designer: the thing I actually wanted

I didn't want another dashboard. I wanted the blunt, specific feedback a
senior designer gives you in five minutes: *this CTA has no contrast,
this hierarchy is fighting itself, this won't pass a screen reader.* Not
vibes — a checklist, a score, a reason.

That shaped the whole product surface: no onboarding tour, no empty
states to configure. Drop an image in, pick which frameworks matter to
you (accessibility? conversion? all eight?), get a report you can
actually act on or hand to a client. The Figma plugin exists for the
exact same reason a linter lives in your editor instead of a separate
app — the feedback should show up where the work already is.

## As a product builder: the free → email → pro funnel

Nobody signs up for something they haven't tried. So the funnel is
deliberately soft:

1. **Zero friction**: 2 audits, anonymously, no signup. Try it before you
   trust it.
2. **One field**: after that, just an email — no password — gets you 5
   more audits *every day*. Daily, not monthly, on purpose: it's not
   just generosity, it's the honest way to see real usage patterns and
   start a mailing list before a single subscription exists.
3. **Pro, when it's ready**: paid monthly tiers are fully built —
   pricing, plan cards, the works — and deliberately hidden right now
   rather than shown half-working. I'd rather ship the free layer solid
   and turn on payment when it's actually real, than show a "Subscribe"
   button that quietly fails.

That middle step is the one people skip. It's tempting to go straight
from "free forever" to "pay us," but the email step is where you learn
who's actually using the thing, at a cost so low it's barely worth
gatekeeping (more on that below).

## As an AI generalist: the model doesn't matter, the pipeline does

Here's the part I'd tell any builder shipping an AI feature: **don't
marry one model.**

Every audit tries the cheapest capable vision model first, falls back to
the next, and only reaches for a frontier model if both fail — entirely
server-side, invisible to the product. Concretely: a screenshot audit
that costs **~$0.019 on a frontier model costs ~$0.001 on the cheap
tier** — roughly a **15–20x** difference, for output that's good enough
for this job. That's the difference between "$10 covers 500 audits" and
"$10 covers 8,000."

The build itself is a fallback chain with logging, not a single API
call: try the cheap model, log why it failed if it did, fall through,
and always land somewhere that answers. A tiny, almost-invisible marker
in the footer (`· Q`, `· D`, `· C`) shows which engine actually served
each result — because "it worked" isn't enough once you're paying
attention to cost; you want to *see* the routing decision, not just
trust it happened.

The lesson generalizes past this project: the model is a swappable part.
The part worth engineering carefully is the routing, the fallback, and
the visibility into which one ran.

## As a PM: what "keep it simple" actually cost

The most honest part of this build was the access-model decision, and it
took several passes to get right — which is normal, not a failure.

The first draft was an anti-abuse system: signup caps, per-IP rate
limits, disposable-email blocking, a kill switch — all admin-configurable,
because free signups can't verify a real email and someone will try to
farm them. That's still in there, and it matters. But partway through, the
actual question surfaced: *at $0.001 a request, is this a cost problem or
a vibe problem?* It's a vibe problem — I don't want unlimited noise, but
I'm not actually worried about the bill.

So the limit settled on 5 audits a day per email, adjustable from an
admin panel with no redeploy — not because the number is sacred, but
because **the right number is a business decision, not a code
constant**, and it should be changeable in ten seconds when the answer
changes. We went from 2/month, to 50/month, to 5/day, in the same
afternoon, talking it through in real time. That's what a PM's job
actually looks like day to day: not getting it right the first time, but
building the thing so getting it wrong is cheap to fix.

## How the admin side is built — and why it's boring on purpose

The admin panel is a single static HTML page, not linked from the
product, gated by a secret header. No login flow, no framework, no
build step — just enough to see what's happening: every signup, every
audit's estimated cost broken down by which AI engine served it, and
the same abuse-control knobs mentioned above, live-editable.

One deliberate choice: usage and cost aren't a separate report you have
to cross-reference — they're columns on the same subscriber table,
click a row to expand the detail. The best internal tool is the one
that doesn't make you open two tabs to answer one question.

## What's next

Real Stripe checkout, so "coming soon" becomes real. Possibly a
no-strings "buy me a coffee" — not for credits, not gated to anything,
just a way for someone who liked using it to say so. And more usage data
from the 5-a-day free tier to decide what a fair paid tier actually
looks like, instead of guessing.

If you build things — designer, generalist, PM, or all three depending
on the day — I'd genuinely like to hear how you've drawn these same
lines: free vs. paid, cheap model vs. frontier model, "configurable"
vs. "just ship the constant." None of it is obvious in advance. Most of
it gets figured out exactly like this did — in the middle of building
it.

*Try it: [lintassist.pages.dev](https://lintassist.pages.dev)*
