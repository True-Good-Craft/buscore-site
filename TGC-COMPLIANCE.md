# TGC Compliance

## 1. Canonical standard
- Canonical governance standard: https://github.com/True-Good-Craft/tgc-ops/blob/main/governance/tgc-repository-standard.md

## 2. Repo identity
- Repo name: buscore-site
- Repo class: website/static site repo
- Canonical branch: main
- Local authority docs:
  - SOT.md
  - wrangler.jsonc

## 3. Compliance status
- Status: PARTIAL
- Last audited by: tgc-ops governance-and-rollout pass
- Audit date: 2026-03-14

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
- README missing.
- Version/release authority not clearly declared as authority contract.

## 6. Required remediation
- Add concise README with repo purpose, canonical SoT pointer, deployment authority, dependency posture, and explicit version/release authority statement.

## 7. Justified exceptions
- Static site repo; dependency and continuity posture can remain lightweight if explicit.

## 8. Authority note
- Local implementation truth remains in local repository authority docs.
- tgc-ops is canonical for estate governance standards, compliance matrix, drift tracking, and remediation planning.
- By default, this is the only repo-local governance/compliance snapshot file that tgc-ops may update.
