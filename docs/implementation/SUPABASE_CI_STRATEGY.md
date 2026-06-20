# HAVEN Supabase CI Strategy

Last updated: 2026-06-13

## Goals

The repository now separates general engineering checks from richer Supabase validation.

## General engineering workflow

`production-checks.yml` covers:

- reproducible install from `pnpm-lock.yaml`
- scam-rule drift checks
- lint
- typecheck
- family production build
- browser E2E
- static suite validation

## Supabase integration workflow

`supabase-integration.yml` adds a richer database-focused path with two jobs.

### 1. Local reset and migration execution

`supabase-local-reset`

This job:
- installs the Supabase CLI
- ensures Docker is present
- runs `./scripts/ci/verify-local-supabase.sh`

That script performs:
- `supabase start`
- `supabase db reset`
- `supabase db lint --level warning`
- live integration test entrypoint invocation when local setup is healthy

## 2. Live RLS verification

`live-rls`

This job is secret-gated and runs only when these secrets are configured:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `HAVEN_TEST_ELDER_JWT`
- `HAVEN_TEST_FAMILY_JWT`
- `HAVEN_TEST_UNRELATED_JWT`
- `HAVEN_TEST_ELDER_ID`

When available, it runs:

```bash
HAVEN_LIVE_RLS=1 corepack pnpm run test:integration:live
```

Current live coverage now checks more than baseline visibility:

- elder-private companion memory remains elder-only
- unrelated users cannot see medications
- family gets fuzzed location access without precise coordinates
- documents remain elder-only
- push tokens remain self-only
- notification preferences remain self-only
- elder export RPC works for the elder only
- family dashboard summary RPC works only for a consented family member

If secrets are missing, the workflow emits a notice and skips the live RLS job instead of failing.

## Operational rationale

This split keeps the standard PR workflow practical while still giving the project a path for:

- migration-reset confidence
- Docker-backed local Supabase validation
- secret-backed live RLS verification against a real project

## Recommended usage

- use `production-checks.yml` on every pull request
- use `supabase-integration.yml` on a schedule and before sensitive releases
- use `workflow_dispatch` when changing migrations, RLS, storage policies, or Edge Function authz paths
