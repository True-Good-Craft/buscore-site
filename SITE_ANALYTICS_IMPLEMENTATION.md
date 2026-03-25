# Site Analytics Implementation Note

Date: 2026-03-25
Scope: BUS Core static public site only

## 1) Implemented Analytics Components

Cloudflare analytics mechanism:
- Implemented in global loader /assets/js/site-analytics.js.
- Loader injects Cloudflare beacon script:
  - src: https://static.cloudflareinsights.com/beacon.min.js
  - data-cf-beacon token is set in code.

First-party Lighthouse pageview emitter:
- Implemented in same global loader.
- Endpoint: POST https://lighthouse.buscore.ca/metrics/pageview.
- Posting model: cross-origin POST from buscore.ca to Lighthouse.
- The site does not post first-party telemetry to buscore.ca.
- Emission model: page-load fire-and-forget.

## 2) When Emission Happens

Emission trigger:
- On script execution during normal page load.
- No unload/beforeunload handlers are used.

Execution precondition:
- dev_mode cookie must be absent.

## 3) When Emission Is Suppressed

Suppression rule 1:
- If cookie dev_mode=... exists, suppress all analytics work.
- This suppresses both:
  - Cloudflare script injection
  - Lighthouse pageview emission

Suppression rule 2 (dedupe):
- If same path already fired within 3000 ms in current tab session, suppress second pageview.

## 4) Dedupe Rule

Storage medium:
- sessionStorage only.

Stored keys:
- last_path
- last_fired_at

Algorithm:
- Read keys.
- If last_path equals current pathname and now - last_fired_at < 3000, suppress.
- Otherwise update keys and emit.

## 5) Source and UTM Parsing Rules

Source parsing:
- src is parsed from query parameter src only.
- No redirect-path inference logic exists in client.

UTM parsing:
- Parsed from query params when present:
  - utm_source -> utm.source
  - utm_medium -> utm.medium
  - utm_campaign -> utm.campaign
  - utm_content -> utm.content

## 6) Emitted Payload Fields

Fields currently emitted:
- type: pageview
- client_ts: ISO string from new Date().toISOString()
- path: window.location.pathname
- url: window.location.href
- referrer: document.referrer || ''
- src: optional, from ?src=
- utm: object with optional source/medium/campaign/content
- device: desktop|mobile|tablet
- viewport: "{innerWidth}x{innerHeight}"
- lang: navigator.language || ''
- tz: Intl.DateTimeFormat().resolvedOptions().timeZone || ''

Device classification model:
- Coarse regex + viewport heuristic only.
- No high-entropy fingerprint fields are collected.

## 7) Transport Rule

Priority order:
- First: navigator.sendBeacon with JSON Blob.
- Fallback: fetch with keepalive: true, method POST, content-type application/json.

Failure behavior:
- Fire-and-forget only.
- No retries.
- Ordinary failures are swallowed (no console noise requirement in code path).

## 8) What the Site Does Not Attempt

- No unload-triggered telemetry.
- No retry queue/backoff.
- No persistent session/user id.
- No cookies/localStorage identity for telemetry.
- No server-side received_at stamping on client.
- No in-site aggregation/reporting logic.

## 9) Files Involved in Site-Side Telemetry Implementation

New shared loader:
- assets/js/site-analytics.js

Static pages updated to include shared loader:
- 404.html
- changelog.html
- contact.html
- downloads.html
- index.html
- license.html
- privacy.html
- trust.html
- what-is-bus-core/index.html
- blog/index.html
- blog/_post-template.html
- blog/field-guide/index.html
- blog/inventory-drift/index.html
- blog/spreadsheets-to-buscore/index.html
- blog/the-awkward-middle-between-spreadsheets-and-erp/index.html
- blog/traceability-before-erp/index.html
- blog/why-4-overnight-downloads-matter-more-than-400-empty-impressions/index.html
- use-cases/3d-print-farm/index.html
- use-cases/laser-engraving-shop/index.html
- use-cases/small-batch-manufacturing/index.html

## 10) Expected Lighthouse Follow-on (Not Implemented in Site)

- Endpoint availability and contract hardening for https://lighthouse.buscore.ca/metrics/pageview.
- Server-side timestamp assignment (received_at).
- Validation/sanitization and schema enforcement.
- Storage and retention policy.
- Aggregation/reporting outputs (paths, referrers, sources, trends).
- Rate limiting / abuse handling.

Manual validation status:
- Valid POST requests to https://lighthouse.buscore.ca/metrics/pageview return 204.
- Site responsibility ends at emission; Lighthouse owns ingestion, storage, aggregation, and report shaping.
