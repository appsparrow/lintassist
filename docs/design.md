# Product Design

## Product promise

LintAssist is a fast, honest second opinion for a screen. It helps a
designer see what deserves attention next without pretending that an AI
score replaces design judgment.

## Personas

### The working designer

Needs a quick second pass before presenting work. Values specific findings,
not vague praise, and wants to stay in Figma.

### The AI-assisted builder

Creates screens quickly with an AI tool or a visual builder. Needs a simple
way to catch obvious usability, hierarchy, and accessibility issues before
calling the work finished.

### The product partner

Reviews a screen before development handoff. Needs a shared language for
discussing risk without waiting for a full design review.

### The independent designer

Needs a professional-looking, repeatable review for client work without
buying or configuring a large audit platform.

## Pain points we address

| Pain point | LintAssist response |
| --- | --- |
| “I know something feels off, but I do not know where to start.” | A score and ranked findings create a first move. |
| “I need a second pair of eyes before the review.” | Nielsen, Gestalt, and Accessibility checks provide a focused baseline. |
| “The feedback is disconnected from my design workflow.” | The web app accepts screenshots; the plugin works on the selected Figma frame. |
| “I need to explain the recommendation, not just show a score.” | Each finding includes an observation and a concrete next step. |
| “I do not want my screens stored.” | Screenshots and reports are processed for the request and not retained by LintAssist. |

## Core use cases

1. **First audit:** a designer selects a Figma frame or uploads a screenshot
   and receives a quick baseline review.
2. **Before handoff:** a senior designer checks a junior designer’s screen
   before a critique or development handoff.
3. **After the trial:** a designer enters an email to continue with five
   audits per day and uses the same token on web and Figma.
4. **Cross-surface review:** a designer moves between a live-site screenshot
   in the web app and a Figma frame without learning a second workflow.
5. **Report sharing:** the designer copies the report or places it beside
   the source frame in Figma.

## Experience principles

- **Start with the user’s problem.** Explain what the audit helps with before
  asking for support, access, or more input.
- **Be a second opinion.** Use “starting point” language; never present the
  AI result as a compliance certification or final design verdict.
- **Make the next step obvious.** Prioritize findings and recommendations.
- **Keep the workflow small.** The user should reach an audit quickly.
- **Respect the work.** Do not retain screenshots or make the user feel
  pressured to donate.
- **Stay consistent.** The web app and plugin should use the same language,
  access model, framework defaults, and release version.

## Current default audit lens

New audits begin with **Nielsen’s Heuristics**, **Gestalt**, and
**Accessibility** selected. Other frameworks remain available as optional
toggles for users who need a broader review.
