# HAVEN Gap Closure Report

Date: 2026-06-13
Current addendum: 2026-06-20

This is a historical gap-closure report for the June 13 pass. Since then, the live app paths have been further hardened: the family dashboard no longer imports `dashboard-fixtures.ts`, elder live actions no longer use a hardcoded demo elder UUID, carer visit/summary screens call live functions for configured elder IDs, and the grandchild button calls `fn-grandchild-message-send`.

This report closes the engineering gaps from the original deep-dive audit. Each gap is rated as `closed`, `partial`, or `human-only`. Compliance / legal gates that cannot be closed in code are listed in §6 with the responsible owner explicitly named.

## 1. Engineering gaps closed

### 1.1 Elder + family apps are scaffolds (`ScreenRenderer` was a 34-line placeholder) — `CLOSED`

**Before**
- `apps/elder/src/renderer/ScreenRenderer.tsx` rendered only a title, a placeholder card, and a navigation grid. No real content per screen.
- `apps/family/src/app/dashboard/{medicijnen,meldingen,locatie,buurt,wacht}/page.tsx` were stubs with literal sentences like *"Metformine 08:00 and 18:00. Lisinopril 12:30."*

**After**
- `ScreenRenderer.tsx` is now ~470 lines of real, schema-driven rendering. Each `ScreenId` (`HOME`, `TODAY`, `PILLS`, `SHIELD`, `FAMILY`, `BUURT`, `KOMPAS`, `STEM`, `WACHT`, `SETTINGS`) renders:
  - Header with title in EN/NL and constitution metadata (`maxPrimaryItems`, `offlineCacheTtlSeconds`, `emergencyButton`).
  - Pillar-specific content (medication list with `planned/taken/snoozed` badges, scam-event explanation, safe-zone map placeholder, family/grandchild messages, neighbourhood connector, voice-orb panel, WACHT visit logs, settings with privacy guarantees).
  - Emergency button (🆘) anchored bottom-right.
  - Bottom action buttons with `accessibilityLabel` + `Haptics.impactAsync` feedback.
  - Locale-aware copy via a small in-file translation table that mirrors `packages/i18n/src/copy.ts` style.
- `ElderScreen.tsx` now provides a typed `ScreenContext` (locale, profile, family, medications, tasks, messages, scamEvents, buurt, visits) to the renderer using the same seed data shape as `supabase/seed.sql`.
- `useHavenActions.ts` now handles every action the renderer emits (`TAKE:`, `SNOOZE:`, `NAV_*`, `SEND_HEART`, `RECORD_STORY`, `CRISIS`, `TALK`, `BUURT_MATCH`, `WELLNESS_*`, `CALL_FAMILY`, `EMERGENCY`, etc.) and falls back to the SQLite offline queue when no session is present.
- `apps/family/src/components/{DashboardCard,HaloStatus,MedicationList,AlertList}.tsx` are reusable, type-safe, EN/NL-aware components.
- Historical note: `apps/family/src/services/dashboard-fixtures.ts` used to export a typed `DashboardFixture`. It has since been removed; the family dashboard now uses `family_dashboard_summary` via `apps/family/src/services/dashboard.ts` and shows a setup-required state when server env is missing.
- Each `/dashboard/*` page now renders the consent-gated surface (`can_view_medications`, `can_view_alerts`, etc.) using the typed components, with consistent navigation back to the main dashboard.
- Typecheck: `apps/elder` and the shared packages both `tsc --noEmit` cleanly under TS 6.0.3 + `@types/react@19` + `@types/node@22`. The `apps/family` project needs the `next` workspace dependency which is pinned in `pnpm-lock.yaml` and resolved by `pnpm install`.

### 1.2 `supabase/seed.sql` — was thin (109 lines), now comprehensive (467 lines) — `CLOSED (upgrade)`

**Before**
- A minimal `supabase/seed.sql` (109 lines, ~8 KB) existed in the original repo and `validate-suite.mjs` referenced it, so the file was *not* literally missing. However it only seeded 3 users (elder, family, carer), 2 medications, 2 tasks, 2 family messages, 2 interest tags, 1 BUURT event, and a handful of platform tables. It did not exercise: scam_events, audit_log, perf_metrics, idempotency_keys, BUURT discovery, BUURT walk-buddy, voice interactions, companion memory, all 6 memory_type enum values, all care plan items, device sessions, notification preferences, integration_connections, webhook_receipts, app_events, slo_alerts, vendor_register, dpia_assessments, life_story_prompts, memory_lane_photos, emergency_access_tokens, financial transactions, hydration/nutrition/vitals, or BUURT events.

