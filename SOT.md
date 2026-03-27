# SOT_WEBSITE.md

## 1. Website Purpose

BUS Core website is a static marketing-and-distribution site for the BUS Core desktop/local product, with these repository-backed purposes:

- Present product positioning and capabilities (`index.html`).
- Provide release download access and checksums (`downloads.html`, `manifest/core/stable.json`).
- Provide release/change history (`changelog.html`).
- Provide trust/security statements, contact routes, privacy, and licensing (`trust.html`, `contact.html`, `privacy.html`, `license.html`).
- Provide crawl metadata (`robots.txt`, `sitemap.xml`).
- Provide a first-party blog for product-adjacent and ops-adjacent content (`blog/`).

The site is not implemented as a web app backend in this repository; behavior is static HTML/CSS with one client-side fetch in `downloads.html`.

## 2. Directory Structure

Concise structure map (major items only):

```text
/
  index.html
  downloads.html
  changelog.html
  trust.html
  contact.html
  privacy.html
  license.html
  404.html
  style.css
  site.webmanifest
  robots.txt
  sitemap.xml
  manifest/
    core/
      stable.json
  assets/
    Logo.png
    css/style.css
    placeholders/
      *.jpg, *.png
    images/   (empty)
    js/       (empty)
downloads/  (empty)
blog/
index.html
_post-template.html
spreadsheets-to-buscore/
index.html
```

Role of major files/folders:

- `index.html`: landing page, product explanation, CTA to downloads and GitHub repo.
- `downloads.html`: latest download panel (dynamic from manifest) plus hardcoded previous version links.
- `changelog.html`: on-site, static changelog sections.
- `trust.html`: trust/security claims for product behavior.
- `contact.html`: email/community/company contact paths.
- `privacy.html`: privacy statement, including website analytics statement.
- `license.html`: AGPL/commercial license terms.
- `404.html`: custom not-found page.
- `style.css`: active site stylesheet used by all pages.
- `assets/css/style.css`: second stylesheet present in repo; not referenced by current HTML.
- `manifest/core/stable.json`: machine-readable latest release metadata consumed by `downloads.html`.
- `site.webmanifest`: web app manifest file present in repo.
- `downloads/`: empty directory; no local downloadable artifacts in current tree.

## 3. Page Inventory

| Page file | Purpose | Navigation role | External links present |
|---|---|---|---|
| `index.html` | Landing page with product narrative, capabilities, install summary | Primary `Home` page in top nav | GitHub repo, Reddit community |
| `downloads.html` | Download distribution page with latest + previous versions | Primary `Downloads` page in top nav | R2 artifact URLs, optional GitHub release notes URL via manifest, Reddit |
| `changelog.html` | Release/change history shown on-site | Primary `Changelog` page in top nav | Reddit in nav |
| `trust.html` | Trust/security claims for product architecture and data handling | Primary `Trust` page in top nav | Reddit in nav |
| `contact.html` | Contact and community channels | Primary `Contact` page in top nav | mailto link, Reddit, Discord, parent company URL |
| `privacy.html` | Privacy policy | Footer-linked legal page | Reddit in nav |
| `license.html` | Licensing terms (AGPL + commercial) | Footer-linked legal page | AGPL URL, Reddit in nav |
| `404.html` | Not-found handling with return-home link | Directly visited on missing route | Reddit in nav |
| `what-is-bus-core/index.html` | Positioning / definition page: defines what BUS Core is, the problem space, and where it fits relative to spreadsheets and ERP | Not in primary nav; linked from homepage philosophy section | None |

Navigation pattern observed:

- Main nav appears on all primary pages: `Home`, `Downloads`, `Changelog`, `Trust`, `Community`, `Contact`.
- Footer legal links commonly include `Privacy` and `License` (except `404.html`, which has a minimal footer).

## 4. Download Behavior

Current download behavior is mixed dynamic + static:

