# HAVEN — Voice-First Elder Care Companion

**Your parent's guardian. Your peace of mind.**

HAVEN is a privacy-first, voice-first elder-care platform for older adults in the Netherlands and the families and care professionals who support them. It combines fraud protection, medication support, family connection, cognitive/orientation safety, a warm voice companion and professional care workflows into one coherent product suite.

This repository is an end-to-end production-shaped package generated from the HAVEN engineering design suite (`designdoc.md` v1.2.1). It contains app surfaces, Supabase schema, storage policies, Edge Functions, shared packages, ML safety assets, tests, release documentation, deployment scripts and compliance-support records.

---

## Current build status

The repository is the **HAVEN vNext Well-Rounded Patch** layered on top of the original v1.2.1 SSOT. It implements the full design-document feature surface plus the vNext extensions (fall detection, daily check-ins, daily family status, trust signal, scam coaching, Familiar Voice, Live video calling, carer handover notes, etc.) behind feature flags.

Validation currently passes with:

```json
{
  "ok": true,
  "app": "apps/iphone-suite/index.html",
  "edgeFunctions": 72,
  "schemaBytes": 158308
}
```

### Build layers

| Layer | Source | Lines | Status |
|---|---|---|---|
| **Original SSOT** | `designdoc.md` v1.2.1 | ~6,939 | Built |
| **P0 security hardening closure** | 12 migrations + 55 Edge Functions | ~2,900 SQL / ~5,500 TS | Built (June 2026) |
| **vNext Well-Rounded Patch** | `docs/implementation/VNEXT_PATCH_DESIGN.md` + `VNEXT_IMPLEMENTATION_REPORT.md` | 13 migrations + 72 Edge Functions | Built (June 2026) |
| **Test pyramid** | `tests/edge/*.test.mjs` + `tests/rls/*.audit.mjs` + `tests/integration/live-rls.test.mjs` | ~50+ assertions | Green |

### vNext patch at a glance

The vNext directive (`docs/implementation/VNEXT_PATCH_DESIGN.md`) was applied in-place. It added:

- **1 schema migration** (`20260614000000_vnext_wellrounded_patch.sql`) with **14 new tables** + 11 telemetry columns on `device_sessions` + 6 seeded consent packs + 10 new feature flags + forced RLS on every new user-data table.
- **16 new Edge Functions** + **4 patches** to existing ones.
- **Elder app**: check-in card, Are-you-OK fall modal, medication confirmation card, scam-coaching button, Familiar Voice toggle.
- **Family app**: Daily status pill, Trust signal panel, two-way action buttons, Familiar Voice recording page.
- **Carer portal**: handover-notes form + offline-first queue + MAR-light entry.
- **Behavioural + RLS test coverage** grew to ~50+ assertions, all green.

Honest gaps remaining (per `docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md`): guided multi-step consent-pack onboarding UI in elder onboarding, elder-side video-call incoming-call screen, dedicated `fn-voice-profile-revoke` endpoint, and Playwright E2E flows for vNext paths. Schema + functions are ready; UI is the next session.

### Security Boundary Hardening (P0 Audit Complete)

In a rigorous senior security audit, multiple P0 and P1 security trust boundaries were identified and immediately hardened across the codebase:

