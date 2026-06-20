#!/usr/bin/env bash
set -euo pipefail

required=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  HAVEN_INTERNAL_KEY
  HAVEN_TEST_ELDER_ID
  HAVEN_TEST_ELDER_JWT
)

missing=()
for key in "${required[@]}"; do
  if [ -z "${!key:-}" ]; then missing+=("$key"); fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  printf 'Missing required hosted smoke env: %s\n' "${missing[*]}" >&2
  exit 2
fi

json_post() {
  local url="$1"
  local bearer="$2"
  local body="$3"
  curl -fsS "$url" \
    -H "authorization: Bearer $bearer" \
    -H "content-type: application/json" \
    -d "$body"
}

health="$(curl -fsS "$SUPABASE_URL/functions/v1/fn-health-check" -H "x-haven-internal-key: $HAVEN_INTERNAL_KEY")"
HEALTH_JSON="$health" node <<'NODE'
const health = JSON.parse(process.env.HEALTH_JSON);
if (!health.success && health.status !== "degraded") {
  console.error("Hosted health check failed:", health);
  process.exit(1);
}
NODE

path="$HAVEN_TEST_ELDER_ID/hosted-smoke-$(date +%s).m4a"
upload_json="$(json_post "$SUPABASE_URL/functions/v1/fn-storage-signed-url" "$HAVEN_TEST_ELDER_JWT" "{\"bucket\":\"voice-notes\",\"path\":\"$path\",\"operation\":\"upload\"}")"
upload_url="$(UPLOAD_JSON="$upload_json" node <<'NODE'
const res = JSON.parse(process.env.UPLOAD_JSON);
if (!res.success || (!res.signedUrl && !res.signed_url)) {
  console.error("Signed upload URL smoke failed:", res);
  process.exit(1);
}
process.stdout.write(res.signedUrl ?? res.signed_url);
NODE
)"

printf 'HAVEN hosted smoke audio placeholder\n' | curl -fsS "$upload_url" \
  -X PUT \
  -H "content-type: audio/mp4" \
  --data-binary @- >/dev/null

read_json="$(json_post "$SUPABASE_URL/functions/v1/fn-storage-signed-url" "$HAVEN_TEST_ELDER_JWT" "{\"bucket\":\"voice-notes\",\"path\":\"$path\",\"operation\":\"read\",\"ttl_seconds\":60}")"
READ_JSON="$read_json" node <<'NODE'
const res = JSON.parse(process.env.READ_JSON);
if (!res.success || !res.signed_url) {
  console.error("Signed read URL smoke failed:", res);
  process.exit(1);
}
NODE

if [ -z "${EXPO_ACCESS_TOKEN:-}" ]; then
  echo "EXPO_ACCESS_TOKEN is not set; skipping Expo credential reachability check." >&2
else
  curl -fsS "https://exp.host/--/api/v2/push/getReceipts" \
    -H "authorization: Bearer $EXPO_ACCESS_TOKEN" \
    -H "content-type: application/json" \
    -d '{"ids":[]}' >/dev/null
fi

echo "hosted integration smoke checks passed"
