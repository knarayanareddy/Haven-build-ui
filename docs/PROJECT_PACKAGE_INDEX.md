# HAVEN Complete Package Index

This document is the top-level index for the HAVEN production-shaped package.

## Start here

1. `README.md` — complete project overview and usage.
2. `designdoc.md` — original single source of truth design document.
3. `docs/implementation/DESIGN_DOC_DIFF.md` — design-doc-to-build coverage diff.
4. `docs/implementation/PHASE_COVERAGE_AUDIT.md` — phase-by-phase implementation audit.
5. `docs/implementation/HARDENING_CLOSURE_REPORT.md` — hardening status and remaining external gates.

## App surfaces

| Surface | Path | Purpose |
|---|---|---|
| iPhone suite | `apps/iphone-suite/index.html` | Full product preview in an iPhone frame |
| Family dashboard preview | `apps/family-dashboard/index.html` | Consent-scoped family dashboard preview |
| Admin console | `apps/admin-console/index.html` | Compliance/release/admin view |
| Carer portal | `apps/carer-portal/index.html` | WACHT professional care surface |
| Browser Shield | `apps/browser-shield` | Manifest V3 browser protection scaffold |
| Elder app | `apps/elder` | Expo app scaffold |
| Family app | `apps/family` | Next.js dashboard scaffold |
| Grandchild app | `apps/grandchild` | Child-friendly companion scaffold |

## Backend

| Area | Path |
|---|---|
| Supabase migrations | `supabase/migrations` |
| Edge Functions | `supabase/functions` |
| Local seed data | `supabase/seed.sql` |
| Supabase local config | `supabase/config.toml` |
| Function catalog | `docs/api/EDGE_FUNCTION_CATALOG.md` |
| OpenAPI | `docs/api/openapi.yaml` |

## Packages

| Package | Path | Purpose |
|---|---|---|
| contracts | `packages/contracts` | domain/API TypeScript contracts |
| database | `packages/database` | generated-style DB type surface |
| i18n | `packages/i18n` | English/Dutch product copy |
| scam-engine | `packages/scam-engine` | local rule-based scam scoring |
| schema | `packages/schema` | screen schema and validator |
| ui | `packages/ui` | design tokens and component specs |

## ML and safety assets

| Asset | Path |
|---|---|
| scam dataset schema | `ml/dataset/schema.ts` |
| dataset manifest | `ml/dataset/manifest.yaml` |
| Dutch scam reasoning prompt | `ml/prompts/scam_reasoning_nl.ts` |
| heuristic rules | `ml/heuristics/rules.json` |

## Testing and QA

| Test area | Path |
|---|---|
| Edge tests | `tests/edge` |
| RLS/storage audit tests | `tests/rls` |
| E2E smoke tests | `tests/e2e` |
| Maestro mobile flows | `.maestro` |
| Playwright config | `playwright.config.ts` |
| accessibility protocol | `docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md` |
| pentest scope | `docs/release/PENTEST_SCOPE.md` |
| elder usability protocol | `docs/release/ELDER_USABILITY_PROTOCOL.md` |

## Release documents

| Document | Path |
|---|---|
| App Store metadata | `docs/release/APP_STORE_METADATA.md` |
| Play Store metadata | `docs/release/PLAY_STORE_METADATA.md` |
| Privacy Policy EN | `docs/release/PRIVACY_POLICY_EN.md` |
| Privacy Policy NL | `docs/release/PRIVACY_POLICY_NL.md` |
| Copy review | `docs/release/COPY_REVIEW.md` |
| Production runbook | `docs/runbooks/PRODUCTION_RUNBOOK.md` |

## Deployment

| Script | Path |
|---|---|
| validate suite | `scripts/validate-suite.mjs` |
| local Supabase check | `scripts/check-local-supabase.sh` |
| deployment environment check | `scripts/deploy/check-production-env.sh` |
| Supabase deployment | `scripts/deploy/deploy-supabase.sh` |

## Current verification command

```bash
corepack pnpm test
```
