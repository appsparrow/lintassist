# Publishing the Chrome extension

Internal publishing guide for the separate `chrome-extension/` package. It does not require publishing or changing the production Figma plugin or website. Chrome Web Store requirements checked against Google's official documentation on 2026-09-28; recheck the dashboard and linked policies before submission because requirements can change.

Official references:

- [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare)
- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Image requirements](https://developer.chrome.com/docs/webstore/images)
- [Chrome Web Store User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)
- [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- [Update a published item](https://developer.chrome.com/docs/webstore/update)

## Before submitting

- Run the latest `chrome-extension/` folder in Chrome using **Load unpacked** and make sure the full flow works: select frameworks, capture a page, analyze, copy results, and save/verify a token.
- Recheck `chrome-extension/manifest.json`. The package uses `activeTab`, `storage`, and `sidePanel`; it does not need `<all_urls>`. The Worker host permission is needed for analysis and token verification. `lintassist.com` is currently listed as a host permission, but the extension only links to that site and does not fetch from it; remove that unused host permission before submission to keep access minimal.
- The manifest description must stay within Chrome's 132-character limit. Check name, version, description, icons, and JSON syntax before packaging; manifest metadata cannot be corrected in the dashboard without another package upload.
- Increment `version` in the manifest for every package update after the first upload.
- Update the public privacy policy at `https://lintassist.com/privacy.html` before submission. The current policy mentions the web app and Figma plugin, but not the Chrome extension. Add the extension's on-demand screenshot capture, temporary in-panel preview, screenshot transfer to the Worker and AI provider, page-title context, local token/anonymous-ID storage, retention, and user controls. Keep the policy consistent with the live implementation.
- The root-level `chrome-extension.pem` appears to be a private signing key. Keep it private and backed up securely; never commit it or include it in the store ZIP. The root-level `.crx` is not the package to upload for a first submission. Chrome Web Store updates normally use a new ZIP; CRX upload is only relevant if Verified CRX Uploads is deliberately enabled.

## Build a clean upload ZIP

Upload a ZIP with `manifest.json` at its root. Include only the extension's runtime files: `manifest.json`, `service-worker.js`, `sidepanel.html`, `sidepanel.css`, `progress.css`, `steps.css`, `usage.css`, `sidepanel.js`, and `icon-128.png`.

Do not include `.pem`/`.crx` signing files, `.DS_Store`, `__MACOSX/`, unrelated project files, or another nested ZIP. The existing `chrome-extension/LintAssist.zip` contains `__MACOSX/` metadata entries; rebuild a clean archive from the current extension files instead of uploading it as-is. After packaging, inspect the archive and confirm that opening it shows `manifest.json` directly, not a containing folder.

## Developer account and first submission

1. Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) using the Google account that will own the listing. Complete any developer registration, verification, and fee steps shown by Google.
2. Choose **Add new item**, upload the clean ZIP, and correct any package validation errors.
3. Complete the **Store listing**, **Privacy practices**, and **Distribution** tabs. Fill in **Test instructions** if the reviewer needs any special setup; this extension has anonymous trial access, so explain that no account is required for the initial audit and give the steps below.
4. Review every declaration and preview the listing. Submit for review. Choose deferred/staged publishing if you want to publish manually after approval; otherwise Google can publish automatically after review. Review time varies.

## Store listing material

**Name:** LintAssist — AI UX Audit

**Short description** (within the 132-character limit):

> Audit the visible webpage for usability, accessibility, and visual design issues with AI-powered feedback.

**Suggested full description:**

> LintAssist gives you a fast, structured UX review of the page you choose. Select design frameworks, capture the visible part of the current tab, and receive a scored report with prioritized findings and practical recommendations.
>
> Choose from usability heuristics, visual hierarchy, Gestalt principles, typography, color and contrast, accessibility, calls to action, and mobile readiness. Copy the report for your design review.
>
> You choose when to capture and analyze. The screenshot stays temporarily in the extension panel until you click Analyze. Analysis sends the screenshot and page title to the LintAssist Worker, which forwards the image to an AI provider (OpenRouter or Anthropic) to generate the report. The extension does not save screenshots to persistent storage. See the privacy policy for details.
>
> Feedback is AI-generated and can be mistaken. Use it as a starting point and validate findings with your own design and accessibility expertise.

Review this copy against the live privacy policy and backend before pasting it into the Store. Do not promise that third-party providers delete data on a schedule unless their current terms and the LintAssist policy substantiate that promise.

**Category:** choose the closest available category for productivity/design tools in the dashboard.

**Support URL/contact:** use the monitored support channel linked from `lintassist.com`. Do not submit an address or support page that is not actively maintained.

## Required listing images

Google's current image guide lists these as mandatory:

- Extension icon: 128 × 128 px, included in the ZIP. The artwork guidance calls for a 96 × 96 square mark with 16 px transparent padding on each side; verify the current icon meets the guide.
- At least one screenshot, up to five recommended: 1280 × 800 px preferred, or 640 × 400 px. Show the real extension workflow and results, with no browser chrome or misleading claims.
- Small promotional tile: 440 × 280 px.

Optional: marquee promotional tile, 1400 × 560 px. Use original LintAssist artwork and ensure any screenshot shown is from the real extension. Figma cover artwork is a different aspect ratio and should not be uploaded as a Chrome store screenshot.

## Privacy practices and reviewer notes

LintAssist handles user data. In the dashboard, make declarations that match the current code and privacy policy, link the public privacy policy, and complete the Limited Use certification. At minimum, accurately cover:

### Remote code

Select **No, I am not using Remote code**. The extension's JavaScript, CSS, HTML, and other executable code are packaged in the uploaded ZIP. It does not load remote JavaScript/Wasm, use external scripts/modules, or evaluate downloaded strings with `eval()`. The Worker returns analysis data; it does not provide executable extension code.

If the dashboard still presents a justification field while **No** is selected, use:

> No remote code is used. All extension JavaScript, CSS, HTML, and executable assets are included in the submitted package. The Worker returns analysis results as data only; it does not serve code that the extension executes.

### Permission justifications

Use these drafts in the dashboard's permission justification fields. Each is well below the 1,000-character limit.

**`activeTab`**

> Grants temporary access to the current tab after the user invokes LintAssist. The extension uses it to capture a screenshot only when the user clicks Capture visible page for an audit. It does not inspect tabs in the background or request access to all websites.

**`storage`**

> Stores the user's LintAssist access token and a locally generated anonymous trial identifier in Chrome local extension storage so access and trial usage can persist between sessions. The extension does not store page screenshots in persistent storage.

**`sidePanel`**

> Opens LintAssist's interface in Chrome's side panel. Users select audit frameworks, capture a page on demand, start analysis, and review or copy the resulting UX report there.

**Host permission — `https://ux-audit-worker.domain-sparrow.workers.dev/*`**

> Allows the extension to verify the user's LintAssist access token and send a user-requested screenshot audit to the LintAssist Worker. The Worker returns the analysis report and applies the account's usage limits. This connection is required for the extension's core audit feature.

Remove `https://lintassist.com/*` from `host_permissions` before submission: the extension opens that site through a normal link and does not make cross-origin requests to it. A navigation link does not need a host permission.

The dashboard warns that a host permission can trigger an in-depth review and delay publishing. That is expected for the Worker origin: the extension must make cross-origin requests to it for token verification and analysis. Keep only that exact Worker origin, never use `<all_urls>`, and provide the justification above. There is no honest justification that guarantees review will be skipped; allow for review time in the release plan.

### Data usage form

The form's categories are broad. Based on the present implementation, use these as a careful starting point and reconcile them with the updated privacy policy and the live dashboard wording:

- **Website content — select.** The user explicitly captures the visible tab; its screenshot is uploaded for the requested analysis.
- **Authentication information — select.** The LintAssist access token is an authentication credential, stored locally by the extension and sent to the Worker in request headers.
- **Web history — select.** The extension does not collect a history/list of visited pages or visit timestamps, but it sends the current tab's title with the screenshot; if the title is unavailable, the implementation falls back to the tab URL. The dashboard's category definition specifically mentions page titles, so disclose this narrow, user-initiated current-page context. Do not imply that browsing history is collected.
- **Personally identifiable information — select.** The extension does not ask for or directly send email/name, but its access token identifies a LintAssist account that can be linked to an email/name in the backend. The locally stored anonymous trial ID is also a persistent pseudonymous identifier. Explain that the extension sends the token/ID, not the email/name itself.
- **Location — select for IP address, after confirming the production request/logging path.** The extension does not request geolocation, but its Worker requests necessarily arrive with a client IP address that Cloudflare can process. Confirm what Cloudflare and Worker logs retain, then disclose the IP/request metadata and applicable retention in the privacy policy. Do not claim no Location data is involved just because the extension does not request GPS.
- **Health information, financial/payment information, personal communications, and user activity — do not select for this extension's current behavior.** It does not request or analyze those as separate data types, inspect clicks/keystrokes/scrolling, or process payment data in the extension.

Do not submit category declarations that conflict with the policy. The policy must explicitly describe the extension's screenshot and page-title transfer, local token/anonymous ID, provider routing, account association, and Cloudflare's processing of request IP/network metadata and any applicable retention. The current policy names the web app and Figma plugin but omits Chrome and request IP details, so it needs an update before this form can be truthfully certified.

### Limited Use certifications

The dashboard requires all three certifications. Certify them only after confirming the policy and actual provider/backend practices support them:

- **“I do not sell or transfer user data to third parties, outside of the approved use cases.”** The screenshot is transferred to OpenRouter or Anthropic only to provide the user-requested analysis. That is the disclosed, core feature use; do not use the data for advertising or unrelated purposes.
- **“I do not use or transfer user data for purposes that are unrelated to my item's single purpose.”** Use the screenshot, page title, and token only to provide, secure, and meter the requested UX audit.
- **“I do not use or transfer user data to determine creditworthiness or for lending purposes.”** The extension does not do this.

**Privacy policy URL:** `https://lintassist.com/privacy.html` (enter this in the dashboard after the published policy has been updated to accurately cover Chrome).

In the dashboard explanation, state that the extension stores the access token and a generated anonymous trial ID locally; on user action it sends the screenshot and current page title (or URL if no title is available) to the Worker, which forwards the image to OpenRouter (Qwen/DeepSeek) or Anthropic (Claude fallback) to provide the audit. The extension does not persist screenshots, read page content in the background, or collect a list of visited pages or visit times. Transfers use HTTPS. Do not claim that the extension gathers no user data.

The dashboard's privacy questions/categories may change. Select the closest matching options rather than relying on this wording as a substitute for reading the live form. The single purpose should be narrowly described as **on-demand UX analysis of a user-selected webpage screenshot**. Explain each requested permission in relation to that purpose; do not ask for broad site access.

**Reviewer test instructions (suggested):**

> Install the extension and open a normal HTTPS webpage (not a `chrome://` page or another restricted browser page). Click the LintAssist toolbar icon to open the side panel. Select or keep the desired frameworks, click **Capture visible page**, then **Analyze page**. An anonymous trial is available; no sign-in is required for the first trial. To verify an access token, open Settings and paste a valid LintAssist token. The screenshot is sent to the LintAssist Worker and an AI provider only when Analyze is clicked.

## After publishing and updates

- Check the listing status and account email for approval, rejection, or requested changes. If rejected, fix the cited issue, increment `manifest.json`'s version, create a fresh clean ZIP, and resubmit.
- To publish an update, upload a ZIP containing the full extension (changed and unchanged runtime files), increment the version, update any affected listing/privacy/distribution details, and submit for another review.
- Keep the private signing key secure if using Verified CRX Uploads. Do not put the private key in Git, the extension directory, or any user-downloadable package.