- Latest download section in `downloads.html` initializes placeholders (`Download Latest`, release notes placeholder, checksum placeholder, size placeholder).
- Client-side JS fetches `https://lighthouse.buscore.ca/manifest/core/stable.json` with `{ cache: 'no-store' }` for release metadata hydration.
- Primary official latest-download CTA remains fixed to `https://lighthouse.buscore.ca/download/latest` to preserve counted explicit download intent.
- If manifest has required fields, page updates latest section with:
  - `latest.version`
  - `latest.download.sha256`
  - `latest.size_bytes`
  - `latest.release_notes_url`
- On fetch/validation failure, script fail-softs and leaves fallback static placeholders.

Previous-version behavior:

- `downloads.html` includes hardcoded previous-version buttons and SHA256 values.
- These links target direct Cloudflare R2 public object URLs (`*.r2.dev`) under `/releases/<version>/...zip`.

Distribution source summary:

- Latest artifact URL source: `manifest/core/stable.json`.
- Current latest artifact host: Cloudflare R2 public domain (`pub-...r2.dev`).
- Previous artifacts: direct hardcoded R2 links in HTML.
- No local files under `downloads/` are used for downloadable binaries in the current repository state.
- Website page hydration intentionally does not call counted Lighthouse update-check routes.

## 5. Release Notes

Release information is presented in two ways:

- On-site changelog content is embedded directly in `changelog.html` as static HTML sections (`Website Update - March 2026`, `v0.11.0`, `v0.10.6`, `v0.10.0-beta`).
- Download page "latest release notes" link is manifest-driven (`latest.release_notes_url`). Current manifest points to GitHub release tag URL:
  - `https://github.com/True-Good-Craft/TGC-BUS-Core/releases/tag/1.0.0`

URL structure findings:

- On-site changelog URL: `/changelog.html`.
- External release notes URL pattern (current manifest): GitHub `releases/tag/<version>`.

## 6. Lighthouse Interaction

Lighthouse interaction is explicit in repository code for the Downloads page.

Observed integration endpoints/refs:

- Public manifest endpoint consumed by website JS: `https://lighthouse.buscore.ca/manifest/core/stable.json`.
- Counted latest-download intent route used by primary CTA: `https://lighthouse.buscore.ca/download/latest`.
- No `/update/check` usage was found in site page-rendering code.

Conclusion for this section:

- Website hydration uses non-counted public manifest reads; counted intent remains on explicit download click.

## 7. Analytics / Telemetry

Website analytics evidence:

- All served HTML pages load a shared analytics loader include: `<script src="/assets/js/site-analytics.js" defer></script>`.
- Cloudflare beacon script is injected by the shared loader using source `https://static.cloudflareinsights.com/beacon.min.js` and configured token.
- Inline per-page Cloudflare analytics blocks are removed from served pages.

Repository-visible tracking detail:

- Lighthouse payload fields are explicitly defined in `.deploy/assets/js/site-analytics.js`.
- Payload includes pageview fields plus anonymous continuity fields: `anon_user_id`, `session_id`, `is_new_user`.
- Continuity state is site-side only:
  - `bc_uid` first-party cookie (UUIDv4, 365 days, Path=/, SameSite=Lax, Secure)
  - `bc_sid` and `bc_last_activity_at` in sessionStorage
  - Session rollover at 30 minutes inactivity
- Kill-switch behavior for `localStorage.noAnalytics === "1"` clears `bc_uid` and analytics session keys and suppresses Cloudflare + Lighthouse emission.
- `privacy.html` states website collects limited aggregate metrics including page views and download counts.

Application telemetry distinction in content:

- Trust/privacy copy states the BUS Core application itself has no telemetry.
- Website analytics script is still present on the website pages.

## 8. External Dependencies

External services/domains directly used by the site:

- Cloudflare Web Analytics: `static.cloudflareinsights.com`.
- Cloudflare R2 public object storage for binaries: `pub-9908523f6c644d55a2e018f04240340f.r2.dev`.
- GitHub repository/release pages: `github.com/True-Good-Craft/TGC-BUS-Core`.
- Reddit community: `www.reddit.com/r/BUS_Core/`.
- Discord invite (contact page): `discord.gg/xfcDcvrXPK`.
- Parent company site link (contact page): `truegoodcraft.ca`.
- AGPL reference URL (license page): `www.gnu.org/licenses/agpl-3.0.html`.

## 9. Canonical Behaviors

| Behavior | Source file | Notes |
|---|---|---|
| Main navigation appears site-wide | `index.html` (pattern repeated across pages) | Core nav entries: Home/Downloads/Changelog/Trust/Community/Contact |
| Latest release metadata hydration uses canonical manifest route | `downloads.html` | JS fetches `https://lighthouse.buscore.ca/manifest/core/stable.json`; fail-soft if invalid/unavailable |
| Primary latest-download CTA is counted route | `downloads.html` | Main CTA targets `https://lighthouse.buscore.ca/download/latest` |
| Latest artifact URL is external object storage | `manifest/core/stable.json` | `latest.download.url` currently points to Cloudflare R2 URL |
| Previous downloads are hardcoded | `downloads.html` | Multiple static versioned R2 links + static SHA256 blocks |
| Latest release notes link is external | `manifest/core/stable.json` | Current URL points to GitHub release tag |
| Changelog is published on-site as static content | `changelog.html` | Separate from manifest-driven latest release notes link |
| Website analytics uses one shared loader page-wide | `.deploy/assets/js/site-analytics.js` | Shared include on served pages; loader handles Cloudflare + Lighthouse |
| Anonymous continuity is implemented in loader | `.deploy/assets/js/site-analytics.js` | `bc_uid` cookie + `bc_sid` sessionStorage + `is_new_user` payload field |
| Privacy controls are bound by data attributes | `.deploy/privacy.html` | `data-analytics-optout`, `data-analytics-optin`, `data-analytics-status` |
| Crawl metadata is explicitly declared | `robots.txt`, `sitemap.xml` | Sitemap URL points to `https://buscore.ca/sitemap.xml` |
| 404 handling uses custom static page | `404.html` | Includes standard nav and return-home link |
| Active stylesheet for pages is root CSS | `style.css` | Linked by all inspected HTML pages |

## 10. Observed Drift or Ambiguities

Objective drifts/ambiguities based on repository evidence:

- Version-source drift across surfaces:
  - `manifest/core/stable.json` latest version is `1.0.0`.
  - `downloads.html` hardcoded previous versions top out at `v0.10.6.0`.
  - `changelog.html` includes `v0.11.0` entry and no `1.0.0` section.
- Telemetry wording and implementation are now aligned in served pages:
  - Trust text distinguishes app telemetry from website analytics.
  - Privacy text discloses anonymous return-visit/session measurement and provides opt-out/opt-in controls.
- `site.webmanifest` exists but no `<link rel="manifest" ...>` was found in HTML pages.
- `assets/css/style.css` exists but current pages link root `style.css` only.
- `downloads/` directory exists but is empty; download delivery is external (R2 URLs and manifest URL values).
- Any relationship to "Lighthouse" beyond user-provided context is not visible in site code.
  - Lighthouse interaction: Not determined from repository evidence.

## 11. Blog

The blog is a first-party, static HTML blog hosted at `buscore.ca/blog/`.

**Purpose:** Product-adjacent and ops-adjacent content. Topics include: why spreadsheets fail for small manufacturing operations, the gap between spreadsheets and ERP, BUS Core release and hardening writeups, and local-first/self-host operational content.

**URL structure:**
- Index: `/blog/` → `blog/index.html`
- Posts: `/blog/{slug}/` → `blog/{slug}/index.html`

