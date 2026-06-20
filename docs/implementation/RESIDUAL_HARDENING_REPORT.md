# HAVEN Residual Hardening Report

Last updated: 2026-06-20

## Summary

The repository has undergone multiple intensive security and architectural hardening passes. On **June 13, 2026**, the primary **P0 trust-boundary vulnerabilities** (including the voice pipeline IDOR, storage signed URL path traversal, transaction webhook fail-open mode, and GDPR location coordinate omissions) were successfully and comprehensively closed.

Hardening areas covered:
- Edge Function authorization (JWT binding and caller identity verification)
- Delegated family and carer access controls
- Fail-closed signature checking for Tink/PSD2 transactions
- Storage folder namespace enforcement and UUID validation
- GDPR-complete portability exports and S3 lifecycle erasure
- internal/admin/vendor trust boundaries
- storage and lifecycle handling
- reproducible installs and pinned dependencies
- lint/typecheck/build coverage
- browser E2E CI wiring
- local and live Supabase CI strategy

The project is now structurally secure, locally green, and operationally coherent. It remains pre-production, requiring hosted-environment smoke checks, vendor sandbox/live checks, and physical-device validation before final production certification.

## Residual risks

### 1. Runtime validation still exceeds test validation

Many guarantees are verified by static tests rather than full infrastructure execution.

Current state:
- Local Supabase verification and live local RLS checks have passed.

Remaining gap:
- Hosted Supabase staging/production Edge Function and Storage paths must still be exercised with real project secrets and JWTs.
- `corepack pnpm run smoke:hosted` exists but is secret-gated.

### 2. Browser E2E depends on CI environment

Playwright coverage is wired into CI, but the local Arena sandbox may lack system libraries needed to execute Chromium.

Implication:
- browser E2E should be treated as CI-backed, not universally sandbox-local.

### 3. Expo/mobile apps are typechecked, not device-certified

The elder, carer, and grandchild apps now have TypeScript coverage and EAS/native configuration, but production readiness still requires:
- physical iOS and Android runs
- permissions behavior validation
- push notification validation
- microphone/camera/runtime UX validation

### 4. Legacy secret-store lifecycle remains incomplete

`legacy_accounts.encrypted_secret_path` may reference materials outside the defined Supabase storage buckets.

Current state:
- the SQL row is erased
- the erasure function flags `legacy_secret_store_cleanup_required: true`

Remaining work:
- formalize external secret-store cleanup and auditability.

### 5. Live RLS coverage is still secret-gated

The live RLS workflow is in place, but it depends on:
- real Supabase secrets
- test JWT provisioning
- a maintained test elder/family/unrelated-user fixture model

Remaining work:
- keep the fixture project healthy
- expand the live assertions over time

### 6. Remaining operational hardening gates

Still external to the repository:
- DPO sign-off
- vendor DPA/SCC completion
- external pentest
- production secrets governance
- older-adult usability sign-off
- app-store submission and approval

## Current recommendation

Treat the repository as:

> a substantially hardened, locally green, production-shaped engineering package that now has credible authz, lifecycle, CI guardrails, and local Supabase verification, but still requires hosted infrastructure smoke, real devices, vendor validation, and operational sign-off before launch.
