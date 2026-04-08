# Site Analytics Implementation Note

Date: 2026-03-26
Scope: BUS Core static public site only

## 1) Implemented Analytics Components

Cloudflare analytics mechanism:
- Implemented in global deployed loader /.deploy/assets/js/site-analytics.js.
- Loader injects Cloudflare beacon script:
  - src: https://static.cloudflareinsights.com/beacon.min.js
  - data-cf-beacon token is set in code.

First-party Lighthouse event emitter:
- Implemented in same global loader.
- Endpoint: POST https://lighthouse.buscore.ca/metrics/event.
- Posting model: cross-origin POST from buscore.ca to Lighthouse.
- The site does not post first-party telemetry to buscore.ca.
- Emission model: page-load fire-and-forget.

Anonymous continuity identity (site-side only):
- Persistent cookie: bc_uid (UUIDv4, 365-day expiry, Path=/, SameSite=Lax, Secure).
- Session identity: bc_sid (sessionStorage).
- Session activity key: bc_last_activity_at (sessionStorage).
- Session rollover threshold: 30 minutes inactivity.
- New-user flag semantics: is_new_user is true only when bc_uid is created on that load.

## 2) When Emission Happens

Emission trigger:
- On script execution during normal page load.
- No unload/beforeunload handlers are used.

Execution precondition:
- localStorage.noAnalytics !== "1" and dev_mode cookie must be absent.

## 3) When Emission Is Suppressed

Suppression rule 1:
- If localStorage.noAnalytics === "1", suppress all analytics work.
- This suppresses both:
  - Cloudflare script injection
  - Lighthouse first-party event emission
- It also clears analytics identity state:
  - delete bc_uid cookie
  - remove sessionStorage keys bc_sid, bc_last_activity_at, last_path, last_fired_at

Suppression rule 2:
- If cookie dev_mode=... exists, suppress all analytics work.
- This suppresses both:
  - Cloudflare script injection
  - Lighthouse first-party event emission

Suppression rule 3 (dedupe):
- If same path already fired within 3000 ms in current tab session, suppress second event send.

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
- site_key: buscore
- type: page_view
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
- anon_user_id: bc_uid cookie value
- session_id: bc_sid session value
- is_new_user: true only when bc_uid created on this load

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
- No consent banner/platform.
- No fingerprinting or account identity.
- No server-side received_at stamping on client.
- No in-site aggregation/reporting logic.

## 9) Files Involved in Site-Side Telemetry Implementation

Shared deployed loader:
- .deploy/assets/js/site-analytics.js

Served pages include shared loader from .deploy shell:
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

Privacy controls surfaced in:
- .deploy/privacy.html
  - data-analytics-optout
  - data-analytics-optin
  - data-analytics-status

Automated browser validation:
- tests/browser/deploy-analytics.test.mjs

## 10) Expected Lighthouse Follow-on (Not Implemented in Site)

- Endpoint availability and contract hardening for https://lighthouse.buscore.ca/metrics/event.
- Server-side timestamp assignment (received_at).
- Validation/sanitization and schema enforcement.
- Storage and retention policy.
- Aggregation/reporting outputs (paths, referrers, sources, trends).
- Rate limiting / abuse handling.

Validation status:
- Headless browser suite validates first visit, returning visit, session rollover, kill-switch suppression, opt-out/opt-in controls, and duplicate suppression.
- Site responsibility ends at emission; Lighthouse owns ingestion, storage, aggregation, and report shaping.
