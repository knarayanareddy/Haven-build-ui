# HAVEN — Voice-First Elder Care Companion

**Your parent's guardian. Your peace of mind.**

HAVEN is a privacy-first, voice-first elder-care platform for older adults in the Netherlands and the families and care professionals who support them. It combines fraud protection, medication support, family connection, cognitive/orientation safety, a warm voice companion and professional care workflows into one coherent product suite.

This repository is an end-to-end production-shaped package generated from the HAVEN engineering design suite (`designdoc.md` v1.2.1). It contains app surfaces, Supabase schema, storage policies, Edge Functions, shared packages, ML safety assets, tests, release documentation, deployment scripts and compliance-support records.

---

## Current build status

The repository implements the full design-document feature surface as an engineering package.

Validation currently passes with:

```json
{
  "ok": true,
  "app": "apps/iphone-suite/index.html",
  "edgeFunctions": 55,
  "schemaBytes": 118552
}
```

Full test command:

```bash
corepack pcorepack pnpm test
```

Current test coverage includes:

- suite structure validation
- scam-engine tests
- screen-schema constitution tests
- Edge Function hardening checks
- RLS policy static audit
- Storage policy static audit
- iPhone-suite smoke test

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
| **STEM** | Voice companion | Whisper adapter, intent classification, LLM reply, ElevenLabs TTS, companion memory, crisis detection |
| **WACHT** | Professional care portal | carer portal, care plans, visit logs, incidents, safeguarding reports, external care sync |

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

Includes:

- Expo app config
- EAS build profiles
- React Navigation
- Supabase Auth provider
- SecureStore session persistence
- schema-driven screen renderer
- SQLite offline queue
- local medication notifications
- voice recorder service
- document camera capture service
- push-token registration service

### Family dashboard scaffold

Location:

```text
apps/family
```

Includes:

- Next.js app scaffold
- security headers
- middleware permission mapping
- dashboard routes for medications, alerts, BUURT, location and WACHT
- consent-scoped dashboard RPC client

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

### Carer portal

Location:

```text
apps/carer-portal/index.html
```

Covers:

- care visits
- care plans
- safeguarding state

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
├── 20260611000001_haven_v121_production_schema.sql
├── 20260611000002_storage_rpc_security.sql
├── 20260611000003_full_feature_domain_tables.sql
├── 20260611000004_production_automation_realtime.sql
├── 20260611000005_compliance_care_release_ops.sql
├── 20260611000006_integrations_observability_grandchild.sql
├── 20260611000007_grandchild_unique_fix.sql
├── 20260611000008_phase3_safety_community_legacy.sql
└── 20260611000009_hardening_idempotency_integration_status.sql
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

There are currently **55 Edge Functions** in `supabase/functions`.

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
docs/implementation/DEEP_DIVE_AUDIT.md
docs/implementation/DESIGN_DOC_DIFF.md
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.md
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.json
docs/implementation/PHASE_COVERAGE_AUDIT.md
docs/implementation/HARDENING_CLOSURE_REPORT.md
docs/implementation/RELEASE_CANDIDATE_SUMMARY.md
docs/implementation/PRIORITIZED_REMAINING_ISSUES.md
docs/implementation/NEXT_10_GITHUB_ISSUES.md
docs/implementation/RESIDUAL_HARDENING_REPORT.md
docs/implementation/SESSION_HANDOFF_CHANGELOG.md
```

The feature matrix currently tracks all major features from the design document and their implementation status.

---

## Engineering rating

After the hardening pass, this repository is best described as:

> A comprehensive production-shaped engineering package for HAVEN, ready for real Supabase/Expo/Next hardening, external integration testing and compliance sign-off.

Current engineering scaffold rating: **8.5/10**.

The remaining path to 9+ requires execution in real infrastructure and real devices.

---

## License

This repository currently uses the original repository license. Confirm licensing before commercial production use.
