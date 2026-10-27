---
name: builder-content
description: Turn a project's real artifacts (docs, PRD, git history, pages) into publishable builder content. Use when the user wants a LinkedIn post, a build log, a Medium-style article, an inspirational or product-free post, a leadership presentation, or image prompts for any of these. Always asks what is needed first, then writes only that.
---

# Builder Content

Turns what already exists in a project into posts people want to read. The method: **ask first, ground everything in the repo, write only what was requested, never invent facts, never publish without being told to.**

## Workflow

### 1. Gather the facts (silently, before asking)
Read what is available so the questions are informed. Skip what doesn't exist.
- `README.md`, `docs/` (PRD, tasks, memory/notes, architecture, design, operations), release notes pages
- `git log --reverse --date=short --format='%ad %s'` for the real timeline
- Public pages (marketing, build log) for existing voice and claims
- Existing drafts, especially `docs/blog-*.md` and any `*journey*` / build-log HTML
- Package/manifest files for versions and surfaces shipped

Build a private fact sheet: what it is, who it's for, surfaces shipped, key decisions, blockers hit and how they were solved, access/pricing model, what is *not* live, and what is **not tracked** (installs, usage, revenue). Do not print the fact sheet unless asked.

### 2. Ask what the user needs
Use `AskUserQuestion`. Ask in one round (max 4 questions):

1. **Deliverables** (multi-select): LinkedIn post · Build log page (HTML, scroll story) · Medium-style article (builder's view) · Inspirational / product-free version · Leadership presentation deck · Image prompts · Short thread or caption set
2. **Audience & venue**: internal company blog · external (LinkedIn/Medium) · leadership/exec · portfolio
3. **Reveal level**: name the product and link it · describe it without naming · fully product-free
4. **Angle** (multi-select): the thought process · challenges and how they were solved · the system beyond the code (docs, PRD, marketing) · AI vs human contribution · the weekend/persistence story · results

Then ask in plain text (not a menu) only for what the repo can't supply: **real numbers** the user wants cited (installs, audits, users), any story detail only they know (why they started, what almost made them quit), and links to include. If they have no numbers, write without them. Never fabricate a metric.

### 3. Write only what was requested
Follow the matching guide in `references/`:
- LinkedIn post → `references/linkedin.md`
- Build log page → `references/build-log.md` (template in `assets/build-log-template.html`)
- Medium-style article (builder's view) → `references/article.md`
- Inspirational / product-free → `references/inspirational.md`
- Image prompts → `references/image-prompts.md`
- Presentation deck → reuse `assets/build-log-template.html` as the base (slide-based), see `references/build-log.md`

Save outputs under `docs/content/<short-name>-<type>.md` (or `.html` for pages), one file per deliverable. Show the user the LinkedIn post and a summary of the others in chat. Do not dump long articles into chat.

### 4. Ground and verify
- Every claim traces to the repo, git history, or something the user said. If unsure, mark `[confirm]` in the file and list the items in your reply.
- Cross-check names, versions, dates, and what's live vs. planned (for example, features that are built but hidden are not "launched").
- If the user's wording conflicts with the repo (for instance, they say one AI provider and the code uses another), write around it neutrally and ask which to use.

### 5. Hand off
In the reply: where files are, what needs confirming, and what you left out on purpose. Offer to commit. Do not post, publish, deploy, or push unless the user explicitly asks.

## Voice rules (apply to everything)
- First person, plain, specific. Short paragraphs. One idea per paragraph.
- Lead with the human story (a problem noticed, a decision made), not the technology.
- Honest about walls and hiccups; they are the credibility.
- Avoid the word "simple" to describe the work, hype adjectives, and hashtags beyond 3–4 on LinkedIn.
- Don't lead with compliance or niche acronyms unless the user's angle is about them. Describe the product by the user's framing of it.
- The core claim to protect: AI carries the volume; the human layer (noticing, framing, taste, deciding, cutting) is where the product gets decided.
- Use they/them for anyone whose pronouns aren't stated.
- Don't pitch. If the user wants a call to action, make it a question or an invitation, not an ask for something.

## Safety rules
- Don't include secrets, keys, internal URLs, customer data, or unresolved security issues (for example, tracked keys or exposed files) in anything public.
- If the project is a side project and the content is for an employer's internal blog, remind the user to check their company's outside-work/IP policy before posting.
- Never publish or post on the user's behalf. Drafts only, unless explicitly told to deploy.

## Examples in this skill
- `assets/build-log-template.html`: the finished interactive deck (content is from one project; replace the copy).
- `references/example-blog-drafts.md`: a full set of worked outputs (full-story article, product-free version, LinkedIn post, image prompts). Match its quality and structure, not its facts.
