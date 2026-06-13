# HAVEN Release-Candidate Summary

Last updated: 2026-06-13

## Executive summary

HAVEN is now best described as:

> a substantially hardened, production-shaped engineering package with meaningful trust-boundary enforcement, lifecycle coverage, reproducible installs, and CI guardrails — but still requiring real infrastructure validation, device validation, and operational/compliance sign-off before launch.

## What is now materially stronger

### Backend security

- Authenticated Edge Functions now bind caller identity to JWTs rather than trusting body fields.
- The authenticated surface has explicit self/family/carer/admin authorization checks across the main user-facing flows.
- The `verify_jwt = false` surface is now intentionally classified into:
  - admin bearer only
  - vendor secret or internal header
  - internal header only
- Transaction webhook handling now fails closed when the PSD2 secret is not configured.

### Data lifecycle

- `export_elder_data` covers a much broader elder-data surface.
- `fn-right-to-erasure` now covers substantially more SQL tables.
- Erasure now includes explicit storage bucket cleanup for known prefix-based blobs.
- Lifecycle coverage is now checked by an automated schema-to-lifecycle diff audit.

### Engineering reliability

- The repository now uses a pinned pnpm lockfile strategy.
- Root install/build/typecheck/lint scripts exist.
- Family app production build is part of quality validation.
- Elder and grandchild app scaffolds now typecheck.
- Browser E2E is wired into CI.
- Supabase-specific CI strategy is documented and split from general engineering CI.

## What still prevents real production launch

### Infrastructure reality gap

The repository still needs execution and validation against:

- a real Supabase environment
- real storage objects
- real vendor sandbox integrations
- real mobile devices
- real push notification delivery paths

### Device/runtime gap

The Expo apps are scaffold-typechecked, but not release-certified.

Remaining work includes:
- iOS and Android runtime validation
- microphone/camera permission behavior
- push notification behavior
- offline queue behavior under actual network transitions
- accessibility checks on physical devices

### Compliance/operational gap

Remaining external gates include:
- DPO sign-off
- DPIA completion
- vendor DPA/SCC completion
- pentest completion
- older-adult usability sign-off
- app-store submission and approval

## Recommended release-candidate label

If a release label is needed now, the most honest label is:

> `rc-engineering-scaffold-hardened`

Not:
- GA
- production-ready
- launch-ready

## Recommended next phase

The next phase should focus on:

1. richer live Supabase and vendor integration coverage
2. device/runtime validation
3. operational/compliance evidence collection
4. closing the remaining lifecycle/storage edge cases
