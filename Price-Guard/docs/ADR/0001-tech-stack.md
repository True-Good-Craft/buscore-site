# ADR 0001 — Tech Stack Choice

**Status:** Accepted  
**Date:** 2026-03-01  
**Deciders:** Project bootstrap

---

## Context

Price Guard is a single-page pricing calculator. It needs to:

1. Run as a fully static site on Cloudflare Pages (no backend).
2. Be maintainable by a single developer over time.
3. Stay lean — minimal dependencies, fast CI.
4. Support live-updating inputs → outputs without page reloads.

Two options were considered:

**Option A — Zero-build** (plain HTML + CSS + JS, no bundler)  
**Option B — Vite + TypeScript** (minimal modern toolchain)

---

## Decision

**Option B: Vite + TypeScript.**

---

## Rationale

| Concern | Zero-build (A) | Vite + TS (B) |
|---|---|---|
| Cloudflare Pages deploy | ✅ Simple (`/` as root) | ✅ `dist/` output |
| TypeScript (formula safety) | ❌ Manual or none | ✅ Built-in |
| Hot-reload dev experience | ❌ Manual browser refresh | ✅ Vite HMR |
| Bundle / tree-shake | ❌ None | ✅ Rollup-based |
| Dependency count | 0 runtime | devDeps only (no runtime deps) |
| Future module growth | ❌ Global scripts scale poorly | ✅ ESM modules |
| Learning curve | ✅ Zero | Low (Vite is well-documented) |

Vite adds only `vite` and `typescript` as devDependencies — zero runtime deps. The output is plain HTML/CSS/JS identical to Option A, so the Cloudflare Pages deploy is equally simple. TypeScript catches formula errors at compile time, which is important for a correctness-critical pricing tool.

Zero-build was rejected because global-script files don't scale cleanly as formula modules grow, and there is no type safety on the math.

---

## Consequences

- `npm run dev` starts a Vite dev server with HMR.
- `npm run build` emits static files to `dist/`.
- Cloudflare Pages build command: `npm run build`, output dir: `dist`.
- No UI framework (React, Vue, etc.) is added; plain TypeScript + DOM manipulation keeps the bundle tiny.
- If a UI framework is ever needed, a new ADR must be written first.
