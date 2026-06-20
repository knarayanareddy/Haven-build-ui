# HAVEN Testing Guide

## Test commands

```bash
corepack pnpm run validate:suite
corepack pnpm run test:edge
corepack pnpm run test:rls
corepack pnpm run test:e2e
corepack pnpm test
```

Current local status as of the June 20, 2026 runtime/configuration pass:

- `corepack pnpm run lint` passes.
- `corepack pnpm run typecheck` passes.
- `corepack pnpm test` passes.
- `corepack pnpm run quality:check` passes.
- `./scripts/ci/verify-local-supabase.sh` has passed in this working tree with local Supabase and live local RLS checks.

## Quality and build checks

```bash
corepack pnpm run lint
corepack pnpm run typecheck
corepack pnpm run build:family
corepack pnpm run quality:check
```

## Supabase checks

Local Supabase verification:

```bash
corepack pnpm run verify:supabase:local
```

This starts local Supabase, clears poisoned local temp state when needed, resets the database, parses `supabase db lint --level warning`, and runs the live RLS harness with local JWTs.

Hosted smoke verification, after staging/production secrets are available:

```bash
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
HAVEN_INTERNAL_KEY=... \
HAVEN_TEST_ELDER_ID=... \
HAVEN_TEST_ELDER_JWT=... \
corepack pnpm run smoke:hosted
```

The hosted smoke calls `fn-health-check`, exercises storage signed upload/read URL creation, and can check Expo push receipts when `EXPO_ACCESS_TOKEN` is present.

## Browser E2E

```bash
corepack pnpm exec playwright install chromium
corepack pnpm run test:e2e:browser:all
```

## Current tests

| Test | Purpose |
|---|---|
| `tests/edge/scam-engine.test.mjs` | Scam rule scoring |
| `tests/edge/screen-schema.test.mjs` | Screen coverage and deceptive AI copy check |
| `tests/edge/hardening-static.test.mjs` | P0 Edge Function hardening patterns |
| `tests/edge/data-lifecycle-diff.test.mjs` | Schema-to-lifecycle coverage audit |
| `tests/rls/rls-policy-audit.mjs` | RLS enabled/forced audit |
| `tests/rls/storage-policy-audit.mjs` | Storage bucket policy audit |
| `tests/e2e/iphone-suite-smoke.test.mjs` | Static iPhone suite smoke test |
| `tests/e2e/family-dashboard.spec.ts` | Real Next.js family-app browser E2E |

## Device tests

Maestro flows:

```text
.maestro/elder-medication-confirmation.yaml
.maestro/shield-alert-flow.yaml
```

Manual protocols:

```text
docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md
docs/release/ELDER_USABILITY_PROTOCOL.md
```

## Missing tests that require real infrastructure

- Real iOS/Android device tests.
- Vendor sandbox tests.
- Hosted Supabase smoke test with real staging/production secrets.
- Physical push/camera/mic/TTS/background behavior validation.

## Live Supabase RLS tests

A live RLS harness is available but requires a real Supabase local/staging project and JWTs:

```bash
HAVEN_LIVE_RLS=1 \
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
HAVEN_TEST_ELDER_JWT=... \
HAVEN_TEST_FAMILY_JWT=... \
HAVEN_TEST_UNRELATED_JWT=... \
HAVEN_TEST_ELDER_ID=... \
corepack pnpm run test:integration:live
```

The live test verifies:

- elder can query own companion memory
- family cannot see companion memory
- unrelated user cannot see elder medications
- family location view does not expose precise location
- documents remain elder-only
- push tokens remain self-only
- notification preferences remain self-only
- elder export works and family export is blocked
- consented family dashboard summary RPC works

## AI mock mode

Start the local mock AI server:

```bash
corepack pnpm run mock:ai
```

Use in Edge Function local development:

```bash
HAVEN_AI_MOCK_URL=http://127.0.0.1:8787
```

or simple built-in mock behavior:

```bash
HAVEN_AI_MOCK=true
```
