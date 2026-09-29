# Product and Engineering Rules

- Treat AI output as a useful starting point, never a final verdict.
- Keep Nielsen’s Heuristics, Gestalt, and Accessibility selected by default.
- Keep the web app and Figma plugin aligned in copy, access behavior, and
  release version.
- Do not store screenshots or generated reports server-side.
- Keep provider credentials and admin secrets out of client code.
- Make support requests optional and contextual; do not imply that payment is
  required for the core free experience.
- Keep paid Stripe plans hidden until live prices, links, and webhooks are
  configured and tested.
- Update release notes and `docs/tasks.md` whenever a user-visible version
  changes.
- Apply D1 migrations before deploying Worker code that reads new tables.
- Preserve the “not the final word” product framing in marketing and UI.
