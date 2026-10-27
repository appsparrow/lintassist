# Image prompts

Prompts for an image generator (for example GPT image tools). One **title image** plus one per article section, and optional diagram prompts.

## 1. Build a style block from the project
Read the project's design tokens or main page colors and fonts. Write one reusable paragraph and prepend it to every prompt so the set looks like a family. Template:

> Editorial illustration in a [warm / cool / crisp] premium style. [Background color + texture]. [Primary dark color] for shapes and linework, with one accent color [hex] and a soft secondary [hex]. Fine confident lines, generous negative space, soft diffused shadows. [Mood]. No text, no logos, no UI screenshots, no stock-photo look. Wide 16:9 composition.

If the project has no tokens, ask the user for 2–3 colors or reuse the build-log palette.

## 2. Prompt per section
One prompt per section of the article, 2–3 sentences each, describing a single clear visual metaphor:
- persistence → a lantern that returns to a hand; a calendar week with two glowing weekend squares
- observation → a person pointing at a missing puzzle piece
- prototype → a hand tuning dials on a rough sheet
- walls → a wall with a chalk doorway that opens a path
- access model → a welcoming open gate
- foundation → one root branching to several windows
- self-review → a craftsperson with a magnifier on their own work
- shippable system → an iceberg: small polished app above, layers of docs below
- closing → a trail of footprints toward a glowing horizon

Use metaphors that fit the user's actual story rather than copying these verbatim.

## 3. Diagram prompts (optional)
Use cases (who/when/what is missed), user flows (access journey, core action in steps, one identity across surfaces), architecture (clients → one gateway → data/AI/webhook; why a proxy mattered; nothing stored; admin view), and process (pivot chain, AI vs human split, the system behind the product, the full-circle loop).

## 4. Rules
- No text inside the image. Diagrams: generate unlabeled artwork and add words yourself; if labels are needed, single words only and check spelling.
- Title image 16:9; in-article images 3:2.
- If results are busy: "minimal, fewer elements, more negative space."
- Match reveal level: product-free posts get generic metaphors, never product UI.
