# LintAssist Memory

This file keeps durable context between work sessions. Update it when a
decision is easy to forget but important to preserve.

## Product identity

- Product: LintAssist.
- Creator: Siva Tayi.
- Canonical web domain: `lintassist.com`.
- Current release: `1.0.1`.
- Previous published release: `1.0.0`.
- Positioning: a quick AI second opinion, not the final word.

## Current behavior

- Anonymous users receive two audits without signup.
- Email users receive five audits per day through a shared token.
- The web app accepts screenshots; the Figma plugin audits selected frames.
- Default frameworks are Nielsen’s Heuristics, Gestalt, and Accessibility.
- Other framework chips remain available as optional checks.
- Reports can be copied; Figma users can place reports on the canvas.
- Support messaging is contextual and optional; Ko-fi is not required to use
  the core free experience.

## Technical anchors

- Static web source: `public/`; build output: `dist/`.
- Plugin source: `figma-plugin/`.
- Worker/API: `worker-stripe.js`.
- Database migrations: `migrations/`.
- Product documentation: `docs/`.

## Release convention

Use patch releases for copy, defaults, documentation, and small UI changes.
Use a minor release for a new user-facing capability. Update `package.json`,
the web/plugin footer, `public/releases.html`, `PRD.md`, and `docs/tasks.md`
together.
