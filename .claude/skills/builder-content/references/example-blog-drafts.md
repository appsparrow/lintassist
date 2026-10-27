# Blog drafts: from zero to one

Two versions of the same story, plus image prompts for both.

- **Version A — The full story** (names the product; for audiences that should know what was built)
- **Version B — The idea that wouldn't go away** (generic; builds curiosity without revealing the product)
- **Image prompts** (title image + one per section, for both versions)

---

# VERSION A — The full story

## You don't need a title to build a product. You need to be ready to solve problems.

*What I learned taking a side project from a question to three live products, and why it stopped being "just a vibe-coded app" along the way.*

I'm a designer. I did not set out to build a Chrome extension, run a database, or write a webhook. I set out to answer one question that kept coming up while I worked with teams:

**Is there a fast, honest way to get a second opinion on a screen before it goes to review?**

That question turned into LintAssist: a tool that looks at a design and flags where it drifts from basic heuristics, Gestalt principles, hierarchy, contrast and accessibility. It now lives on the web, in Figma and in Chrome. This post isn't about the tool. It's about what it took to get there, because I think the lessons apply to anyone who wants to build: designers, developers, PMs, or anyone working with AI.

### 1. A problem that repeats all week deserves a weekend

The idea didn't arrive in a flash. The same gap showed up again and again during the week: a review where something obvious was missed, a screen that "looked fine" until someone else looked at it. Each time I thought, *someone should build something for this.*

Then the weekend came, and the thought changed from "someone should" to "what if I just tried it for two days?" That shift mattered more than any technical choice. A weekend is long enough to get something real working and short enough that failing costs you almost nothing.

The first Saturday made good progress. Then life happened and the idea went to sleep for weeks. But I kept coming back to it, because it was worth trying out. A tiny tool that helps designers and developers with something they hit in every design review is worth a few weekends. Progress didn't come from one heroic push. It came from returning, again and again, to something that kept earning the return.

If an idea keeps pulling you back after it's gone quiet, that's data.

### 2. Start from a use case, not a technology

People were building fast around me, and I could see what was missing. Designers need a quick, structured read on a screen. Not a verdict, a lens. They also need it where they already work.

That framing decided almost everything that followed. The product promise became "a quick second opinion, not the final word," and that line still guides the product, the copy and what we refuse to build.

### 3. The first version is a prototype of the idea, not the product

The first build was a web app. You give it a screenshot, it sends the image to a vision model with a structured prompt, and it returns a score and ranked findings.

Most of the early work wasn't code. It was prompt refinement: getting the model to review a static screen consistently, with specific findings and concrete next steps instead of vague praise. That loop of try, read the output, tighten the prompt, repeat is the craft. The model is a capability. The judgment about what a good review looks like is yours.

### 4. Every wall is a design decision in disguise

Here's the part nobody shows in the demo. The moment I tried to run the same thing inside Figma, it failed. Figma's plugin sandbox sends requests with a null origin, and the AI provider rejected them. The plugin couldn't call the model at all.

The fix was a small proxy at the edge. That one forced move changed the whole product. It became a real backend that held the API key, validated every request, and served every surface. Because of that decision, "bring it to another platform" stopped meaning a rebuild.

A few more walls, same pattern:
- Figma's sandbox also breaks local storage. We moved state to the plugin's own storage and passed it in.
- Adding subscribers by editing code was clearly wrong. We moved them to a database, with an admin dashboard so no code change is ever needed to manage users.
- A database command quietly ran against a local copy instead of the real one. One missing flag.

None of these were in a tutorial. Each one forced a decision, and the decisions added up to an architecture.

### 5. Design the access model like a product, because it is one

I wanted anyone in the world to try it, and I didn't want a wall in front of the value. So the model became:

- Two audits with no account, so people see the value first.
- Then a free daily allowance for an email, with the same token working everywhere.
- Optional support through a tip jar that grants bonus audits automatically.

I had built paid plans too. I hid them, because prices, links and webhooks weren't ready and tested. Shipping a half-ready paywall would have cost more trust than it earned. Deciding what not to launch is part of the job.

Making it accessible to the world turned out to be a design problem of its own: free tier limits, abuse controls, cost per audit, and a promise that we never store people's screenshots.

