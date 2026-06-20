# Changelog

## Current — June 20, 2026 runtime/configuration pass

- Updated documentation to reflect the current locally green build.
- Validation reports 81 Supabase Edge Functions and 158544 schema bytes.
- Local checks pass: lint, typecheck, test suite, quality check, and local Supabase verification.
- Removed hidden demo-data wiring from authenticated elder, family, carer, and grandchild app paths.
- Added hosted Supabase smoke script documentation for Edge Function and Storage checks.
- Added EAS/env documentation for elder, carer, and grandchild builds.
- Added Tink refresh-token encryption and required `TINK_TOKEN_ENCRYPTION_KEY`.
- Made WhatsApp fallback and regulatory escalation endpoints configurable/fail-fast.
- Updated production readiness docs to distinguish local code readiness from hosted/device/vendor/human gates.

## 1.1.0 — Production-shaped package

- Added full README and documentation package.
- Added 55 Supabase Edge Functions.
- Added 9 production migrations.
- Added elder, family, carer, admin, grandchild, browser-shield and iPhone-suite surfaces.
- Added RLS/storage audits and Edge hardening tests.
- Added compliance, release, privacy and operations documentation.
- Added AI provider adapters and integration status tracking.

## 1.0.0 — Initial implementation scaffold

- Added high-fidelity iPhone suite.
- Added canonical Supabase schema and storage hardening.
- Added initial Edge Function set.
