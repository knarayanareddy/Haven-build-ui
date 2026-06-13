# HAVEN Security Guide

## Core controls

- Forced RLS on user-data tables.
- Private Supabase Storage buckets.
- Signed URLs for storage access.
- Service-role key only in Edge Functions.
- SecureStore for mobile sessions.
- Idempotency for critical write functions.
- HMAC verification for PSD2-style webhooks.
- Sentry/structured logging with PII scrubbing.
- Audit log for sensitive changes.

## Prohibited data

HAVEN must not collect, process, store or transmit BSN.

DigiD authentication is deferred and not implemented.

## Location rules

- Store fuzzed location by default.
- Store precise location only for active safe-zone handling.
- Null precise location after 24 hours.
- Family must use fuzzed views only.
- No route history.

## BUURT rules

- PC4 only.
- No address/GPS in BUURT profile.
- No identity reveal before double opt-in.
- Family cannot see third-party identities.
- Opt-out deletes profile/tags and ends connections.

## Edge Function rules

- Validate input.
- Authorize user/relationship.
- Use idempotency for state-changing operations.
- Scrub sensitive logs.
- Verify webhook signatures when secrets are configured.
- Return calm, non-technical errors to clients.

## Security testing

Run:

```bash
corepack pnpm run test:rls
corepack pnpm run test:edge
```

External pentest scope:

```text
docs/release/PENTEST_SCOPE.md
```
