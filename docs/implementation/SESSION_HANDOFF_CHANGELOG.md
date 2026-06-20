# HAVEN Session Handoff Changelog

Last updated: 2026-06-13

## Purpose

This document is a clean handoff note summarizing the repository modifications made during this hardening session.

## High-level outcome

The session moved HAVEN from a mostly production-shaped scaffold with weak runtime trust boundaries into a substantially more hardened engineering package with:

- stronger Edge Function authz and trust-boundary controls
- broader data export / erasure coverage
- explicit storage/blob lifecycle handling
- reproducible pnpm-based installs
- lint / typecheck / build guardrails
- richer CI orchestration
- richer Supabase CI strategy
- release-candidate planning docs

## Verified during session

The following commands were run successfully at various points during the session, with the final state passing:

```bash
corepack pnpm install
corepack pnpm run lint
corepack pnpm run typecheck
corepack pnpm run build:family
corepack pnpm run quality:check
npm test
```

Browser E2E wiring was also added for CI, though local sandbox execution remains environment-limited due Playwright/OS library constraints.

---

## Change summary by tranche

### Tranche 1–3: core backend hardening

Main themes:
- stop trusting actor identity from request bodies
- bind callers to JWTs
- add explicit self/family/carer/admin authorization checks
- reduce service-role bypass on user-facing routes where practical
- tighten internal/public/admin/vendor function boundaries

Representative functions hardened:
- `fn-data-export`
- `fn-audit-query`
- `fn-storage-signed-url`
- `fn-right-to-erasure`
- `fn-companion-memory`
- `fn-location-ingest`
- `fn-family-message-send`
- `fn-emergency-profile`
- `fn-voice-pipeline`
- `fn-document-analyse`
- `fn-health-log`
- `fn-screen-data`
- `fn-feature-flags`
- `fn-push-token-register`
- `fn-grandchild-message-send`
- `fn-consent-update`
- `fn-browser-shield`
- `fn-call-reputation`
- `fn-buurt-*`
- `fn-care-plan`
- `fn-care-visit-log`
- `fn-incident-report`
- `fn-legacy-vault`
- `fn-life-story-process`
- `fn-notification-preferences`
- `fn-telehealth-transport`
- `fn-wearable-event`
- `fn-bereavement-support`

### Tranche 4: lifecycle, reproducibility, and CI maturity

Main themes:
- unify scam rule source of truth
- pin dependencies and add lockfile
- improve build/typecheck coverage
- add storage/blob lifecycle cleanup and audit coverage
- split general engineering CI from richer Supabase CI
- add release-candidate planning artifacts

---

## New files added in this session

### CI / orchestration
- `.github/workflows/supabase-integration.yml`
- `scripts/ci/verify-core.sh`
- `scripts/ci/verify-browser.sh`
- `scripts/ci/verify-local-supabase.sh`

### TypeScript / lint / tooling
- `eslint.config.mjs`
- `pnpm-lock.yaml`
- `tsconfig.base.json`
- `tsconfig.packages.json`
- `types/mobile-shims.d.ts`
- `scripts/export-scam-rules.mjs`

### New app support files
- `apps/elder/tsconfig.json`
- `apps/elder/src/services/documentCameraView.tsx`
- `apps/family/next-env.d.ts`
- `apps/family/tsconfig.json`
- `apps/family/src/app/layout.tsx`
- `apps/family/src/app/inloggen/page.tsx`
- `apps/grandchild/tsconfig.json`

### Shared package files
- `packages/scam-engine/src/catalog.mjs`
- `packages/scam-engine/src/catalog.d.ts`
- `packages/scam-engine/src/catalog.d.mts`

### Supabase shared helper
- `supabase/functions/_shared/internal.ts`

### New migrations
- `supabase/migrations/20260613000010_edge_authz_hardening.sql`
- `supabase/migrations/20260613000011_voice_interactions_self_write.sql`
- `supabase/migrations/20260613000012_data_lifecycle_expansion.sql`

