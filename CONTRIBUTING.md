# Contributing to HAVEN

HAVEN is an elder-care, safety and health-adjacent product. Contributions must preserve dignity, privacy and accessibility.

## Required before a pull request

Run:

```bash
corepack pnpm test
```

The test suite must pass before review.

## Engineering rules

1. No feature may bypass RLS/consent.
2. No BSN collection, storage, processing or transmission.
3. No deceptive AI copy.
4. No elder-facing action without a clear accessible label.
5. No location feature may expose live route history to family.
6. No family access to companion memory.
7. No BUURT third-party identity exposure before double opt-in.
8. Edge Functions that write data must validate input and enforce authorization.
9. External webhooks must verify signatures when a shared secret is configured.
10. Sensitive logs must be scrubbed.

## Copy rules

Elder-facing Dutch must use formal `u/uw`.

Avoid panic language. Scam and crisis flows must be calm, factual and non-shaming.

Required AI disclosure on first use:

- EN: `Hello, I am HAVEN — your digital helper.`
- NL: `Hallo, ik ben HAVEN — uw digitale hulp.`

Banned deceptive copy:

- `I am a real employee`
- `I am not a computer`
- `You are speaking to a person`

## Database changes

- Add new migrations; do not edit applied migrations.
- Enable and force RLS for new user-data tables.
- Add indexes for common elder-scoped queries.
- Add tests or audit coverage for sensitive policy changes.
- Update `docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.json` when adding a feature.

## Edge Function changes

Use the shared helpers where applicable:

- `_shared/validation.ts`
- `_shared/authz.ts`
- `_shared/idempotency.ts`
- `_shared/webhook.ts`
- `_shared/sentry.ts`
- `_shared/core.ts`

## Review focus

Reviewers should check:

- consent boundary
- RLS implication
- accessibility
- copy tone
- retention impact
- logging and PII exposure
- failure behavior
