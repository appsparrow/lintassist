# Use Cases - LintAssist Plugin

## Use Case 1: First-Time User Trial
**Actor**: A designer installing and using the plugin for the first time.
**Flow**:
1. Designer opens the "LintAssist" plugin in Figma via the Plugins menu.
2. Designer selects a frame on their canvas and clicks "Analyze Frame".
3. The plugin detects no user token is saved and uses the anonymous free tier token.
4. The backend securely limits the usage to 2 total free audits.
5. The frame is exported and analyzed by Anthropic's Claude AI.
6. The plugin seamlessly pastes an aggregated UI scorecard onto the Figma canvas.
7. The plugin UI updates to show a notification: "1 audit remaining".

## Use Case 2: Subscription Purchase & Activation
**Actor**: A designer who has exhausted their 2 free audits.
**Flow**:
1. Designer attempts a 3rd audit but is met with a paywall screen explaining their usage limit.
2. User clicks the "$8/mo Starter" link, opening the Stripe Checkout portal in their browser.
3. User completes payment securely. Stripe triggers a webhook payload (`checkout.session.completed`) to the Cloudflare Worker.
4. The worker automatically provisions a new subscriber token, tracking their 20 audits/month allotted capacity in the D1 SQL database.
5. User copies their newly generated token (e.g. from receipt or email) and enters it immediately into the Plugin's "Token" settings panel.
6. The plugin verifies the token status (`/status` endpoint). The UI hides the paywall, shows the Starter plan's usage strip, and re-enables the "Analyze" button.

## Use Case 3: Generating a Comprehensive Sub-Page Audit
**Actor**: A senior designer reviewing a specific product screen created by a junior designer.
**Flow**:
1. User selects the new "User Profile Dashboard" frame in Figma.
2. User reviews the 8 evaluation frameworks toggles (Nielsen, Accessibility, UI Hierarchy, Typography, etc.), ensuring they map perfectly to their goals.
3. User clicks "Analyze Frame".
4. The plugin sequentially presents non-blocking loading states inside the Iframe UI (Exporting -> Evaluating heuristics -> Checking accessibility -> Writing recommendations).
5. Claude generates structured JSON. The plugin translates this to a well-formatted graphical UI frame and places it beautifully on the canvas adjacent to the dashboard screen.
6. User reviews the "Critical" tier findings, such as an insufficient color contrast ratio warning, and acts immediately to correct them.

## Use Case 4: Top-Up Credits mid-month
**Actor**: A busy agency designer hitting their maximum limits halfway through the month.
**Flow**:
1. The designer exhausts their entire 50-audit pipeline on the Pro plan while batch-reviewing hundreds of e-commerce app screens.
2. The plugin proactively displays a $5 Top-up (add 10 credits) UI banner option.
3. User clicks the link containing `?client_reference_id=TOKEN`.
4. User completes the $5 payment via Stripe. Stripe Webhook automatically maps and executes an `UPDATE` SQL operation appending +10 credits explicitly to their token in D1.
5. User effortlessly returns to Figma. The plugin correctly reads their updated `/status` limits, incrementing their "Credits remaining" by 10.