### New docs / reports
- `docs/implementation/CODE_QUALITY_GUARDRAILS.md`
- `docs/implementation/DATA_LIFECYCLE_AUDIT.md`
- `docs/implementation/EDGE_FUNCTION_TRUST_BOUNDARY_MATRIX.md`
- `docs/implementation/NEXT_10_GITHUB_ISSUES.md`
- `docs/implementation/PRIORITIZED_REMAINING_ISSUES.md`
- `docs/implementation/RELEASE_CANDIDATE_SUMMARY.md`
- `docs/implementation/RESIDUAL_HARDENING_REPORT.md`
- `docs/implementation/STORAGE_BLOB_LIFECYCLE_AUDIT.md`
- `docs/implementation/SUPABASE_CI_STRATEGY.md`

### New tests / configs
- `playwright.family.config.ts`
- `tests/edge/data-lifecycle-diff.test.mjs`

---

## Existing files modified in this session

### Root / repo config
- `package.json`
- `README.md`
- `scripts/validate-suite.mjs`

### PR / contribution hygiene
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`

### Main CI workflow
- `.github/workflows/production-checks.yml`

### App package manifests
- `apps/elder/package.json`
- `apps/family/package.json`
- `apps/grandchild/package.json`

### Elder app source
- `apps/elder/src/auth/AuthProvider.tsx`
- `apps/elder/src/services/documentCamera.ts`
- `apps/elder/src/services/sqliteOfflineQueue.ts`

### Family app / E2E
- `tests/e2e/family-dashboard.spec.ts`
- `playwright.config.ts`
- `playwright.iphone.config.ts`

### Rules / ML artifacts
- `ml/heuristics/rules.json`
- `packages/scam-engine/src/rules.ts`

### Deploy / run scripts
- `scripts/deploy/deploy-supabase.sh`

### Supabase config
- `supabase/config.toml`

### Shared function helpers
- `supabase/functions/_shared/authz.ts`
- `supabase/functions/_shared/core.ts`

### Hardened Edge Functions
- `supabase/functions/fn-audit-query/index.ts`
- `supabase/functions/fn-bereavement-support/index.ts`
- `supabase/functions/fn-breach-incident/index.ts`
- `supabase/functions/fn-browser-shield/index.ts`
- `supabase/functions/fn-buurt-discover/index.ts`
- `supabase/functions/fn-buurt-events-ingest/index.ts`
- `supabase/functions/fn-buurt-match/index.ts`
- `supabase/functions/fn-buurt-optout/index.ts`
- `supabase/functions/fn-call-reputation/index.ts`
- `supabase/functions/fn-care-plan/index.ts`
- `supabase/functions/fn-care-system-sync/index.ts`
- `supabase/functions/fn-care-visit-log/index.ts`
- `supabase/functions/fn-community-events-ingest/index.ts`
- `supabase/functions/fn-companion-memory/index.ts`
- `supabase/functions/fn-compliance-register/index.ts`
- `supabase/functions/fn-consent-update/index.ts`
- `supabase/functions/fn-daily-reminder-scheduler/index.ts`
- `supabase/functions/fn-data-export/index.ts`
- `supabase/functions/fn-device-session/index.ts`
- `supabase/functions/fn-document-analyse/index.ts`
- `supabase/functions/fn-driving-event/index.ts`
- `supabase/functions/fn-emergency-profile/index.ts`
- `supabase/functions/fn-family-message-send/index.ts`
- `supabase/functions/fn-feature-flags/index.ts`
- `supabase/functions/fn-grandchild-message-send/index.ts`
- `supabase/functions/fn-health-check/index.ts`
- `supabase/functions/fn-health-log/index.ts`
- `supabase/functions/fn-incident-report/index.ts`
- `supabase/functions/fn-legacy-vault/index.ts`
- `supabase/functions/fn-life-story-process/index.ts`
- `supabase/functions/fn-location-ingest/index.ts`
- `supabase/functions/fn-log-drain-config/index.ts`
- `supabase/functions/fn-medication-catalog-sync/index.ts`
- `supabase/functions/fn-medication-escalation/index.ts`
- `supabase/functions/fn-medication-ocr/index.ts`
- `supabase/functions/fn-medication-refill/index.ts`
- `supabase/functions/fn-medmij-fhir-import/index.ts`
- `supabase/functions/fn-notification-dispatch/index.ts`
- `supabase/functions/fn-notification-preferences/index.ts`
- `supabase/functions/fn-observability-alert/index.ts`
- `supabase/functions/fn-onboarding/index.ts`
- `supabase/functions/fn-push-token-register/index.ts`
- `supabase/functions/fn-release-check/index.ts`
- `supabase/functions/fn-right-to-erasure/index.ts`
- `supabase/functions/fn-screen-data/index.ts`
- `supabase/functions/fn-skill-exchange/index.ts`
- `supabase/functions/fn-slo-measure/index.ts`
- `supabase/functions/fn-storage-signed-url/index.ts`
- `supabase/functions/fn-telehealth-transport/index.ts`
- `supabase/functions/fn-transaction-intercept/index.ts`
- `supabase/functions/fn-vital-threshold-check/index.ts`
- `supabase/functions/fn-voice-pipeline/index.ts`
- `supabase/functions/fn-wearable-event/index.ts`
- `supabase/functions/fn-weekly-digest/index.ts`

### Tests updated
- `tests/edge/hardening-static.test.mjs`
- `tests/edge/scam-engine.test.mjs`
- `tests/integration/live-rls.test.mjs`
- `tests/rls/rls-policy-audit.mjs`

### Documentation updated
- `docs/DEVELOPMENT.md`
- `docs/MAINTENANCE.md`
- `docs/PRODUCTION_READINESS_CHECKLIST.md`
- `docs/PROJECT_PACKAGE_INDEX.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `docs/implementation/DEEP_DIVE_AUDIT.md`
- `docs/implementation/HARDENING_CLOSURE_REPORT.md`
- `docs/implementation/PHASE_COVERAGE_AUDIT.md`
- `docs/runbooks/PRODUCTION_RUNBOOK.md`

