#!/usr/bin/env bash
# ─── HAVEN Staging Smoke Test ───
# One command to verify staging/demo environment is healthy.
# Usage: ./scripts/smoke-staging.sh [supabase-url] [anon-key]
#
# If arguments are omitted, reads from EXPO_PUBLIC_SUPABASE_URL and
# EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables (or .env files).

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { PASS=$((PASS + 1)); printf "${GREEN}PASS${NC} %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "${RED}FAIL${NC} %s\n" "$1"; }
warn() { WARN=$((WARN + 1)); printf "${YELLOW}WARN${NC} %s\n" "$1"; }

# ─── Resolve Supabase URL and anon key ───
SUPABASE_URL="${1:-${EXPO_PUBLIC_SUPABASE_URL:-}}"
ANON_KEY="${2:-${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}}"

if [ -z "$SUPABASE_URL" ]; then
  # Try loading from .env files
  for envfile in .env apps/elder/.env apps/carer/.env apps/grandchild/.env; do
    if [ -f "$envfile" ]; then
      val=$(grep -E '^EXPO_PUBLIC_SUPABASE_URL=' "$envfile" 2>/dev/null | head -1 | cut -d= -f2-)
      if [ -n "$val" ]; then SUPABASE_URL="$val"; break; fi
    fi
  done
fi

if [ -z "$ANON_KEY" ]; then
  for envfile in .env apps/elder/.env apps/carer/.env apps/grandchild/.env; do
    if [ -f "$envfile" ]; then
      val=$(grep -E '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' "$envfile" 2>/dev/null | head -1 | cut -d= -f2-)
      if [ -n "$val" ]; then ANON_KEY="$val"; break; fi
    fi
  done
fi

echo "─── HAVEN Staging Smoke Test ───"
echo ""

# ─── 1. Environment hygiene ───
echo "== Environment Hygiene =="

if [ -n "$SUPABASE_URL" ]; then
  pass "SUPABASE_URL present: ${SUPABASE_URL:0:40}..."
else
  fail "SUPABASE_URL missing — set EXPO_PUBLIC_SUPABASE_URL or pass as arg 1"
fi

if [ -n "$ANON_KEY" ]; then
  pass "ANON_KEY present: ${ANON_KEY:0:10}..."
else
  fail "ANON_KEY missing — set EXPO_PUBLIC_SUPABASE_ANON_KEY or pass as arg 2"
fi

# Check .env files don't contain real secrets in tracked files
if git ls-files --error-unmatch .env 2>/dev/null; then
  fail ".env is tracked by git — should be in .gitignore"
else
  pass ".env is not tracked by git"
fi

# Check no JWT-shaped keys in tracked env files
tracked_envs=$(git ls-files | grep -E '\.env' || true)
jwt_leak=false
for f in $tracked_envs; do
  if grep -qE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' "$f" 2>/dev/null; then
    fail "JWT-shaped key found in tracked file: $f"
    jwt_leak=true
  fi
done
if [ "$jwt_leak" = false ]; then
  pass "No JWT-shaped keys in tracked env files"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo ""
  echo "Cannot run network checks without SUPABASE_URL and ANON_KEY."
  echo "Results: ${PASS} passed, ${FAIL} failed, ${WARN} warnings"
  exit 1
fi

# ─── 2. Supabase reachability ───
echo ""
echo "== Supabase Reachability =="

health_status=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}" 2>/dev/null || echo "000")

if [ "$health_status" = "200" ] || [ "$health_status" = "401" ]; then
  pass "Supabase REST API reachable (HTTP ${health_status})"
else
  fail "Supabase REST API returned HTTP ${health_status}"
fi

# ─── 3. Edge Function reachability ───
echo ""
echo "== Edge Function Reachability =="

FUNCTIONS=(
  "fn-health-check"
  "fn-vapi-webhook"
  "fn-grandchild-message-send"
  "fn-whatsapp-webhook"
  "fn-screen-data"
)