### 6. One backend makes every new surface cheap

Web first, then Figma, then Chrome. The Chrome extension was an afterthought. Figma was the plan. But because everything already ran on one backend with one token, the extension took about 90 minutes to reach a working package. I submitted it the same weekend.

If I'd built each surface separately, I'd have stopped at two. The architecture decision I made out of frustration over a CORS error is what made the third surface nearly free.

### 7. Hold your own work to the standard you sell

I ran the same kinds of checks on the product itself: heuristics, Gestalt, accessibility. I fixed what they found in the plugin, then applied the same standard to Chrome before I submitted it. A tool that reviews design should survive a design review.

### 8. Shippable means more than working

This is the biggest shift for me. A vibe-coded app works on your laptop. A product is a system, and the system includes things that aren't code:

- A **PRD** that says what the product is and isn't.
- **Design principles** and a stated persona, so decisions stay consistent.
- **Architecture and operations docs**, so I can come back in a month and still deploy safely.
- **Release notes and a task log**, updated with every version.
- **Security and data-use answers** for store reviews.
- A **marketing site**, store listings, SEO and a plan for how people find it.
- An **admin dashboard** so I can see usage and manage access.

Almost all of that was done with AI doing the heavy lifting. But the choices were mine: what to write, what to cut, what to promise, what to leave out. Roughly speaking, AI carried most of the execution and the human part was noticing, framing, taste and deciding. That human share is smaller in volume but it's where the product actually gets decided.

### What I'd tell anyone who wants to do this

1. **Notice a gap you actually see.** The best ideas sit in complaints people have stopped hearing.
2. **If it repeats all week, give it a weekend.** Then give it another one.
3. **Frame the use case before you pick the tool.** Who needs what, when, and why now.
4. **Build the thinnest thing that proves it works,** then expect it to break in a new environment.
5. **Treat each blocker as information.** The wall usually points at the architecture you needed.
6. **Make one backend serve many surfaces.** Reach compounds.
7. **Design the access model and the limits on purpose.** Free, abuse, cost and trust are product decisions.
8. **Review your own work with real frameworks.**
9. **Document as you build.** If you can't explain it, you can't ship or maintain it.
10. **Keep the human layer.** Taste, trust and the call to cut.

Designers, developers and AI builders are converging on the same job: taking an idea from zero to one and owning everything in between. The tools got a lot better. The part that hasn't changed is being ready to figure it out when something breaks.

*LintAssist is a side project built to help designers produce better work. It's live on the web, in Figma and in Chrome.*

---

# VERSION B — The idea that wouldn't go away

*A generic, product-free version. Meant to inspire and build curiosity without revealing what was built.*

## The idea that wouldn't go away

**A story about a small idea, a few weekends, and everything that happens between "someone should build this" and "it's live."**

There's a particular kind of thought that shows up at work on a Tuesday. A review goes sideways in a familiar way. A teammate hits the same snag you hit last month. You think: *someone should really build something for this.*

Most of the time, nobody does. The thought fades by Thursday.

This one didn't.

### 1. Notice what repeats

It wasn't one frustrating moment. It was the same one, over and over, across a week of normal work. Repetition is the signal. A one-off annoyance is noise; a problem that keeps showing up is a use case waiting for someone to take it seriously.

### 2. Give it a weekend, not a roadmap

A roadmap is a way to postpone. A weekend is a way to find out.

I gave the idea one Saturday. Not to finish it, just to see if it was real. By evening there was something working, rough but undeniable, and that changes how you think about an idea. It stops being a thought and becomes a thing.

### 3. It's fine if the idea goes to sleep

Then the week took over, and the idea slept for weeks. I didn't force it. But I kept drifting back, because it was worth trying out. It had a real use case, real people who'd benefit, and the potential to quietly help in places I hadn't thought of yet.

Progress didn't come from one heroic push. It came from several weekends of returning to something that kept earning the return. If an idea survives weeks of silence and still pulls you back, take that seriously.

### 4. Small is the right size

I wasn't building a platform. I was building a tiny tool for the people around me, aimed at one problem they all had. Small is easier to start, easier to finish and much easier to learn from. The ambition can grow later, once the idea has earned it.

### 5. Walls are the curriculum

