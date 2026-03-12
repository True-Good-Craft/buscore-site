# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.2] — 2026-03-02

### Fixed
- Prevented duplicate Lighthouse `/pg/ping` POSTs per single explicit Calculate click by making the Calculate trigger explicit (`type="button"`) and adding a local in-flight guard in `App.tsx`.
- Preserved all pricing calculations and solver behavior; fix is trigger-only.

## [1.0.1] — 2026-03-02

### Added
- Added margin safety indicator system with spec-compliant messages ("Loss detected — You are selling below cost.", "Low margin — Risk of underpricing.")
- Expanded rounding modes edge-case unit tests ($10.00, $10.01, $10.99, $10.50 for all modes)
- Emphasized platform take visibility ("Platform keeps" line with semibold font weight and destructive color)
- Added integer math disclosure under app header
- PWA compliance hardening (manifest, icons, service worker all verified)
- Added deterministic edge-case tests (0% margin, 100% margin, 99% margin, profit mode, combined fees, shipping, impossible states)
- Added footer: "Price Guard — A True Good Craft Tool" linking to truegoodcraft.ca

## [Unreleased]

### Added
- **Free MVP polish** (SoT §Free MVP Polish):
  - Safety Indicator banner above Results: LOSS (red), LOW MARGIN (amber), OK (green)
  - "Platform keeps: $X (Y%)" line in cost breakdown
  - Reverse mode toggle ("Profit From Sale Price"): enter a known sale price, see fees/profit/margin
  - New rounding rules: `psych_0_95` ($X.95 psychological), `ceil_dollar` (ceiling to next dollar), `floor_dollar` (floor to previous dollar)
  - PWA support: `manifest.json`, service worker (`sw.js`), placeholder icons, `<meta name="theme-color">` in `index.html`
- Unit tests for new rounding rules, reverse mode, and safety indicator logic
- `docs/SOT.md` updated with "Free MVP Polish" section (SoT-first workflow)
- Removed redundant nested `price-guard-main/` subtree; repo has exactly one source tree
- Implemented MVP calculator (free mode): pricing engine, live UI, unit tests
- Repo bootstrap: scaffolding, Source-of-Truth spec, ADR, and placeholder UI
- `docs/SOT.md` — canonical product spec with formulas, inputs, outputs, and guardrails
- `docs/ADR/0001-tech-stack.md` — decision record choosing Vite + TypeScript
- `docs/deploy.md` — Cloudflare Pages deployment notes
- `README.md` — project overview, local dev instructions, and repo conventions
- `CHANGELOG.md` — this file
- `.gitignore` and `.editorconfig` — project-wide editor and VCS hygiene
- Vite + TypeScript app skeleton with placeholder two-panel layout
- `package.json` with `dev`, `build`, and `preview` scripts

## [1.0.0] — 2026-03-02

### Added
- Safety indicator banner (loss / low margin / success)
- Reverse calculation mode
- Expanded rounding rules (.99, .95, ceil, floor)
- Platform fee emphasis line
- PWA support (manifest + service worker + offline)

### Changed
- UI polish for public hosting
- Deterministic rounding verification loop extended

### Fixed
- Minor accessibility adjustments (if applicable)
