# HAVEN Prioritized Remaining Issues

Last updated: 2026-06-20

## P0 — critical before any real launch

### 1. Validate all hardened authz paths against hosted Supabase
**Why:** static checks are no longer enough for the repo’s security claims.

**Needed:**
- hosted staging/production project reset or migration deploy
- `corepack pnpm run smoke:hosted`
- authenticated Edge Function smoke coverage
- negative tests for unrelated/family/carer/admin boundaries

### 2. Close the legacy secret-store lifecycle gap
**Why:** `legacy_accounts.encrypted_secret_path` may reference material outside the audited Supabase bucket model.

**Needed:**
- define the real secret backend
- add cleanup and audit path
- verify erasure behavior end to end

### 3. Test signed storage URL paths against hosted storage objects
**Why:** current guarantees are mostly code/static-policy based.

**Needed:**
- run `corepack pnpm run smoke:hosted`
- upload/read path tests for elder-owned folders
- negative tests for cross-user path signing
- family read-path verification where allowed

## P1 — high value next

### 4. Expand live RLS + RPC integration coverage
**Why:** current live harness is stronger than before, but still selective.

**Needed:**
- browser-shield visibility checks
- care-plan and carer-path checks
- notification/self-only path checks
- export negative/positive permutations

### 5. Expand authenticated Edge Function integration smoke tests
**Why:** the first hosted smoke script exists, but broader function behavior still needs staged coverage.

**Needed:**
- function-level happy/negative tests for critical routes
- at minimum: export, erasure, storage signer, voice pipeline, consent update, family message send

### 6. Add paginated storage cleanup for large prefixes
**Why:** current erasure cleanup is prefix-based and bounded to a simple object list size.

**Needed:**
- pagination or batched cleanup strategy
- retry/error handling for partial deletes

### 7. Define whether data export includes blobs or metadata only
**Why:** current export includes metadata/path references, not packaged blob content.

**Needed:**
- product/legal decision
- implementation plan
- audit trail for download packaging if enabled

## P2 — productionization

### 8. Validate Expo elder app on physical iOS and Android devices
**Why:** typecheck is not runtime readiness.

**Needed:**
- auth
- notifications
- microphone
- camera
- offline queue
- background/foreground transitions

### 9. Validate grandchild app flow on real devices
**Why:** media capture/send flows are sensitive to permission/runtime behavior.

**Needed:**
- guardian flow
- elder delivery flow
- consent edge cases

### 10. Run vendor sandbox integrations
**Why:** code scaffolds exist, but real operational behavior is still unverified.

**Needed:**
- MedMij sandbox
- PSD2 sandbox
- log-drain validation
- Expo push delivery

## P3 — release and governance

### 11. External penetration test
### 12. DPO/DPIA completion
### 13. Vendor DPA/SCC completion
### 14. Older-adult usability sign-off
### 15. App store operational readiness

## Current recommendation

Do not market the repository as production-ready yet.

Use the current state as:
- hardened local/pre-production engineering RC
- internal diligence package
- pre-production validation baseline
