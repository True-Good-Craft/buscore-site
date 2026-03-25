# Site Telemetry Delta / Change Summary

Date: 2026-03-25
Type: Minimal telemetry addition on static site shell

## 1) What Changed

- Added one shared site analytics loader:
  - assets/js/site-analytics.js
- Replaced duplicated per-page inline Cloudflare analytics bootstraps with a shared deferred script include:
  - <script src="/assets/js/site-analytics.js" defer></script>
- Added first-party pageview emission to Lighthouse endpoint:
  - POST https://lighthouse.buscore.ca/metrics/pageview
  - Cross-origin from buscore.ca to Lighthouse (not posted to buscore.ca)
- Added dev_mode suppression and sessionStorage dedupe in shared loader.

## 2) Why It Changed

- Remove duplicated inline analytics code across pages.
- Keep telemetry first-party, minimal, and explicit.
- Preserve non-blocking page behavior and avoid heavy analytics frameworks.
- Align website telemetry with Lighthouse ingestion path while keeping privacy-safe scope.

## 3) Files Touched by Telemetry Implementation

- assets/js/site-analytics.js
- 404.html
- blog/_post-template.html
- blog/field-guide/index.html
- blog/index.html
- blog/inventory-drift/index.html
- blog/spreadsheets-to-buscore/index.html
- blog/the-awkward-middle-between-spreadsheets-and-erp/index.html
- blog/traceability-before-erp/index.html
- blog/why-4-overnight-downloads-matter-more-than-400-empty-impressions/index.html
- changelog.html
- contact.html
- downloads.html
- index.html
- license.html
- privacy.html
- trust.html
- use-cases/3d-print-farm/index.html
- use-cases/laser-engraving-shop/index.html
- use-cases/small-batch-manufacturing/index.html
- what-is-bus-core/index.html

## 4) Old Behavior Removed or Replaced

Removed/replaced:
- Inline Cloudflare analytics bootstrap blocks embedded separately in each static page head.

Replaced with:
- Shared loader include calling centralized logic in assets/js/site-analytics.js.

## 5) Intentionally Deferred (Not Part of Site Change)

- Any telemetry retries/queueing strategy.
- Session/user identity tracking.
- Unload-triggered analytics events.
- Server-side ingestion/storage/reporting implementation.
- Dashboard/report generation from collected pageviews.

## 6) Endpoint Target Correction Note

- Initial site-side implementation targeted /metrics/pageview on buscore.ca.
- That incorrect target produced client-side 404 responses on buscore.ca.
- The correct endpoint https://lighthouse.buscore.ca/metrics/pageview was manually validated (204 for valid POST) and adopted.
- No client contract redesign was required; this was a target correction only.
