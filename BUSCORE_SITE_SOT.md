# BUS Core Public Site Source of Truth (SoT)

Date: 2026-03-25
Scope: buscore.ca static public site in this repository
Type: Freeze-and-capture (implementation-grounded)

## 1) Purpose

- Present BUS Core product positioning and trust model.
- Provide release discovery and download entry points.
- Publish public content (blog and use-case pages).
- Publish legal/privacy/licensing pages.

## 2) Scope Boundaries

Site owns:
- Static page rendering (HTML/CSS).
- Client-side hydration for downloads/changelog content.
- Client-side analytics emission from browser.

Site does not own:
- Product runtime/app telemetry behavior (desktop app behavior is separate).
- Server-side telemetry ingestion/storage/aggregation.
- Binary hosting internals (served via Lighthouse/R2 endpoints).
- Price Guard app internals under Price-Guard/ (separate Vite/React app).

## 3) Current Page/Layout Model

Public static pages in-scope (site shell pages):
- Root pages: index, downloads, changelog, trust, contact, privacy, license, 404.
- Blog pages: blog index + blog post pages.
- Use-case pages: 3 pages under use-cases/.
- Additional content page: what-is-bus-core.

Shell characteristics (verified):
- Shared visual shell pattern: header nav + main + footer.
- Shared stylesheet path on static pages: /style.css (or style.css depending on directory depth conventions in each page).
- Shared analytics loader include on static shell pages: /assets/js/site-analytics.js (defer).

Out-of-scope app surface (not using static shell):
- Price-Guard/index.html uses module entry ./src/main.tsx and its own service worker registration.

## 4) Current Shared/Global Script Behavior

Global analytics loader:
- /assets/js/site-analytics.js is loaded by all static site-shell pages currently touched by telemetry work.
- Loader is first-party and responsible for:
  - dev_mode gating
  - Cloudflare Web Analytics bootstrap
  - Lighthouse pageview emission

Page-specific scripts still exist:
- /assets/js/downloads.js for downloads page manifest hydration.
- /assets/js/changelog.js for changelog release feed rendering.

## 5) Current Analytics Behavior (Site)

Observed behavior in global loader:
- If cookie dev_mode is present, loader exits immediately.
- If not gated:
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

Deduplication:
- Uses sessionStorage keys last_path and last_fired_at.
- Suppresses duplicate send when same path fires again within 3000 ms.

Transport order:
- navigator.sendBeacon first.
- Fallback to fetch with keepalive: true.
- Fire-and-forget only (no retries).

## 8) Authoritative Files for Current Site Behavior

Primary authority for telemetry behavior:
- assets/js/site-analytics.js

Primary authority for static shell behavior:
- index.html and peer static pages listed in telemetry-changed file set.

Primary authority for dynamic content hydration behavior:
- assets/js/downloads.js
- assets/js/changelog.js
- assets/data/releases.json
- manifest/core/stable.json

Deployment/config context:
- wrangler.jsonc (assets directory points to .deploy)

## 9) Explicitly Not Implemented (As of This Freeze)

- No click/event analytics beyond page-load pageview.
- No session id persistence/cookies/localStorage identity.
- No retry queue or backoff logic for failed telemetry.
- No client-side aggregation dashboard/reporting.
- No explicit consent/banner mechanism in code.
- No server-side telemetry behavior in this site repo (endpoint handling not implemented here).

## 10) Constraints and Principles (Observed in Implementation)

- Lightweight client code (no analytics framework dependency).
- Coarse device classification only; no fingerprinting logic.
- Non-blocking telemetry transport strategy.
- Fail-soft behavior (ordinary telemetry failures are silent).
- Separation between static site responsibilities and Lighthouse backend responsibilities.

## 11) Evidence Files Reviewed for This SoT Pass

- assets/js/site-analytics.js
- index.html
- downloads.html
- changelog.html
- blog/index.html
- use-cases/laser-engraving-shop/index.html
- what-is-bus-core/index.html
- privacy.html
- trust.html
- Price-Guard/index.html
- assets/js/downloads.js
- assets/js/changelog.js
- assets/data/releases.json
- manifest/core/stable.json
- wrangler.jsonc
- sitemap.xml
- robots.txt
- SOT.md

## 12) Uncertainty / Verify Flags

- Verify: production deployment routing still serves all modified static pages from this repository state without stale cached HTML.
- Verify: /priceguard path routing/casing behavior in deployment remains unchanged after site-shell telemetry rollout.
- Manual validation confirms POST https://lighthouse.buscore.ca/metrics/pageview returns 204 for valid requests.
- Site responsibility ends at emission; Lighthouse owns ingestion, storage, aggregation, and report shaping.