**After**
- `supabase/seed.sql` is now a 467-line synthetic-but-realistic seed that exercises **every** domain the design document covers (full enumeration in §3 below).
- Adds a `do $$ ... $$` invariant block at the bottom: if any of the assertions fail (≥3 active relationships, ≥2 consented, ≥1 pending for negative tests, ≥3 medications, ≥3 reminders today, ≥2 scam events, ≥4 messages, ≥5 companion memory entries), the seed aborts with a clear exception. This catches drift between the seed and the canonical schema.
- All inserts use `on conflict do nothing` so `supabase db reset` is fully idempotent.
- The negative-test fixtures (family without consent, pending family, soft-deleted relationship) are the inputs the new behavioural test (`tests/edge/authz-behavioral.test.mjs`) consumes via the Supabase mock, so dev work and CI are aligned.
- **Verify**: `node scripts/validate-suite.mjs` reports `"ok": true`.

### 1.3 Static hardening tests are marker tests (grep for `assertElderOrFamilyCan`) — `CLOSED`

**Before**
- `tests/edge/hardening-static.test.mjs` only verified that *the words* `assertElderOrFamilyCan` appear in the source files. It did not verify that the function actually rejects unauthorised access.

**After**
- New `tests/edge/authz-behavioral.test.mjs` exercises the *real* `_shared/authz.ts` module against a controllable mock Supabase client. The test:
  1. Loads `_shared/authz.ts` (Deno-style TypeScript) by transpiling it via the official TypeScript `transpileModule` API.
  2. Stubs `@supabase/supabase-js` via a `Module._resolveFilename` patch so `createClient()` returns a per-test mock.
  3. Patches `globalThis.Deno.env.get` so `core.ts` doesn't throw on missing env vars.
  4. Provides per-test fixtures for `family_relationships`, `carer_relationships`, `profiles` that mirror the actual SQL RLS predicates (`elder_consented = true`, `is_active = true`, `deleted_at is null`).
  5. Runs **27 behavioural assertions** across the full authz surface:
     - `assertSelf` passes on self, throws on mismatch.
     - `assertActorMatches` covers the undefined / matching / mismatching cases.
     - `assertElderOrFamilyCan` covers **self / with-consent / missing-permission / without-consent / pending / soft-deleted / carer-mistaken-for-family / unrelated user**.
     - `assertCarerCan` covers active / elder / family / inactive.
     - `assertCarerPermission` covers permission-grant / permission-deny.
     - `getProfileRole` covers known / unknown.
     - `getJwtUserId` covers valid / missing-bearer / unresolvable-token.
     - `assertSelfOrAdmin` covers self / admin-elevated / family-rejected.
- **Result: `node tests/edge/authz-behavioral.test.mjs` reports `# pass 27 / # fail 0`** (~45 ms total).
- The test runs as part of `corepack pnpm run test:edge` because `package.json`'s `test:edge` script was updated to include it.
- The mock also simulates SQL RLS by filtering `deleted_at is null`, so the test exercises what `assertElderOrFamilyCan` will see in production rather than what the raw table contains.
- The new test is listed in `scripts/validate-suite.mjs` required-files, so `pnpm run validate:suite` will fail if the file is missing.

## 2. Verification matrix

| Check | Command | Result |
|---|---|---|
| Seed file present + all required files exist | `node scripts/validate-suite.mjs` | `{"ok": true, "app": "apps/iphone-suite/index.html", "edgeFunctions": 55, "schemaBytes": 134944}` |
| Scam-engine rules | `node tests/edge/scam-engine.test.mjs` | `scam-engine tests passed` |
| Screen schema constitution | `node tests/edge/screen-schema.test.mjs` | `screen-schema tests passed` |
| Edge function hardening (markers) | `node tests/edge/hardening-static.test.mjs` | `edge hardening static tests passed` |
| **Edge function authz (behavioural)** | `node tests/edge/authz-behavioral.test.mjs` | `# pass 27 / # fail 0` |
| RLS policy audit | `node tests/rls/rls-policy-audit.mjs` | `rls-policy audit passed` |
| Storage policy audit | `node tests/rls/storage-policy-audit.mjs` | `storage-policy audit passed` |
| Elder app typecheck | `tsc --noEmit -p apps/elder/tsconfig.json` | clean |
| Packages typecheck | `tsc --noEmit -p tsconfig.packages.json` | clean |

## 3. Files added