for fn in "${FUNCTIONS[@]}"; do
  fn_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/functions/v1/${fn}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")

  case "$fn" in
    fn-health-check)
      if [ "$fn_status" = "200" ]; then
        pass "${fn} reachable (HTTP ${fn_status})"
      elif [ "$fn_status" = "500" ]; then
        warn "${fn} returned HTTP 500 (deployed but may need env vars)"
      elif [ "$fn_status" = "404" ]; then
        warn "${fn} not deployed (HTTP 404)"
      else
        fail "${fn} returned HTTP ${fn_status}"
      fi
      ;;
    fn-vapi-webhook)
      # 400/401/200 mean deployed and responding; 404 means not yet deployed
      if [ "$fn_status" = "200" ] || [ "$fn_status" = "400" ] || [ "$fn_status" = "401" ]; then
        pass "${fn} reachable (HTTP ${fn_status})"
      elif [ "$fn_status" = "404" ]; then
        warn "${fn} not deployed (HTTP 404)"
      else
        fail "${fn} returned HTTP ${fn_status}"
      fi
      ;;
    fn-grandchild-message-send)
      # 401 expected without proper auth — means function is deployed
      if [ "$fn_status" = "401" ] || [ "$fn_status" = "400" ] || [ "$fn_status" = "200" ]; then
        pass "${fn} reachable (HTTP ${fn_status} — auth required)"
      else
        fail "${fn} returned HTTP ${fn_status}"
      fi
      ;;
    fn-whatsapp-webhook)
      # 400/401 expected — means function is deployed
      if [ "$fn_status" = "400" ] || [ "$fn_status" = "401" ] || [ "$fn_status" = "200" ]; then
        pass "${fn} reachable (HTTP ${fn_status})"
      else
        fail "${fn} returned HTTP ${fn_status}"
      fi
      ;;
    *)
      if [ "$fn_status" != "000" ] && [ "$fn_status" != "404" ]; then
        pass "${fn} reachable (HTTP ${fn_status})"
      else
        fail "${fn} unreachable (HTTP ${fn_status})"
      fi
      ;;
  esac
done

# ─── 4. fn-vapi-webhook auth behavior ───
echo ""
echo "== Webhook Auth Behavior =="

# Test without secret header (should accept in dev, reject in prod)
vapi_no_secret=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/functions/v1/fn-vapi-webhook" \
  -X POST -H "Content-Type: application/json" \
  -d '{"message":{"type":"assistant-request"}}' 2>/dev/null || echo "000")

if [ "$vapi_no_secret" = "200" ] || [ "$vapi_no_secret" = "400" ]; then
  warn "fn-vapi-webhook accepts requests without secret (OK for dev/hackathon)"
elif [ "$vapi_no_secret" = "401" ] || [ "$vapi_no_secret" = "403" ]; then
  pass "fn-vapi-webhook rejects unauthenticated requests (prod behavior)"
elif [ "$vapi_no_secret" = "404" ]; then
  warn "fn-vapi-webhook not deployed — skipping auth behavior check"
else
  warn "fn-vapi-webhook unexpected response: HTTP ${vapi_no_secret}"
fi

# ─── 5. WhatsApp webhook hardening ───
echo ""
echo "== WhatsApp Webhook Hardening =="

wa_no_sig=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/functions/v1/fn-whatsapp-webhook" \
  -X POST -H "Content-Type: application/json" \
  -d '{"entry":[]}' 2>/dev/null || echo "000")

if [ "$wa_no_sig" = "401" ] || [ "$wa_no_sig" = "403" ]; then
  pass "fn-whatsapp-webhook rejects requests without signature"
elif [ "$wa_no_sig" = "400" ]; then
  warn "fn-whatsapp-webhook returned 400 (may need WHATSAPP_APP_SECRET)"
else
  warn "fn-whatsapp-webhook returned HTTP ${wa_no_sig}"
fi

# ─── 6. Static validation ───
echo ""
echo "== Static Validation =="

suite_result=$(node scripts/validate-suite.mjs 2>&1 || true)
if echo "$suite_result" | grep -q '"ok": true'; then
  fn_count=$(echo "$suite_result" | grep -o '"edgeFunctions": [0-9]*' | grep -o '[0-9]*')
  pass "validate:suite OK (${fn_count} edge functions)"
else
  fail "validate:suite failed"
fi

# ─── Summary ───
echo ""
echo "─── Results ───"
echo "${PASS} passed, ${FAIL} failed, ${WARN} warnings"
echo ""

if [ "$FAIL" -gt 0 ]; then
  printf "${RED}SMOKE TEST FAILED${NC}\n"
  exit 1
else
  printf "${GREEN}SMOKE TEST PASSED${NC}\n"
  exit 0
fi
