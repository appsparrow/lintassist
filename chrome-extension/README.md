# LintAssist Chrome Extension

This is a standalone Chrome Manifest V3 frontend. It does not modify or replace the production Figma plugin or website.

## Load locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `chrome-extension` folder.
4. Click the LintAssist extension button to open its side panel.

## Behavior

- The side panel captures the currently visible tab only after the user clicks **Capture visible page**. The screenshot stays temporarily in panel memory until the user clicks **Analyze page**.
- Screenshots are sent to the existing LintAssist Worker at `ux-audit-worker.domain-sparrow.workers.dev` for AI analysis.
- An access token can be saved in Chrome local extension storage. Without one, the backend's anonymous free-token flow is used.
- The side panel shows the active plan's remaining audit balance and refreshes it after each successful analysis.
- No screenshot is stored by the extension. The Worker and AI-provider processing are governed by the LintAssist privacy policy.

Before Chrome Web Store publication, supply store listing assets and confirm the extension-specific data-use disclosures against the live backend and privacy policy.