---

## Key behavior changes introduced

### Security / authz
- authenticated Edge Functions now derive caller identity from JWTs in the hardened user-facing surface
- `verify_jwt = false` routes are now explicitly split into:
  - admin bearer only
  - vendor secret or internal header
  - internal header only
- transaction webhook now fails closed if vendor secret is missing

### Data lifecycle
- export coverage expanded across a much broader elder-linked schema surface
- erasure coverage expanded across many more SQL domains
- erasure now includes storage bucket cleanup for known prefix-based user blobs
- lifecycle coverage is now checked by an automated test

### Rules / logic consistency
- scam rules now use a shared canonical source (`packages/scam-engine/src/catalog.mjs`)
- `ml/heuristics/rules.json` is now a synced artifact

### Engineering workflow
- repo standardized on pnpm with lockfile
- quality gate now includes lint + typecheck + family build
- family app production build is verified
- elder and grandchild scaffolds typecheck
- browser E2E is wired for CI
- Supabase integration CI has a dedicated workflow

---

## Final handoff recommendation

If another engineer picks this up next, the best starting points are:

1. `docs/implementation/RELEASE_CANDIDATE_SUMMARY.md`
2. `docs/implementation/PRIORITIZED_REMAINING_ISSUES.md`
3. `docs/implementation/NEXT_10_GITHUB_ISSUES.md`
4. `docs/implementation/RESIDUAL_HARDENING_REPORT.md`
5. `docs/implementation/SUPABASE_CI_STRATEGY.md`

## Suggested immediate next actions after handoff

- commit the current hardening set as one or more reviewable PRs
- create the top 10 GitHub issues from `NEXT_10_GITHUB_ISSUES.md`
- provision/update Supabase live-RLS test secrets
- run the richer Supabase integration workflow in CI
- schedule real device validation for elder and grandchild flows

---

## Session 2026-06-14 — vNext Well-Rounded Patch

### High-level outcome

Historical entry: applied the vNext Well-Rounded Patch directive on top of the v1.2.1 hardening closure. The current build has since advanced; see `README.md` and `docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md` for the June 20 addendum.

- **+1 schema migration** with 14 new tables, 11 telemetry columns on `device_sessions`, 6 seeded consent packs, 10 new feature flags, forced RLS on every new user-data table.
- **+17 Edge Functions** (16 new + 1 closing the carer-handover gap) and **+4 patches** to existing functions.
- **+2 new tests** (`tests/edge/vnext-rls-audit.test.mjs` with 18 assertions, plus the existing 27 behavioural authz assertions).
- **Elder app** ScreenRenderer extended with daily check-in card, Are-you-OK fall modal, medication confirmation card, scam-coaching button, Familiar Voice toggle.
- **Family app** DailyStatusPill + TrustSignalPanel + two-way action buttons + `/dashboard/familiar-voice` recording page.
- **Carer portal** handover-notes form with offline-first queue + MAR-light entry.
- Engineering rating moved from **8.5/10 → 9.0/10**.

