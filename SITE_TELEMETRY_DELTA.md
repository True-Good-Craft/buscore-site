# Site Telemetry Delta / Change Summary

Date: 2026-03-26
Type: Telemetry unification plus anonymous continuity on deployed static shell

## 1) What Changed

- Added one shared site analytics loader in deployed shell:
  - .deploy/assets/js/site-analytics.js
- Replaced duplicated per-page inline Cloudflare analytics bootstraps with a shared deferred script include on served pages:
  - <script src="/assets/js/site-analytics.js" defer></script>
- Added first-party shared event emission to Lighthouse endpoint:
  - POST https://lighthouse.buscore.ca/metrics/event
  - Shared event emitted as type=page_view with site_key=buscore
  - Cross-origin from buscore.ca to Lighthouse (not posted to buscore.ca)
- Added anonymous continuity fields and state:
  - bc_uid cookie (UUIDv4, 365d)
  - bc_sid session id in sessionStorage
  - bc_last_activity_at timestamp in sessionStorage
  - 30-minute session rollover
  - payload fields: anon_user_id, session_id, is_new_user
- Strengthened noAnalytics kill-switch behavior:
  - suppress Cloudflare and Lighthouse
  - delete bc_uid
  - clear bc_sid, bc_last_activity_at, last_path, last_fired_at
- Added privacy page controls via data attributes:
  - data-analytics-optout, data-analytics-optin, data-analytics-status
- Added automated headless browser validation:
  - tests/browser/deploy-analytics.test.mjs

## 2) Why It Changed

- Remove duplicated inline analytics code across pages.
- Keep telemetry first-party, minimal, and explicit.
- Preserve non-blocking page behavior and avoid heavy analytics frameworks.
- Align website telemetry with Lighthouse ingestion path while keeping privacy-safe scope.
- Distinguish first-time and returning anonymous visitors plus browser sessions without introducing consent-banner/fingerprinting scope.

## 3) Files Touched by Telemetry Implementation

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
- .deploy/blog/_post-template.html
- .deploy/blog/spreadsheets-to-buscore/index.html
- .deploy/blog/the-awkward-middle-between-spreadsheets-and-erp/index.html
- .deploy/priceguard/index.html
- tests/browser/deploy-analytics.test.mjs
- tests/browser/package.json

## 4) Old Behavior Removed or Replaced

Removed/replaced:
- Inline Cloudflare analytics bootstrap blocks embedded separately in each static page head.

Replaced with:
- Shared loader include calling centralized logic in .deploy/assets/js/site-analytics.js.

## 5) Intentionally Deferred (Not Part of Site Change)

- Any telemetry retries/queueing strategy.
- Unload-triggered analytics events.
- Server-side ingestion/storage/reporting implementation.
- Dashboard/report generation from collected events.
- Consent banner platforms or fingerprinting logic.

## 6) Endpoint Target Correction Note

- Endpoint remains https://lighthouse.buscore.ca/metrics/event.
- Browser suite captures and validates outbound request shape against this endpoint.
