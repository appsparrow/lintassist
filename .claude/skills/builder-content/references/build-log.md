# Build log page / presentation deck

A visual, interactive story of how the project was built. Base: `assets/build-log-template.html` (a single self-contained, keyboard-driven slide deck with scroll-reveal animation, mobile layout and a floating nav).

## Slide arc (about 10 slides, 8–10 minutes)
1. **Title.** A short claim (three beats, e.g. "Notice. Decide. Ship."), the surfaces that are live, and a begin button.
2. **The observation.** The gap seen from inside real work, with 2–3 quoted pain points drawn from the project's design/PRD docs.
3. **The pivot chain.** Each pivot as *I saw / I decided / It unlocked*. Pull the pivots from git history and the user's account. Include the one that was unplanned.
4. **Quality as a loop.** How the builder reviewed their own work and carried the standard forward.
5. **The operating model.** AI vs human split (use the user's own estimate, phrased as "roughly"), with lanes: product, design, engineering, quality, go-to-market, operations. Each lane: *AI carried / I decided*.
6. **Hiccups.** Two real stories: one wall that became architecture, one judgment call (something held back or cut).
7. **What exists today.** Real facts only (surfaces live, backend, access model, what is never stored). **Do not include a metric that isn't tracked.** Use guarantees and facts instead of invented numbers.
8. **What's next.** The next capability and 2–3 bets (mark them as proposed if the user hasn't confirmed).
9. **The playbook.** 6 repeatable moves another team could run.
10. **The point of view.** Closing thought. Not an ask. A stance (for example "anyone can build; the thinking decides the outcome").

## How to adapt the template
- Replace copy only; keep the structure, animation, keyboard controls and mobile behaviour.
- Colors: derive from the project's design tokens if it has them; otherwise keep the template palette.
- Controls: arrows, progress, counter, menu. No timer, no speaker notes.
- Mobile: nav hides until the slide is scrolled to its end; swipe changes slide.
- Check text sizes stay at 11px or above and contrast stays readable.

## Delivery
- Save to `docs/content/` first. Only move into the deployed folder (for example `public/`) and deploy when the user asks for it to go live.
- If it will be public, add `noindex` unless the user wants it indexed.