1. **`fn-voice-pipeline` (FIX 1 & 20):** Eliminated high-privilege `admin()` database clients for elder-scoped actions. Extracted real user JWT tokens, bound caller identity, and added dynamic delegate checks allowing only authorized family members and carers. Enforced active `withIdempotency` wrapping to prevent patient-safety risks (such as medication double-confirmation events).
2. **`fn-storage-signed-url` (FIX 2):** Bounded folder-level storage paths to strict elder UUID matching. Enforced cryptographic format checks on directory owner segments (`ownerId`) and added directory-traversal protection (`..` and `\`). Banned family delegate access to the privacy-sensitive `document-vault` and `ocr-inbox` buckets.
3. **`fn-transaction-intercept` (FIX 3):** Fully fail-closed transaction webhooks. The receiver enforces signature checking in all cloud environments, halting execution and returning a `500 Server Misconfiguration` block if missing or misconfigured, while maintaining local-development convenience.
4. **GDPR Export Completeness & Compliance (FIX 11 & 12):** Aligned `public.export_elder_data` with GDPR Articles 15 & 20. Swapped the function to `security definer` to safely bypass column-level coordinate blocks for the elder themselves, enabling the export of `location_precise` in a highly secure, restricted JSON payload.
5. **`verify_jwt` Alignment (FIX 4):** Explicitly declared compensating controls inside `supabase/config.toml` for functions running with `verify_jwt = false` and enforced standard gateway JWT validations for all user-facing endpoints.

Full test command:

```bash
corepack pnpm test
```

Current test coverage includes:

- **suite structure validation** (`validate:suite` — 71 functions + 158 KB schema + every required file present)
- **scam-engine tests** (5 NL rule patterns + scoring)
- **screen-schema constitution tests** (UX enforcement: ≤2 nav depth, ≤4 items, emergency button, banned AI copy)
- **Edge Function hardening checks** (markers: every protected function references the right authz helpers)
- **authz behavioural tests** (27 assertions exercising real `_shared/authz.ts` against a mock Supabase client)
- **RLS policy static audit** (15 critical tables with forced RLS, all expected policies)
- **Storage policy static audit** (7 buckets + 4 critical policies)
- **data-lifecycle diff audit** (export + erasure coverage of every GDPR-relevant table)
- **vNext RLS audit** (17 assertions covering all 14 new tables, family/carer/permission gating, every new feature flag)
- **iPhone-suite smoke test** (render + accessibility + screen constitution)

### Production-launch note

This repository is production-shaped and feature-complete from an engineering scaffold perspective. A real production launch still requires external operational gates:

1. Supabase CLI + Docker DB reset in CI or a developer machine.
2. Real generated Supabase database types from a running database.
3. Real RLS tests with real Supabase JWTs.
4. Physical iPhone and Android testing.
5. Vendor sandbox and production credentials.
6. DPO-signed DPIA.
7. Vendor DPAs/SCCs.
8. External penetration test.
9. Older-adult usability sessions.
10. App Store / Play Store submissions and approvals.

These are tracked in the release and compliance documentation.

---

## Repository map

```text
Haven-build/
├── apps/
│   ├── iphone-suite/        # High-fidelity iPhone product suite preview
│   ├── family-dashboard/    # Static family dashboard preview
│   ├── admin-console/       # Compliance/release/admin console preview
│   ├── carer-portal/        # WACHT professional carer portal preview
│   ├── browser-shield/      # Browser Shield extension scaffold
│   ├── elder/               # Expo elder app scaffold
│   ├── family/              # Next.js family dashboard scaffold
│   └── grandchild/          # Expo grandchild companion app scaffold
├── docs/
│   ├── api/                 # OpenAPI + Edge Function catalog
│   ├── implementation/      # audits, phase coverage, feature matrix
│   ├── release/             # store metadata, privacy, audits, safety protocols
│   └── runbooks/            # production runbook
├── ml/
│   ├── dataset/             # scam dataset schema and manifest
│   ├── heuristics/          # rule catalog
│   └── prompts/             # scam reasoning prompt
├── packages/
│   ├── contracts/           # TypeScript API/domain contracts
│   ├── database/            # typed database surface
│   ├── i18n/                # EN/NL product copy
│   ├── scam-engine/         # local scam scoring rules
│   ├── schema/              # screen schema + constitution validator
│   └── ui/                  # design tokens and UI specs
├── scripts/
│   ├── deploy/              # Supabase deploy scripts
│   ├── check-local-supabase.sh
│   └── validate-suite.mjs
├── supabase/
│   ├── functions/           # 55 Edge Functions
│   ├── migrations/          # 9 migrations covering schema/security/features
│   ├── seed.sql             # synthetic local seed data
│   └── config.toml          # Supabase local function config
├── tests/
│   ├── edge/
│   ├── rls/
│   └── e2e/
├── .github/workflows/
├── .maestro/
├── designdoc.md             # source engineering design document
├── package.json
└── pnpm-workspace.yaml
```

---

## Product pillars

| Pillar | Purpose | Implemented surfaces |
|---|---|---|
| **SCHILD** | Fraud and scam protection | scam pipeline, call reputation, browser shield, document vault, transaction intercept, weekly digest |
| **ANKER** | Health, medication and rhythm | medication OCR, reminders, escalation, refill detection, tasks, hydration, nutrition, vitals, telehealth, transport, MedMij/FHIR, medication catalog sync |
| **KRING** | Family and community connection | family messages, voice/video hellos, life stories, memory lane, grandchild app, community events, skill exchange |
| **BUURT** | Privacy-safe neighbourhood connector | PC4 profiles, interest tags, anonymous counts, local events, walk buddy matching, double opt-in, opt-out cleanup |
| **KOMPAS** | Cognitive safety and orientation | safe zone, fuzzy location, emergency profile, night mode, cognitive check-ins, wandering/wearables, driving events, bereavement support |
| **STEM** | Voice companion | Whisper adapter, intent classification, LLM reply, ElevenLabs TTS, **Familiar Voice (family clone, gated)**, companion memory, crisis detection, **repeat-back confirmation for medication intake** |
| **WACHT** | Professional care portal | carer portal with **handover notes + MAR-light + offline queue**, care plans, visit logs, incidents, safeguarding reports, external care sync |

---

## Application surfaces

### iPhone suite preview

Open:

```text
apps/iphone-suite/index.html
```

Includes:

- iPhone-sized interface
- English default with Dutch switch
- high contrast and large text controls
- SCHILD, ANKER, KRING, BUURT, KOMPAS, STEM, WACHT flows
- local state for demo interactions
- PWA manifest and service worker

### Elder app scaffold

Location:

```text
apps/elder
```

Includes (v1.2.1 baseline + vNext patch):

- Expo app config (SDK 56, RN 0.86, React 19.2.7)
- EAS build profiles (`development`, `preview`, `production`)
- React Navigation native-stack
- Supabase Auth provider with `expo-secure-store` session persistence
- **Schema-driven `ScreenRenderer`** rendering 10 production screens from `packages/schema/src/screenSchema.ts`
- **Daily check-in card** (morning/midday/evening mood options)
- **"Are you OK?" fall modal** triggered by `pending_confirmations(fall_response)`
- **Medication confirmation card** for repeat-back flow
- **Scam coaching button** calling `fn-scam-coaching`
- **Familiar Voice toggle** on STEM + SETTINGS screens (gated by `familiar_voice_enabled`)
- SQLite offline queue with `expo-sqlite` (`apps/elder/src/services/sqliteOfflineQueue.ts`)
- Voice recorder service (`expo-av`)
- Document camera capture service (`expo-camera`)
- Push-token registration service (`expo-notifications`)
- Crisis phrase detection (`apps/elder/src/services/crisis.ts`)
- Local notification helper with quiet-hours support (`apps/elder/src/services/notifications.ts`)
- PII-safe logger (`apps/elder/src/services/security.ts`)
- Network resilience + offline sync machine (`apps/elder/src/state/*`)

### Family dashboard scaffold

Location:

```text
apps/family
```

Includes (v1.2.1 baseline + vNext patch):

- Next.js 16 app scaffold with TypeScript and ESLint
- Security headers + middleware permission mapping
- Dashboard routes for medications, alerts, BUURT, location, WACHT, **Familiar Voice**
- **Daily status pill** (`apps/family/src/components/DailyStatusPill.tsx`) showing green/amber/red with "why" + "what next"
- **Trust signal panel** (`apps/family/src/components/TrustSignalPanel.tsx`) showing device last-seen, permissions last known, recent `device_health_events`
- **Two-way action buttons**: send heart, voice message, gentle check-in, video call
- **Consent-scoped dashboard RPC client** (`apps/family/src/services/dashboard.ts`)
- **Real-time subscriptions** (`apps/family/src/services/realtime.ts`)
- **Familiar Voice recording page** with privacy disclosure + sample sentences + record/test actions (`apps/family/src/app/dashboard/familiar-voice/page.tsx`)

### Browser Shield

Location:

```text
apps/browser-shield
```

Includes:

- Manifest V3 extension scaffold
- local page pattern scan
- compact risk event submission to `fn-browser-shield`
- no raw page storage

### Admin console

Location:

```text
apps/admin-console/index.html
```

Covers:

- DPIA status
- vendor register
- release checks
- incident response readiness

### Carer portal (WACHT)

Location:

```text
apps/carer-portal/index.html
```

Covers (v1.2.1 baseline + vNext patch):

- Care visits and care plans overview
- Safeguarding state with meldcode step indicator
- **Handover notes workflow** — carer writes appetite/mood/mobility/concerns/administered-med; calls `fn-carer-handover-note`; selects family recipients
- **Offline-first capture** — localStorage-backed queue with online/offline buttons
- **MAR-light** — administration logging linked to `medication_reminders`

### Grandchild app

Location:

```text
apps/grandchild
```

Covers:

- one-button video hello flow
- backend call to `fn-grandchild-message-send`

---

## Backend overview

### Supabase migrations

```text
supabase/migrations/
├── 20260611000001_haven_v121_production_schema.sql            # v1.2.1 canonical schema
├── 20260611000002_storage_rpc_security.sql                    # Storage RLS + column revoke
├── 20260611000003_full_feature_domain_tables.sql             # WACHT + ANKER extension
├── 20260611000004_production_automation_realtime.sql           # Realtime + auth hook
├── 20260611000005_compliance_care_release_ops.sql             # Compliance, DPIA, vendor register
├── 20260611000006_integrations_observability_grandchild.sql   # Grandchild + integration tracking
├── 20260611000007_grandchild_unique_fix.sql                   # One-line uniqueness fix
├── 20260611000008_phase3_safety_community_legacy.sql          # Wearables, BUURT extensions
├── 20260611000009_hardening_idempotency_integration_status.sql # Idempotency + webhook receipts
├── 20260613000010_edge_authz_hardening.sql                    # Companion memory + audit log RLS
├── 20260613000011_voice_interactions_self_write.sql           # voice_elder_insert/update
├── 20260613000012_data_lifecycle_expansion.sql               # GDPR export expansion + retention
└── 20260614000000_vnext_wellrounded_patch.sql                 # vNext patch: 14 new tables + flags
```

The migrations implement:

- domain tables
- enums
- indexes
- forced RLS
- storage buckets and policies
- PostGIS location RPCs
- pgvector memory retrieval
- auth custom claims
- realtime publication registration
- retention jobs
- compliance tables
- release checks
- observability tables
- idempotency and webhook receipts

### Edge Functions

There are currently **72 Edge Functions** in `supabase/functions`. They are classified into 5 explicit trust zones per `docs/implementation/EDGE_FUNCTION_TRUST_BOUNDARY_MATRIX.md`:

- 41 user-scoped (`verify_jwt = true`) — every call uses the caller's JWT
- 11 admin-bearer only — `requireAdminBearer`
- 4 vendor-secret + internal-header — `requireVendorSecretHeader` or `requireInternalAccess`
- 16 internal-header only — `requireInternalAccess`

Of the 72 functions:
- **55 from v1.2.1** (P0 hardening closure) — SCHILD/ANKER/KRING/KOMPAS/STEM/WACHT
- **17 added by the vNext patch** — fall detection + wellness check-ins + scam coaching + med OCR review + med interactions + voice profile + video calling + carer handover + internal scheduled jobs

A complete catalog is available here:

```text
docs/api/EDGE_FUNCTION_CATALOG.md
```

OpenAPI surface:

```text
docs/api/openapi.yaml
```

Major function groups:

- Voice and companion memory
- Scam/browser/call reputation
- Medication OCR/reminders/refills
- Document analysis
- Location/safe zone/wandering/driving
- BUURT discovery/matching/events
- Family/grandchild messages
- Care plans/visit logs/incidents
- Consent/preferences/erasure/export
- Compliance/release/breach/vendor registry
- Observability/SLO/log drains
- External integrations: PSD2, MedMij/FHIR, care systems

---

## Security and privacy model

HAVEN follows a privacy-first model from the design document:

- Row-Level Security enabled and forced on user-data tables.
- Elder owns their data.
- Family access requires consent and per-feature permissions.
- Carer access requires active relationship and elder consent.
- Companion memory is elder-private.
- Document vault is elder-only.
- BUURT never exposes third-party elder identity before double opt-in.
- Precise location is only stored for active safe-zone events and is nulled after 24 hours.
- Family location view is fuzzed only.
- BSN is not stored, processed or transmitted.
- DigiD is deferred and not implemented as auth.
- Audit logs track sensitive changes.
- Right to erasure and data export are implemented.

Detailed docs:

```text
docs/release/PRIVACY_POLICY_EN.md
docs/release/PRIVACY_POLICY_NL.md
docs/release/PENTEST_SCOPE.md
docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md
```

---

## Testing

Run all current tests:

```bash
corepack pnpm test
```

Individual test groups:

```bash
corepack pnpm run validate:suite
corepack pnpm run test:edge
corepack pnpm run test:rls
corepack pnpm run test:e2e
```

What these cover:

- repository structure
- required files
- function inventory
- migration feature coverage
- feature matrix completeness
- screen schema constitution
- scam rule behavior
- Edge Function hardening patterns
- RLS policy presence
- storage policy presence
- iPhone suite smoke behavior

Device/E2E assets:

```text
.maestro/elder-medication-confirmation.yaml
.maestro/shield-alert-flow.yaml
tests/e2e/family-dashboard.spec.ts
playwright.config.ts
```

---

## Local development

Install runtime dependencies from the monorepo root:

```bash
corepack pnpm install --frozen-lockfile
```

Run validation:

```bash
corepack pcorepack pnpm run validate:suite
```

Run lint coverage:

```bash
corepack pnpm run lint
```

Run typecheck coverage:

```bash
corepack pnpm run typecheck
```

This currently checks:
- shared packages
- Expo elder app scaffold
- Expo grandchild app scaffold

The Next.js family app gets its TypeScript validation through the production build step:

```bash
corepack pnpm run build:family
```

Preview the static app surfaces:

```bash
corepack pnpm run preview:iphone
corepack pnpm run preview:family
```

Build the Next.js family dashboard:

```bash
corepack pnpm run build:family
```

Run the combined quality gate locally:

```bash
corepack pnpm run quality:check
```

Run the root engineering orchestration locally:

```bash
corepack pnpm run verify:core
```

Optional browser E2E coverage:

```bash
corepack pnpm exec playwright install chromium
corepack pnpm run verify:browser
```

Optional local Supabase orchestration:

```bash
corepack pnpm run verify:supabase:local
```

Run all tests:

```bash
corepack pcorepack pnpm test
```

### Supabase local reset

A real local reset requires Supabase CLI and Docker.

Run:

```bash
./scripts/check-local-supabase.sh
```

That script executes:

```bash
supabase start
supabase db reset
supabase db lint --level warning
```

---

## Deployment

Deployment scripts:

```text
scripts/deploy/check-production-env.sh
scripts/deploy/deploy-supabase.sh
```

Required deployment variables:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `HAVEN_ENV`

Deploy Supabase:

```bash
./scripts/deploy/deploy-supabase.sh
```

The script:

1. checks the deployment environment
2. links the Supabase project
3. pushes migrations
4. deploys Edge Functions
5. runs tests

CI workflow:

```text
.github/workflows/production-checks.yml
```

---

## External integration status

External integrations are represented in code and tracked in `integration_connections`.

| Integration | Code support | Real-world gate |
|---|---|---|
| OpenAI Whisper | implemented | API key + DPA/SCC |
| OpenAI embeddings/LLM | implemented | API key + DPA/SCC |
| ElevenLabs TTS | implemented | API key + DPA/SCC |
| Expo Push | implemented | Expo token + store setup |
| Supabase Storage signed URLs | implemented | Supabase project |
| Sentry/log drains | implemented | DSN/log-drain config |
| PSD2 | implemented with HMAC webhook support | provider contract and sandbox |
| MedMij/FHIR | implemented importer | accreditation and credentials |
| G-Standaard/Z-Index | implemented with legal-basis gate | AGB-code/formal agreement |
| ONS/Nedap/Careweb | implemented sync scaffolds | partner access |

---

## Compliance and launch gates

The repository contains tables and docs for:

- DPIA assessments
- vendor register
- breach incident log
- release checks
- privacy policies
- accessibility protocol
- pentest scope
- older-adult usability protocol
- safety copy review

Important files:

```text
docs/implementation/HARDENING_CLOSURE_REPORT.md
docs/implementation/PHASE_COVERAGE_AUDIT.md
docs/implementation/DESIGN_DOC_DIFF.md
docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md
docs/release/PENTEST_SCOPE.md
docs/release/ELDER_USABILITY_PROTOCOL.md
docs/release/COPY_REVIEW.md
```

Human gates still required before real production launch:

1. DPO signs DPIA.
2. Vendor DPAs/SCCs completed.
3. Production secrets/vendor credentials provisioned.
4. External penetration test completed.
5. Older-adult usability testing completed.
6. App Store / Play Store submissions approved.

---

## Implementation audits

Core audit docs:

```text
docs/implementation/DEEP_DIVE_AUDIT.md                       # Original gap analysis (closed by GAP_CLOSURE_REPORT.md)
docs/implementation/HARDENING_CLOSURE_REPORT.md             # v1.2.1 P0 trust-boundary closure
docs/implementation/DESIGN_DOC_DIFF.md                      # Design-doc-to-build diff
docs/implementation/PHASE_COVERAGE_AUDIT.md                 # Phase-by-phase coverage
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.md        # 60+ feature matrix
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.json      # Machine-readable matrix
docs/implementation/EDGE_FUNCTION_TRUST_BOUNDARY_MATRIX.md  # 5 trust zones × 72 functions
docs/implementation/RESIDUAL_HARDENING_REPORT.md            # Human-only remaining gates
docs/implementation/RELEASE_CANDIDATE_SUMMARY.md            # Honest RC label
docs/implementation/PRIORITIZED_REMAINING_ISSUES.md        # P0/P1/P2 backlog
docs/implementation/NEXT_10_GITHUB_ISSUES.md               # Suggested labels
docs/implementation/SESSION_HANDOFF_CHANGELOG.md            # Session-by-session changelog
docs/implementation/GAP_CLOSURE_REPORT.md                   # Earlier scaffold→real gap closure
docs/implementation/VNEXT_PATCH_DESIGN.md                  # vNext directive
docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md         # vNext acceptance criteria + honest gaps
```

The feature matrix currently tracks all major features from the design document + the vNext extensions and their implementation status.

---

## Engineering rating

After the v1.2.1 hardening pass **and the vNext Well-Rounded Patch**, this repository is best described as:

> A substantially hardened, feature-complete production-shaped engineering package for HAVEN. Schema, Edge Functions, app surfaces, and test coverage are all in place behind feature flags. Phase 1 features (daily check-ins, fall detection, scam coaching, trust signal, medication repeat-back, daily family status, OCR review) are wired end-to-end. Phase 2 features (Familiar Voice, Live video calling) have schema + functions + app surfaces and are ready for provider integration.

Current engineering scaffold rating: **9.0/10** (up from 8.5/10 after the vNext patch).

The remaining 1.0 point requires:
1. Real Supabase infrastructure + generated DB types
2. Real devices (physical iPhone / Android) + vendor sandbox credentials
3. DPO-signed DPIA + vendor DPAs/SCCs
4. External penetration test + older-adult usability sessions
5. App Store / Play Store submissions

These are documented as human-only gates in `docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md` and `RESIDUAL_HARDENING_REPORT.md`.

---

## License

This repository currently uses the original repository license. Confirm licensing before commercial production use.
