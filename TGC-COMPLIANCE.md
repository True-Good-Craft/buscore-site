# TGC Compliance

## 1. Canonical standard
- Canonical governance standard: `tgc-ops/governance/tgc-repository-standard.md`

## 2. Repo identity
- Repo name: buscore-site
- Repo class: website/static site repo
- Canonical branch: main
- Local authority docs:
  - SOT.md
  - wrangler.jsonc

## 3. Compliance status
- Status: PARTIAL
- Source audit report: `tgc-ops/indexes/daily-estate-compliance-report.md`
- Source audit UTC: 2026-03-23T23:32:27.1579301Z
- Last projected by: Codex Local Automation
- Projection date UTC: 2026-03-23T23:36:40.2738495Z

## 4. Baseline checks
- README: NO
- Canonical SoT / authority doc: YES
- Boundary clarity: YES
- Deployment authority declared: YES
- Version/release authority declared: PARTIAL
- Dependency declaration present: YES
- Continuity start present: YES
- Registered in tgc-ops: YES

## 5. Current gaps
- README.md is missing.
- Version/release authority remains implicit in `SOT.md`.

## 6. Required remediation
- Add a concise root README with authority/version pointers, then refresh `TGC-COMPLIANCE.md` to match the current doc set.

## 7. Justified exceptions
- Static site repo; dependency and continuity posture can remain lightweight if explicit.

## 8. Authority note
- Local implementation truth remains in local repository authority docs.
- `tgc-ops` standard is canonical for estate governance.
- This file is the only repo-local governance snapshot `tgc-ops` may update by default.