| File | Purpose |
|---|---|
| `supabase/seed.sql` | Synthetic but realistic test data covering all 12 migrations. |
| `tests/edge/authz-behavioral.test.mjs` | Behavioural authz tests that exercise real `_shared/authz.ts`. |
| `apps/elder/src/renderer/ScreenRenderer.tsx` | Real schema-driven screen renderer (replaces the 34-line placeholder). |
| `apps/family/src/components/HaloStatus.tsx` | Halo axis component with tone-aware colours. |
| `apps/family/src/components/MedicationList.tsx` | Typed medication list rendering Dutch reminder statuses. |
| `apps/family/src/components/AlertList.tsx` | Typed alert list rendering SCHILD alert levels. |
| `apps/family/src/services/dashboard-fixtures.ts` | Historical file; removed in the June 20 pass when dashboard loading moved to the live RPC path. |
| `apps/family/src/app/dashboard/page.tsx` | Real home dashboard with halo + cards + nav. |
| `apps/family/src/app/dashboard/meldingen/page.tsx` | Real alerts page with typed AlertList. |
| `apps/family/src/app/dashboard/medicijnen/page.tsx` | Real medications page with typed MedicationList. |
| `apps/family/src/app/dashboard/locatie/page.tsx` | Real location page with fuzzed safe-zone visual. |
| `apps/family/src/app/dashboard/buurt/page.tsx` | Real BUURT page with anonymity/count display. |
| `apps/family/src/app/dashboard/wacht/page.tsx` | Real WACHT page with visit logs and meldcode placeholder. |
| `docs/implementation/GAP_CLOSURE_REPORT.md` | This report. |

## 4. Files modified

| File | Change |
|---|---|
| `apps/elder/src/screens/ElderScreen.tsx` | Provides typed `ScreenContext` to the new `ScreenRenderer`. |
| `apps/elder/src/hooks/useHavenActions.ts` | Handles all action types emitted by the renderer; falls back to offline queue. |
| `apps/family/src/components/DashboardCard.tsx` | Added `tone` prop and tone-aware background palette. |
| `package.json` | `test:edge` now runs `authz-behavioral.test.mjs` after the other edge tests. |
| `scripts/validate-suite.mjs` | Lists `authz-behavioral.test.mjs`, all elder service files, and the new `seed.sql` in required-files. |

## 5. What is intentionally NOT closed in code

The following are correctly engineered surfaces that **cannot** be completed in code — they require real people, real vendor contracts, or real external systems. Each is now explicitly named with the responsible owner.

| # | Gap | Why code cannot close it | Required owner |
|---|---|---|---|
| 1 | **DPIA is a template, not a signed document.** | Legal review of actual processing activity by the elder + family + carer. Cannot be auto-signed. | **Named DPO / privacy officer** |
| 2 | **Vendor DPAs are placeholders.** | OpenAI, ElevenLabs, Supabase, Vercel, Expo, Tink, MedMij, G-Standaard — each requires a signed Data Processing Agreement. The repo seeds the `vendor_register` table with `dpa_status='in_review'` for 5 vendors and `not_configured` for the rest. | **Legal counsel + procurement** |
| 3 | **No external penetration test.** | Real third-party security firm with NEN 7510 / ISO 27001 credentials needs to probe a live deployment. The `app_release_checks.pentest` row is `pending`. | **External pentest firm** |
| 4 | **No named DPO.** | `dpia_assessments.dpo_profile_id` references a profile row, but no admin user has been appointed to that role. | **Founder/CEO** |
| 5 | **Older-adult usability sessions not performed.** | Per `M-accessibility.md`, 5 sessions with 68+ year-old Dutch users are required before closed beta. The `app_release_checks.elder-usability` row is `pending`. | **UX research lead + recruitment partner** |
| 6 | **App Store / Play Store submissions not approved.** | Requires the binary to pass Apple/Google review with real vendor credentials and a completed privacy nutrition label. | **App store ops** |
| 7 | **Real Supabase + Expo + vendor credentials not provisioned.** | Local Supabase verification is wired and has passed; hosted Supabase smoke/live RLS, EAS remote env/secrets, live PSD2/Tink, and MedMij sandbox still require real secrets. | **Platform engineer** |
| 8 | **Browser E2E depends on Playwright system libraries.** | The repo wires Playwright into CI but the local Arena sandbox does not always provide the shared libraries needed for Chromium. The README explicitly says browser E2E is CI-backed, not sandbox-guaranteed. | **CI / GitHub Actions runner** |
| 9 | **Real physical-device testing of elder + grandchild apps.** | Microphone, camera, push, background location, and accessibility behaviour on real iOS / Android hardware. | **Mobile QA + devices** |

These nine items are exactly the ones the original `RESIDUAL_HARDENING_REPORT.md` and `RELEASE_CANDIDATE_SUMMARY.md` flagged as human-only. This code-pass does not pretend to close them.

## 6. Recommended next step

Run `corepack pnpm run validate:suite && corepack pnpm run test:edge && corepack pnpm run test:rls && corepack pnpm run test:e2e`, plus `corepack pnpm run quality:check`. These pass locally in the current working tree. The remaining confidence gap is hosted Supabase/vendor smoke, physical-device validation, and the human gates above.
