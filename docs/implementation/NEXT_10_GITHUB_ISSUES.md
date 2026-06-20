# Recommended Next 10 GitHub Issues

Last updated: 2026-06-13

Each issue below is phrased as a suggested GitHub issue title plus a concise acceptance target.

---

## 1. Add real Supabase-authenticated Edge Function integration tests for critical user flows
**Acceptance target:**
- integration tests cover positive and negative authz cases for:
  - `fn-data-export`
  - `fn-right-to-erasure`
  - `fn-storage-signed-url`
  - `fn-family-message-send`
  - `fn-consent-update`

## 2. Add real storage signed-URL integration tests with elder/family/unrelated-user fixtures
**Acceptance target:**
- tests prove elder-owned uploads/reads work
- family reads only work on allowed buckets
- unrelated users cannot sign/read cross-user paths

## 3. Implement paginated storage-prefix cleanup for erasure flows
**Acceptance target:**
- `fn-right-to-erasure` no longer relies on a single bounded object listing per bucket
- partial cleanup failures are surfaced clearly

## 4. Define and implement legacy secret-store cleanup for `legacy_accounts.encrypted_secret_path`
**Acceptance target:**
- the real backing store is documented
- erasure includes external secret cleanup
- cleanup success/failure is auditable

## 5. Expand live RLS integration tests for documents, notifications, browser events, and family RPCs
**Acceptance target:**
- live test harness verifies more than companion-memory/medication/location basics
- negative checks exist for elder-private document and token surfaces

## 6. Add function-level integration tests for carer-only and admin-only workflows
**Acceptance target:**
- test coverage exists for:
  - `fn-care-plan`
  - `fn-care-visit-log`
  - `fn-incident-report`
  - admin/internal routes that require admin bearer or internal headers

## 7. Decide whether elder data export includes blobs or metadata only
**Acceptance target:**
- product/compliance decision recorded in docs
- export behavior and user expectation clearly documented
- implementation ticket(s) split accordingly

## 8. Validate elder app on physical iOS and Android devices
**Acceptance target:**
- checklist completed for:
  - OTP/auth flow
  - push token registration
  - voice recording
  - document capture
  - offline queue
  - accessibility basics

## 9. Validate grandchild media-send flow on real devices with consent edge cases
**Acceptance target:**
- guardian consent and elder delivery flow tested
- send-failure and retry behavior documented

## 10. Run vendor sandbox validation for PSD2 and MedMij/FHIR paths
**Acceptance target:**
- sandbox credentials configured
- basic import/webhook flow verified
- failure modes documented in runbooks

---

## Suggested labels

Recommended labels for this tranche of issues:
- `security`
- `privacy`
- `ci`
- `supabase`
- `mobile`
- `integration`
- `release-blocker`
- `hardening`