Nothing works the first time it leaves your laptop. The environment behaves differently, something blocks you with an error you've never seen, and a shortcut you took turns out to be wrong.

Every one of those walls forced a decision, and the decisions quietly became the structure of the thing. What felt like detours were the route. I learned more from the blockers than from anything that worked on the first try.

### 6. Then it becomes a system

At some point it stops being "a small app" and becomes something you have to *run*. People need to reach it. You decide what's free and what isn't. You think about trust, limits and what you'll never do with people's data. You write down what it is and what it isn't. You tell the story of it so someone else can find it.

That's the part nobody warns you about: the thing that ships isn't just the build. It's the thinking, the documentation, the promises, and the decisions about what *not* to do.

### 7. AI changes the volume, not the job

AI did a lot of the heavy lifting. Drafting, building, testing, documenting. But the noticing, the framing, the taste and the decisions about what to cut stayed human. That share is smaller in volume and bigger in consequence.

### What I'd tell you

- Notice what repeats.
- If it repeats all week, give it a weekend.
- Let it sleep if it needs to. Come back if it keeps pulling you.
- Build small, learn fast.
- Treat every blocker as information.
- Don't stop at "it works." Make it something people can actually use.
- Write it down as you go.
- Keep the human part: taste, trust and the call to cut.

You don't need the right title to do this. Designer, developer, PM or none of the above, the job is the same: be ready to figure it out when something breaks, and keep going back to the idea that won't go away.

*What's the problem you've noticed three times this month? That's probably your weekend.*

---

# IMAGE PROMPTS

Paste the **style block** at the start of every prompt so the set looks like one family. These match the colors of the build log and landing page.

### Style block (prepend to every prompt)

