# 🔴 HAVEN-build — Round 2 Red Team Audit (Post-Hardening Build)

**Auditor:** Senior Security Engineer / Open-Source Maintainer  
**Date:** 2026-06-14  
**Target:** `knarayanareddy/Haven-build` @ commit `2a4ea69`  
**Total new findings:** 17 (4 Critical, 6 High, 7 Medium)

---

## EXECUTIVE SUMMARY

Round 1 fixed 25 findings (6 P0, 8 P1, 9 P2) — all verified applied correctly. This Round 2 audit goes deeper into supply chain, race conditions, distributed-system correctness, and client-side security. Found 4 new critical issues.

---

## 🔴 P0 — CRITICAL (4 New)

### P0-7: Missing `.gitignore`
No `.gitignore` exists. `node_modules/`, `.env`, build artifacts can be accidentally committed — credential leak risk.

### P0-8: esm.sh CDN Import — Supply Chain SPOF
`core.ts` imports `createClient` from `https://esm.sh/@supabase/supabase-js@2` at runtime. If esm.sh is down or compromised, all 75 functions break.

### P0-9: Idempotency Race Condition
SELECT-then-INSERT without atomic locking in `idempotency.ts`. Two concurrent requests can double-process medication confirmations.

### P0-10: Non-Atomic Rate Limiter
In-memory Map across multiple Deno isolates. Rate limiting bypassed by distributing requests.

---

## 🟠 P1 — HIGH (6 New)

| # | Finding |
|---|---------|
| P1-9 | `fn-video-call-create` — any family with "messages" perm can create calls |
| P1-10 | Browser shield stores JWT in `chrome.storage.local` (unencrypted) |
| P1-11 | `fn-voice-profile-create` missing elder consent check |
| P1-12 | 21 functions (28%) have `verify_jwt = false` |
| P1-13 | Expo SecureStore falls back to plaintext SharedPreferences on Android |
| P1-14 | Static HTML apps have no Content-Security-Policy |

## 🟡 P2 — MEDIUM (7 New)

| # | Finding |
|---|---------|
| P2-10 | `fn-medication-ocr` hardcoded parser (only metformin/lisinopril) |
| P2-11 | `fn-medication-interactions-check` only 5 hardcoded rules |
| P2-12 | No request correlation / trace IDs |
| P2-13 | `fn-health-check` misleading verify_jwt=false label |
| P2-14 | Test fixtures reference fragile `/tmp/haven-test-deps/` path |
| P2-15 | Large lockfile — no dependency confusion linting |
| P2-16 | `fn-right-to-erasure` uses `admin()` for all writes |
| P2-17 | `dispatchNotification` retry silently swallows errors |

## Combined Posture

| Round | P0 Fixed | P1 Fixed | P2 Fixed | Total |
|-------|----------|----------|----------|-------|
| Round 1 | 6 | 8 | 9 | 23 |
| Round 2 | 4 | 6 | 7 | 17 |
| **Combined** | **10** | **14** | **16** | **40 findings** |
