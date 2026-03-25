# Lighthouse Dependency / Handoff Note

Date: 2026-03-25
Boundary: This note separates site responsibilities from Lighthouse responsibilities.

## 1) Site Responsibility (Now Implemented)

Implemented on site:
- Emit one page-load pageview event to POST /metrics/pageview.
- Suppress analytics when dev_mode cookie is present.
- Use sessionStorage dedupe for same-path events within 3 seconds.
- Use beacon-first transport with keepalive fetch fallback.
- Parse src only from query param ?src=.
- Parse UTM fields from query params when present.

Not implemented on site (by design):
- No retries.
- No unload-trigger analytics.
- No persistent user/session identity.
- No server-side analytics processing.

## 2) Lighthouse Responsibility (Pending / Next)

Required backend endpoint:
- Implement and operate POST /metrics/pageview.

Recommended ingestion responsibilities:
- Validate request JSON and accepted fields.
- Apply server-side timestamp received_at.
- Apply basic input normalization and size limits.
- Return fast success response for fire-and-forget clients.

Storage and data lifecycle:
- Persist pageview events or aggregated rollups.
- Define retention policy.
- Define archival/deletion policy.

Aggregation/reporting:
- Provide top paths.
- Provide top referrers.
- Provide source/UTM aggregations.
- Provide time-windowed trend views.

Protection/operational controls:
- Add endpoint rate limiting and burst suppression.
- Add abuse controls for malformed/high-volume submissions.
- Add monitoring/alerting for ingestion failures.

Smith reporting extensions (requested dependency class):
- Extend Lighthouse reporting outputs to include telemetry slices needed by Smith workflows.
- Confirm required schema/contract for Smith consumption (verify).

## 3) Suggested Minimal Contract (Lighthouse Side)

Expected input fields from current site emitter:
- type, client_ts, path, url, referrer, src (optional), utm (optional object), device, viewport, lang, tz.

Server-enriched fields recommended:
- received_at (server UTC timestamp)
- request_id (optional)
- ingest_version (optional)

## 4) Verify Flags for Handoff

- Verify: final Lighthouse accepted schema for /metrics/pageview.
- Verify: retention policy and compliance requirements for telemetry storage.
- Verify: reporting dimensions required by stakeholders before schema lock.
- Verify: whether Cloudflare analytics and first-party telemetry should be reconciled in a single reporting surface.
