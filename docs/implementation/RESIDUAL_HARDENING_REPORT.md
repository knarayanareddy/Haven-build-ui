# HAVEN Residual Hardening Report

Last updated: 2026-06-13

## Summary

The repository has undergone multiple hardening passes across:

- Edge Function authorization
- internal/admin/vendor trust boundaries
- storage and lifecycle handling
- reproducible installs and pinned dependencies
- lint/typecheck/build coverage
- browser E2E CI wiring
- local and live Supabase CI strategy

The project is materially safer and more operationally coherent than the original scaffold. It is still **not a fully production-cleared system**.

## Residual risks

### 1. Runtime validation still exceeds test validation

Many guarantees are verified by static tests rather than full infrastructure execution.

Remaining gap:
- Edge Function code paths are better hardened, but many are not exercised against a live Supabase project in CI by default.

### 2. Browser E2E depends on CI environment

Playwright coverage is wired into CI, but the local Arena sandbox may lack system libraries needed to execute Chromium.

Implication:
- browser E2E should be treated as CI-backed, not universally sandbox-local.

### 3. Expo/mobile scaffolds are typechecked, not device-certified

The elder and grandchild apps now have scaffold-level TypeScript coverage, but production readiness still requires:
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

> a substantially hardened, production-shaped engineering package that now has credible authz, lifecycle, and CI guardrails, but still requires real infrastructure and operational sign-off before launch.
