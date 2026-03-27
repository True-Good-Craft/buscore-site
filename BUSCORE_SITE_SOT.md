# BUS Core Public Site Source of Truth (SoT)

Date: 2026-03-26
Scope: buscore.ca static public site in this repository
Type: Freeze-and-capture (implementation-grounded)

## 1) Purpose

- Present BUS Core product positioning and trust model.
- Provide release discovery and download entry points.
- Publish public content (blog and use-case pages).
- Publish legal/privacy/licensing pages.

## 2) Scope Boundaries

Site owns:
- Static page rendering (HTML/CSS) in deployed shell.
- Client-side hydration for downloads/changelog content.
- Client-side analytics emission from browser.

Site does not own:
- Product runtime/app telemetry behavior (desktop app behavior is separate).
- Server-side telemetry ingestion/storage/aggregation.
- Binary hosting internals (served via Lighthouse/R2 endpoints).
- Price Guard app internals under Price-Guard/ (separate Vite/React app).

## 3) Current Page/Layout Model

Public static pages in-scope (site shell pages):
- Deployed shell authority: .deploy/ (wrangler assets.directory target).
- Served root pages: index, downloads, changelog, trust, contact, privacy, license, 404.
- Served blog pages: blog index + blog post pages.
- Served app shell page: priceguard/index.html.

Shell characteristics (verified):
- Shared visual shell pattern: header nav + main + footer.
- Shared stylesheet path on static pages: /style.css (or style.css depending on directory depth conventions in each page).
- Shared analytics loader include on served pages: /assets/js/site-analytics.js (defer).

Out-of-scope app surface (not using static shell):
- Price-Guard/index.html uses module entry ./src/main.tsx and its own service worker registration.

## 4) Current Shared/Global Script Behavior

Global analytics loader:
- .deploy/assets/js/site-analytics.js is loaded by all served HTML pages in .deploy.
- Loader is first-party and responsible for:
  - dev_mode gating
  - localStorage noAnalytics kill-switch gating and identity cleanup
  - anonymous continuity identity lifecycle
  - Cloudflare Web Analytics bootstrap
  - Lighthouse pageview emission
  - privacy-page analytics control binding via data attributes

Page-specific scripts still exist:
- /assets/js/downloads.js for downloads page manifest hydration.
- /assets/js/changelog.js for changelog release feed rendering.

## 5) Current Analytics Behavior (Site)

Observed behavior in global loader:
- Loader binds privacy-page controls when present:
  - data-analytics-optout
  - data-analytics-optin
  - data-analytics-status
- If localStorage.noAnalytics is "1", loader clears analytics identity state and exits before analytics work.
- If dev_mode cookie is present, loader exits after kill-switch/status handling.
- If not gated:
  - Anonymous continuity state is resolved:
    - bc_uid cookie (UUIDv4, 365d, Path=/, SameSite=Lax, Secure)
    - bc_sid sessionStorage key
    - bc_last_activity_at sessionStorage key
    - Session rollover threshold: 30 minutes inactivity
  - Cloudflare beacon script is injected (https://static.cloudflareinsights.com/beacon.min.js) with configured token.
  - One page-load pageview event is emitted to POST https://lighthouse.buscore.ca/metrics/pageview.
  - This is a cross-origin POST from buscore.ca to Lighthouse (not same-origin telemetry posting to buscore.ca).

No unload analytics:
- No unload/beforeunload handler binding is present in site telemetry code.

## 6) dev_mode Behavior

Rule (verified in code):
- Cookie detection checks whether any cookie starts with dev_mode=.
- On match, the loader returns before any analytics work.

Effect:
- Cloudflare analytics is not loaded.
- Lighthouse pageview is not emitted.

Additional kill-switch behavior:
- If localStorage.noAnalytics is "1":
  - bc_uid cookie is deleted.
  - sessionStorage keys bc_sid, bc_last_activity_at, last_path, last_fired_at are removed.
  - Cloudflare is not loaded.
  - Lighthouse pageview is not emitted.

## 7) Site Telemetry Behavior Snapshot

Event type:
- pageview only.

Payload fields emitted by site:
- type = pageview
- client_ts (ISO timestamp)
- path (window.location.pathname)
- url (window.location.href)
- referrer (document.referrer or empty)
- src (from query param src, only when present)
- utm object with optional source/medium/campaign/content (utm_* query params)
- device (desktop|mobile|tablet)
- viewport (WxH)
- lang (navigator.language)
- tz (Intl DateTimeFormat timezone when available, else empty)
- anon_user_id (from bc_uid)
- session_id (from bc_sid)
- is_new_user (true only when bc_uid is first created on that page load)

Deduplication:
- Uses sessionStorage keys last_path and last_fired_at.
- Suppresses duplicate send when same path fires again within 3000 ms.

Transport order:
- navigator.sendBeacon first.
- Fallback to fetch with keepalive: true.
- Fire-and-forget only (no retries).

## 8) Authoritative Files for Current Site Behavior

Primary authority for telemetry behavior:
- .deploy/assets/js/site-analytics.js

Primary authority for static shell behavior:
- .deploy/index.html and peer served pages in .deploy.

Primary authority for dynamic content hydration behavior:
- .deploy/assets/js/downloads.js
- .deploy/assets/js/changelog.js
- .deploy/manifest/core/stable.json

Deployment/config context:
- .deploy/wrangler.jsonc (assets directory points to .deploy)

Automated validation evidence:
- tests/browser/deploy-analytics.test.mjs

## 9) Explicitly Not Implemented (As of This Freeze)

- No click/event analytics beyond page-load pageview.
- No retry queue or backoff logic for failed telemetry.
- No client-side aggregation dashboard/reporting.
- No explicit consent/banner mechanism in code.
- No fingerprinting or account identity.
- No server-side telemetry behavior in this site repo (endpoint handling not implemented here).

## 10) Constraints and Principles (Observed in Implementation)

- Lightweight client code (no analytics framework dependency).
- Coarse device classification only; no fingerprinting logic.
- Non-blocking telemetry transport strategy.
- Fail-soft behavior (ordinary telemetry failures are silent).
- Separation between static site responsibilities and Lighthouse backend responsibilities.

## 11) Evidence Files Reviewed for This SoT Pass

- .deploy/assets/js/site-analytics.js
- .deploy/index.html
- .deploy/downloads.html
- .deploy/changelog.html
- .deploy/trust.html
- .deploy/privacy.html
- .deploy/contact.html
- .deploy/license.html
- .deploy/404.html
- .deploy/blog/index.html
- .deploy/priceguard/index.html
- .deploy/assets/js/downloads.js
- .deploy/assets/js/changelog.js
- .deploy/manifest/core/stable.json
- .deploy/wrangler.jsonc
- tests/browser/deploy-analytics.test.mjs
- SOT.md

## 12) Uncertainty / Verify Flags

- Verify: production deployment routing still serves all modified static pages from this repository state without stale cached HTML.
- Verify: /priceguard path routing/casing behavior in deployment remains unchanged after site-shell telemetry rollout.
- Automated headless validation exists for identity, kill-switch, and duplicate suppression behavior (tests/browser/deploy-analytics.test.mjs).
- Site responsibility ends at emission; Lighthouse owns ingestion, storage, aggregation, and report shaping.