> Editorial illustration in a warm, premium style. Cream paper background (#F4EEE3) with a subtle film-grain texture. Deep espresso brown (#1B1612) for shapes and linework, with a single burnt-orange ember accent (#E0562A) and a soft sage-teal secondary (#8FB3AD). Fine, confident lines, generous negative space, soft diffused shadows, no harsh outlines. Calm, thoughtful mood, slightly surreal. No text, no logos, no UI screenshots, no stock-photo look. Wide 16:9 composition.

## Version A: image prompts

**Title image**
> [Style block] A lone designer's desk at dusk seen from above. A single glowing ember-orange thread leaves a small paper sketch and splits into three thin lines that reach toward three different floating window shapes: a browser, a canvas frame and a puzzle-shaped extension. Quiet, hopeful, full-circle feeling.

**1. A problem that repeats all week deserves a weekend**
> [Style block] A calendar week drawn as five faint identical paper squares, each with the same small crumpled note. Saturday and Sunday are two glowing ember-orange squares where the crumpled notes unfold into a neat sketch. Sense of repetition becoming a decision.

**2. Start from a use case, not a technology**
> [Style block] A person standing at the edge of a crowd of busy builders, quietly pointing at a missing puzzle piece on a large unfinished table. The missing piece glows ember-orange. Observation and curiosity.

**3. The first version is a prototype of the idea**
> [Style block] A hand tuning a set of fine dials and sliders connected to a floating sheet of paper showing a rough screen layout. Small annotation marks in ember orange appear on the sheet. Craft, iteration, refinement.

**4. Every wall is a design decision in disguise**
> [Style block] A winding path hits a tall espresso-colored wall. A small ember-orange doorway has been drawn into the wall with chalk-like lines, and the path continues through it into a wider landscape. Obstacle becoming architecture.

**5. Design the access model like a product**
> [Style block] An open garden gate in the middle of a sunlit field. A few visitors walk through freely; beyond the gate a second, softer gate with a small ember lantern. Welcoming, generous, no hard barrier.

**6. One backend makes every new surface cheap**
> [Style block] One strong central root or trunk made of thin lines, branching out into three different windows, each glowing slightly differently. The trunk is espresso, the windows are cream, sage and ember. Reach compounding from one foundation.

**7. Hold your own work to the standard you sell**
> [Style block] A craftsperson holding a magnifying lens up to their own finished object, with fine measuring marks around it. A small ember checkmark glows on one corner. Self-review, integrity.

**8. Shippable means more than working**
> [Style block] An iceberg-style cutaway: a small, polished app icon floating above the surface, and beneath it a large calm layer of stacked documents, diagrams, checklists and a small dashboard. The hidden layer is detailed and warm-lit. The whole system, not just the build.

**Closing: what I'd tell anyone who wants to do this**
> [Style block] A single ember-orange footprint trail across a cream landscape leading toward a small glowing horizon line, with a few other faint footprint trails starting behind. Invitation, momentum.

## Version B: image prompts

**Title image**
> [Style block] A tiny glowing ember-orange seed resting in the palm of an open hand, with fine roots of light spreading downward and a sprouting idea above it. Quiet, curious, potential.

**1. Notice what repeats**
> [Style block] The same small paper sticky note appearing again and again across a long row of desks, each one with a faint ember-orange outline that gets slightly brighter. Pattern recognition.

**2. Give it a weekend, not a roadmap**
> [Style block] On the left, an elaborate rolled-up roadmap tied with string. On the right, a single open weekend day drawn as a bright empty square with a pencil resting on it. The pencil side glows ember. Starting beats planning.

**3. It's fine if the idea goes to sleep**
> [Style block] A paper lantern asleep on a shelf, softly glowing, with a faint trail of ember light reaching out toward a hand that returns to it. Patience, return, quiet pull.

**4. Small is the right size**
> [Style block] One small, perfectly crafted object on a large empty cream table, lit by a soft shaft of light. A hint of a much bigger structure sketched faintly behind it. Small now, room to grow.

**5. Walls are the curriculum**
> [Style block] A staircase made of stacked bricks, each brick a different muted color, with one ember-orange brick on every step. The person climbing it holds a single brick. Obstacles as steps.

**6. Then it becomes a system**
> [Style block] A hand-drawn machine of gears, pipes and small windows slowly assembling itself around a tiny central glowing shape. Documents and diagrams float around it like components. From object to system.

**7. AI changes the volume, not the job**
> [Style block] A large, calm mechanical arm doing detailed work in the background while a human hand in the foreground points one decisive ember-orange line on a sheet. Machine for volume, human for the call.

**Closing: what I'd tell you**
> [Style block] An open notebook with a single line drawn upward off the page into the sky, becoming a thin ember-orange thread that disappears toward the stars. Possibility.

### Tips for the image model
- Generate each at 16:9 for the title and 3:2 for in-article images, so they sit cleanly in a blog layout.
- If results look too busy, add "minimal, fewer elements, more negative space."
- If text appears in the image, add "absolutely no text or letters anywhere."
- Keep the same style block for every image. Consistency is what makes the set feel designed.

---

# LINKEDIN POST

*Product-free, pairs with Version B and its title image.*

**Anyone can build with AI now. That's not the hard part anymore.**

The hard part is what comes after "it works on my laptop."

Over a few weekends I took a small idea from a repeated annoyance at work to something live in front of real people. Here's what I learned:

→ **If a problem repeats all week, give it a weekend.** Not a roadmap. A weekend. Then another one. The idea slept for weeks, but it kept pulling me back, and that told me something.

→ **Every blocker is information.** The thing that broke on day one ended up shaping the whole architecture.

→ **Shipping is a system, not a build.** Access, limits, trust, documentation, a PRD, release notes, a story people can find. None of it is code, and all of it is the job.

→ **AI carries the volume. You carry the judgment.** Noticing, framing, taste and the call to cut stayed human, and that's where the product got decided.

The question isn't "can I build it?" anymore. It's "can I take it from zero to one, and own everything in between?"

Designer, developer, PM or none of the above, that's the skill to build next.

**What's the problem you've noticed three times this month?** That's probably your weekend.

#AI #ProductBuilding #Design #BuildInPublic

*Optional last line to name the project:* "This one became LintAssist, a design second-opinion tool for the web, Figma and Chrome: lintassist.com."

---

# IMAGE PROMPTS: USE CASES, USER FLOWS AND ARCHITECTURE

Diagrams are where image models struggle most, especially with text. Two ways to get good results:

1. **Generate the artwork with no labels**, then add the words yourself in Figma or Keynote. This is the most reliable option.
2. **Ask for very short labels only** (one or two words) and check the spelling carefully.

Reuse the same **style block** from above. Append this to each diagram prompt: *"Diagram-style illustration, clean and uncluttered, no paragraphs of text, labels limited to single words."*

### Use cases

**Who it's for: the four people**
> [Style block] Four small, distinct, friendly figures arranged around one glowing central screen shape: a designer at a canvas, a builder with a laptop, a product partner holding a clipboard, an independent freelancer with a notebook. Each is connected to the central screen by a fine line. Warm, human, no faces in detail.

**The moments it's used: before the review, before handoff, under deadline**
> [Style block] Three side-by-side vignettes on one cream panel, separated by fine vertical lines. Left: a person about to walk into a meeting room holding a sheet of paper. Middle: a sheet being passed across a table to a teammate. Right: a person at a desk with a clock showing a looming deadline. A small ember-orange check mark glows on each sheet.

**The problem: what gets missed**
> [Style block] A clean screen layout drawn in fine lines, with a few small ember-orange circles quietly marking spots that were missed: a faint line of text, a button that blends in, items spaced oddly. The rest of the screen looks polished. "Looks fine until someone else looks."

### User flows

**The access journey: try, free, support**
> [Style block] A left-to-right path across a cream landscape with four stops drawn as small stepping stones: a stone with the number 2 (free tries), a stone with an envelope (email signup), a stone with a small key (one token, works everywhere), and a final stone with a warm cup (optional support). The path is a single ember-orange line. Welcoming and unhurried.

**The audit flow in three steps**
> [Style block] Three connected rounded panels in a row, joined by an ember arrow. Panel one: a screen being captured inside a viewfinder. Panel two: a row of small toggle chips being chosen. Panel three: a short ranked list with a score ring. Clean, minimal, calm.

**One token, three surfaces**
> [Style block] A single small key at the center, with three thin threads leading out to three different window shapes: a browser, a design canvas, and a side panel. Each window softly glows. The key is ember-orange, the windows are cream and sage.

### Architecture

**System overview**
> [Style block] A clean layered diagram with three tiers. Top row: three client shapes (web page, design-tool plugin, browser extension) of equal size. Middle: one wide rounded bar representing a single edge API gateway, glowing ember. Bottom row: three smaller shapes for a database, an AI model, and a payment/support webhook. Fine arrows run downward from clients through the gateway to the bottom row. Balanced and symmetrical, generous whitespace.

**Why the proxy mattered**
> [Style block] A wall with a tiny blocked doorway on the left labeled only by a lock shape. A small relay tower sits in front of the wall passing a glowing ember message over the wall to the right side, where the AI model waits. Sense of a hidden bridge that fixed the block.

**Data and trust: nothing is stored**
> [Style block] A thin glass pipe carrying a small screen image from left to right through a processing shape, with the image dissolving into light after it passes. A tiny padlock sits on the pipe. Only a small score card emerges at the end. Privacy by design.

**The admin view: seeing the system**
> [Style block] A calm dashboard-like panel drawn as abstract shapes only (bars, a line trace, small dots), with a single ember highlight on one bar. No numbers or text. A hand rests a pen near the panel, suggesting oversight.

### Process and journey

**The pivot chain: web to Figma to shared token to Chrome**
> [Style block] A winding path of five stepping stones, each with a simple glyph: a browser window, a design frame, a key, three small numbered dots, and a puzzle piece. The path is a continuous ember thread, and each stone is slightly higher than the last. Evolving, not planned.

**AI carries volume, human carries judgment**
> [Style block] A wide horizontal split. The left three-quarters shows a calm machine arm producing many neat, similar papers. The right quarter shows a single human hand drawing one confident ember-orange line on a sheet. The proportion is intentional: much of the execution is machine, the decisive part is human.

**The system behind the product: the docs, the plan, the story**
> [Style block] A neat stack of translucent layers viewed from the side, like an exploded diagram. Top layer: a small polished app shape. Beneath: layers of documents, a checklist, a roadmap, a marketing page and a security shield. Fine ember connecting lines run down through all layers. The product is the tip, the system is the body.

**Full circle: one idea, many places**
> [Style block] A circular loop made of an ember-orange line, with small icons placed around it: a lightbulb, a sketch, a code bracket, a window, a design frame, a browser, a person. The loop closes back on the lightbulb. Completion, coverage, momentum.