**Content model (per post):**
- Title (`<title>`, `<h1>`)
- Slug (directory name, permanent)
- Meta description
- Canonical URL
- Publish date (`<time>` element + `article:published_time`)
- OG tags: title, description, url, image, type=article
- Twitter card tags
- Author: True Good Craft Inc.

**OG image:** All posts use `/assets/images/og-default.png` as the default fallback until post-specific images are available.

**Operational model:**
1. Copy `blog/_post-template.html` to `blog/{slug}/index.html`
2. Fill all fields marked FILL
3. Add one `<article>` entry to the top of `blog/index.html`
4. Add a `<url>` entry to `sitemap.xml`
5. Deploy

**Published posts:**

| Slug | Title | Published | Cluster role |
|---|---|---|---|
| `the-awkward-middle-between-spreadsheets-and-erp` | The Awkward Middle Between Spreadsheets and ERP | 2026-03-11 | Flagship category article |
| `spreadsheets-to-buscore` | When Spreadsheets Stop Working: The Messy Middle of Small Manufacturing | 2026-03-11 | Symptom / entry article |
| `inventory-drift` | Inventory Drift: Why Your Numbers Stop Matching Reality | 2026-03-22 | Deep-dive support article |
| `traceability-before-erp` | Traceability Before ERP | 2026-03-22 | Deep-dive support article |
| `field-guide` | Small Shop Operations Field Guide | 2026-03-22 | Hub / router page |
| `why-4-overnight-downloads-matter-more-than-400-empty-impressions` | Why 4 Overnight Downloads Matter More Than 400 Empty Impressions | 2026-03-13 | Founder / signal article |

**Blog content-cluster architecture:**

The blog operates as a flagship cluster with distinct article roles:

- **Flagship category article** (`the-awkward-middle-between-spreadsheets-and-erp`): Defines the spreadsheet-to-ERP gap as a real operational stage. Strongest article in the cluster. Covers: why spreadsheets stop scaling, what breaks in the messy middle, the trust collapse, why ERP overshoots, what this phase needs, and why this is a real category.
- **Symptom / entry article** (`spreadsheets-to-buscore`): Entry point for readers experiencing early spreadsheet failures. Covers: what breaks first (inventory, costing, history). Bridges readers forward to the flagship article. Does not duplicate the flagship's gap/ERP analysis.
- **Deep-dive support articles** (`inventory-drift`, `traceability-before-erp`): Narrowly scoped explorations of specific operational problems. Do not drift into generic "why spreadsheets fail" territory. Each links to the flagship, the field guide, and downloads.
- **Hub / router page** (`field-guide`): Routes readers to the right article based on their symptom or shop type. Links to all cluster articles, all use-case pages, and downloads. Contains no long-form article content.
- **Founder / signal article** (`why-4-overnight-downloads-matter-more-than-400-empty-impressions`): Builder/traction perspective piece. Not forced into shop-floor framing. Links into the main cluster via field guide and flagship references.

**Intended reading path:**
1. Entry article (spreadsheets-to-buscore) → flagship article (the-awkward-middle)
2. Flagship article → field guide / deep dives → downloads
3. Field guide acts as a lateral router at any point in the path

**Blog URL inventory:**
- `/blog/` — index / router
- `/blog/field-guide/` — hub page
- `/blog/inventory-drift/` — deep-dive
- `/blog/spreadsheets-to-buscore/` — symptom entry
- `/blog/the-awkward-middle-between-spreadsheets-and-erp/` — flagship
- `/blog/traceability-before-erp/` — deep-dive
- `/blog/why-4-overnight-downloads-matter-more-than-400-empty-impressions/` — founder signal

**Navigation:** Blog link appears in the main nav of all site pages between Community and Contact.

**Stylesheet:** Blog styles are appended to the root `style.css` under the `/* BLOG STYLES */` comment block. No separate stylesheet.

**Not present by design:** No CMS, no Markdown pipeline, no build step, no tags, no pagination, no RSS (deferred to future).

---
