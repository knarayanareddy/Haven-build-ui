# HAVEN-build — Round 3 Deep Audit (Logic Bugs + Code Review)

**Date:** 2026-06-14
**Target:** 2a4ea69 + Round 2 unstaged changes
**Total:** 13 findings (2 Critical, 5 High, 6 Medium)

---

## P0 — CRITICAL (2)

### P0-11: Idempotency Rewrite Has ON CONFLICT Bug
**File:** _shared/idempotency.ts (Round 2 rewrite)
The atomic INSERT does NOT specify .onConflict('key_hash').ignore().
Without it, a duplicate key_hash causes Supabase to throw a 409 Conflict error
instead of returning { data: null, error: null }.
**Fix:** Add .onConflict('key_hash').ignore() to the insert call.

### P0-12: fn-notification-dispatch — Mass Assignment
**File:** fn-notification-dispatch/index.ts:10
dispatchNotification(body) passes the raw request body (Record<string,unknown>) directly
to db.from("notifications").insert(params). Any extra field in the request body is
inserted into the notifications table via admin() client (bypasses RLS).
**Fix:** Destructure only known fields before passing to dispatchNotification.

---

## P1 — HIGH (5)

- P1-15: .or() template literals in fn-buurt-match, fn-buurt-optout, fn-right-to-erasure
- P1-16: fn-wearable-event uses admin() for all DB writes (bypasses RLS)
- P1-17: fn-video-call-join-token/end authz after DB read (RLS-gated, defense-in-depth)
- P1-18: fn-bereavement-support uses admin() after multi-path authz
- P1-19: fn-buurt-match passes user-controlled connection_id to .eq() without UUID validation

## P2 — MEDIUM (6)

- P2-18: fn-video-call-join-token uses deterministic sha256, not randomUUID
- P2-19: fn-notification-dispatch is an unnecessary thin wrapper (doubles attack surface)
- P2-20: fn-screen-data no rate limiting
- P2-21: fn-companion-memory duplicate detection via brittle toLowerCase()
- P2-22: fn-health-log mixed privilege admin()+userClient()
- P2-23: CI supabase-layout-check missing pnpm install step
