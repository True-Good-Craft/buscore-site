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

Navigation pattern observed:

- Main nav appears on all primary pages: `Home`, `Downloads`, `Changelog`, `Trust`, `Community`, `Contact`.
- Footer legal links commonly include `Privacy` and `License` (except `404.html`, which has a minimal footer).

## 4. Download Behavior

Current download behavior is mixed dynamic + static:

- Latest download section in `downloads.html` initializes placeholders (`Download Latest`, release notes placeholder, checksum placeholder, size placeholder).
- Client-side JS fetches `/manifest/core/stable.json` with `{ cache: 'no-store' }`.
- If manifest has required fields, page updates latest section with:
  - `latest.version`
  - `latest.download.url` (fallback to `latest.url`)
  - `latest.download.sha256`
  - `latest.size_bytes`
  - `latest.release_notes_url` (if missing, notes link is hidden)
- On fetch/validation failure, script fail-softs and leaves fallback static placeholders.

Previous-version behavior:

- `downloads.html` includes hardcoded previous-version buttons and SHA256 values.
- These links target direct Cloudflare R2 public object URLs (`*.r2.dev`) under `/releases/<version>/...zip`.

Distribution source summary:

- Latest artifact URL source: `manifest/core/stable.json`.
- Current latest artifact host: Cloudflare R2 public domain (`pub-...r2.dev`).
- Previous artifacts: direct hardcoded R2 links in HTML.
- No local files under `downloads/` are used for downloadable binaries in the current repository state.

## 5. Release Notes

Release information is presented in two ways:

- On-site changelog content is embedded directly in `changelog.html` as static HTML sections (`Website Update - March 2026`, `v0.11.0`, `v0.10.6`, `v0.10.0-beta`).
- Download page "latest release notes" link is manifest-driven (`latest.release_notes_url`). Current manifest points to GitHub release tag URL:
  - `https://github.com/True-Good-Craft/TGC-BUS-Core/releases/tag/1.0.0`

URL structure findings:

- On-site changelog URL: `/changelog.html`.
- External release notes URL pattern (current manifest): GitHub `releases/tag/<version>`.

## 6. Lighthouse Interaction

Lighthouse-specific interaction is not evidenced in this repository.

Observed integration endpoints/refs:

- Manifest endpoint consumed by website JS: `/manifest/core/stable.json`.
- Artifact distribution endpoints: Cloudflare R2 direct URLs (`pub-...r2.dev/releases/...`).
- No explicit references to "Lighthouse" endpoints, APIs, redirects, or telemetry hooks were found in site code.

Conclusion for this section:

- Lighthouse interaction: Not determined from repository evidence.

## 7. Analytics / Telemetry

Website analytics evidence:

- Cloudflare Web Analytics beacon script appears on all inspected HTML pages (`index.html`, `downloads.html`, `changelog.html`, `trust.html`, `contact.html`, `privacy.html`, `license.html`, `404.html`).
- Script source: `https://static.cloudflareinsights.com/beacon.min.js`.
- A Cloudflare beacon token is provided via `data-cf-beacon`.

Repository-visible tracking detail:

- Exact collected fields are not explicitly defined in repository JavaScript code (script is loaded remotely).
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
| Latest download is manifest-driven | `downloads.html` | JS fetches `/manifest/core/stable.json`; fail-soft if invalid/unavailable |
| Latest artifact URL is external object storage | `manifest/core/stable.json` | `latest.download.url` currently points to Cloudflare R2 URL |
| Previous downloads are hardcoded | `downloads.html` | Multiple static versioned R2 links + static SHA256 blocks |
| Latest release notes link is external | `manifest/core/stable.json` | Current URL points to GitHub release tag |
| Changelog is published on-site as static content | `changelog.html` | Separate from manifest-driven latest release notes link |
| Website analytics script is embedded page-wide | `index.html` (and peers) | Cloudflare beacon loaded on all inspected pages |
| Crawl metadata is explicitly declared | `robots.txt`, `sitemap.xml` | Sitemap URL points to `https://buscore.ca/sitemap.xml` |
| 404 handling uses custom static page | `404.html` | Includes standard nav and return-home link |
| Active stylesheet for pages is root CSS | `style.css` | Linked by all inspected HTML pages |

## 10. Observed Drift or Ambiguities

Objective drifts/ambiguities based on repository evidence:

- Version-source drift across surfaces:
  - `manifest/core/stable.json` latest version is `1.0.0`.
  - `downloads.html` hardcoded previous versions top out at `v0.10.6.0`.
  - `changelog.html` includes `v0.11.0` entry and no `1.0.0` section.
- Telemetry messaging vs implementation surface:
  - `trust.html` says "No background analytics. No usage tracking."
  - Site pages include Cloudflare Web Analytics beacon script.
  - `privacy.html` partially reconciles this by distinguishing app privacy from website analytics.
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

| Slug | Title | Published |
|---|---|---|
| `spreadsheets-to-buscore` | When Spreadsheets Stop Working: The Messy Middle of Small Manufacturing | 2026-03-11 |

**Navigation:** Blog link appears in the main nav of all site pages between Community and Contact.

**Stylesheet:** Blog styles are appended to the root `style.css` under the `/* BLOG STYLES */` comment block. No separate stylesheet.

**Not present by design:** No CMS, no Markdown pipeline, no build step, no tags, no pagination, no RSS (deferred to future).

---