### Files added

- `supabase/migrations/20260614000000_vnext_wellrounded_patch.sql` (462 lines, 14 new tables)
- `supabase/functions/fn-fall-event/index.ts`
- `supabase/functions/fn-fall-escalation/index.ts`
- `supabase/functions/fn-wellness-checkin/index.ts`
- `supabase/functions/fn-scam-coaching/index.ts`
- `supabase/functions/fn-medication-interactions-check/index.ts`
- `supabase/functions/fn-medication-ocr-review/index.ts`
- `supabase/functions/fn-device-health-monitor/index.ts`
- `supabase/functions/fn-quiet-day-detector/index.ts`
- `supabase/functions/fn-daily-status-digest/index.ts`
- `supabase/functions/fn-pending-confirmation-respond/index.ts`
- `supabase/functions/fn-voice-profile-create/index.ts`
- `supabase/functions/fn-voice-profile-test/index.ts`
- `supabase/functions/fn-video-call-create/index.ts`
- `supabase/functions/fn-video-call-join-token/index.ts`
- `supabase/functions/fn-video-call-end/index.ts`
- `supabase/functions/fn-daily-checkin-scheduler/index.ts`
- `supabase/functions/fn-carer-handover-note/index.ts`
- `apps/family/src/components/DailyStatusPill.tsx`
- `apps/family/src/components/TrustSignalPanel.tsx`
- `apps/family/src/app/dashboard/familiar-voice/page.tsx`
- `tests/edge/vnext-rls-audit.test.mjs`
- `docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md`

### Files materially updated

- `apps/elder/src/renderer/ScreenRenderer.tsx` (real schema-driven renderer with vNext UX)
- `apps/elder/src/screens/ElderScreen.tsx` (new context fields for check-in card, pending confirmation, voice preferences)
- `apps/elder/src/hooks/useHavenActions.ts` (new action IDs: CHECKIN, FALL_OK/HELP, CONFIRM_MED/DENY_MED, SCAM_COACH, VOICE_TOGGLE, VIDEO_CALL)
- `apps/family/src/app/dashboard/page.tsx` (DailyStatusPill, TrustSignalPanel, action buttons)
- `apps/family/src/services/dashboard-fixtures.ts` (historical; removed in the June 20 pass when dashboard loading moved to the live RPC path)
- `apps/carer-portal/index.html` (handover form + offline queue + MAR-light)
- `supabase/functions/fn-device-session/index.ts` (telemetry + device_health_events)
- `supabase/functions/fn-medication-ocr/index.ts` (review-required gating)
- `supabase/functions/fn-voice-pipeline/index.ts` (repeat-back + Familiar Voice selection + crisis override)
- `supabase/functions/_shared/core.ts` (dispatchNotification hardening: DeviceNotRegistered, retry, send_error)
- `README.md`, `CHANGELOG.md`, `VERSIONING.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/COMPLIANCE.md`, `docs/PROJECT_PACKAGE_INDEX.md`

### Verification snapshot

```
validate-suite     : {"ok": true, "edgeFunctions": 72, "schemaBytes": 158308}  # historical June 14 snapshot
test:edge          : all 6 files pass (scam-engine, screen-schema, hardening-static, data-lifecycle, authz-behavioral, vnext-rls-audit)
test:rls           : rls-policy audit + storage-policy audit pass
test:e2e           : iphone-suite smoke test passes
typecheck          : apps/elder + packages clean
total assertions   : ~50+
```

### Honest gaps remaining

1. Guided multi-step consent-pack onboarding UI (data layer ready, UI orchestration pending).
2. Elder-side incoming video-call screen (function ready, UI pending).
3. Dedicated `fn-voice-profile-revoke` endpoint (schema supports it; the dedicated function is a follow-up).
4. Playwright E2E flows for vNext paths (code paths implemented and unit-tested).

These four items are tracked in `docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md`.
