# HAVEN-build Security Fixes — Migration Guide

## Overview

This directory contains all fixes for the 25 security findings discovered during the red-team audit of HAVEN-build. Apply these fixes to the main repository.

## Quick Apply

```bash
# 1. Copy all fixed files into the repository
cp -r Haven-build-fixes/supabase/functions/_shared/* supabase/functions/_shared/
cp Haven-build-fixes/supabase/functions/fn-scam-pipeline/index.ts supabase/functions/fn-scam-pipeline/index.ts
cp Haven-build-fixes/supabase/functions/fn-transaction-intercept/index.ts supabase/functions/fn-transaction-intercept/index.ts
cp Haven-build-fixes/supabase/functions/fn-right-to-erasure/index.ts supabase/functions/fn-right-to-erasure/index.ts
cp Haven-build-fixes/supabase/functions/fn-onboarding/index.ts supabase/functions/fn-onboarding/index.ts
cp Haven-build-fixes/supabase/functions/fn-emergency-profile/index.ts supabase/functions/fn-emergency-profile/index.ts
cp Haven-build-fixes/supabase/functions/fn-scam-coaching/index.ts supabase/functions/fn-scam-coaching/index.ts
cp Haven-build-fixes/supabase/functions/fn-voice-pipeline/index.ts supabase/functions/fn-voice-pipeline/index.ts

# 2. Add new files to git
git add supabase/functions/_shared/ratelimit.ts
git add supabase/functions/_shared/handler.ts

# 3. Set required env vars
# HAVEN_INTERNAL_KEY=<random-64-char-hex>
# HAVEN_ALLOWED_ORIGINS=https://haven.app,exp://*,haven://*
# EXPO_ACCESS_TOKEN=<your-expo-push-token>

# 4. Run tests
corepack pnpm test
```

## API Changes

### Breaking: `cors` → `corsHeaders(req)`

Before:
```typescript
import { cors } from "../_shared/core.ts";
return new Response("ok", { headers: cors });
return json(body, status);
```

After:
```typescript
import { corsHeaders } from "../_shared/core.ts";
return new Response("ok", { headers: corsHeaders(req) });
return json(body, status, req);  // json now takes optional req for CORS+security headers
```

### Breaking: Error sanitization

Before:
```typescript
} catch (e) {
  return json({ error: String((e as Error).message ?? e) }, 400);
}
```

After:
```typescript
import { safeErrorMessage } from "../_shared/core.ts";
} catch (e) {
  return json({ error: safeErrorMessage(e) }, 400, req);
}
```

### Breaking: Body reading

Before:
```typescript
const body = await req.json();
```

After:
```typescript
import { readJsonBody } from "../_shared/core.ts";
const body = await readJsonBody(req) as Record<string, unknown>;
```

This enforces Content-Type validation + body size limits.

### New: Rate limiting (opt-in per endpoint)

```typescript
import { rateLimit } from "../_shared/ratelimit.ts";
rateLimit(req, "fn-name");
```

### New: Standardised handler wrapper

```typescript
import { havenHandler } from "../_shared/handler.ts";

havenHandler("fn-name", async (req, body) => {
  // Your logic here
  return { body: { ok: true } };
});
```

## Remaining Follow-ups (P2 — Not Yet Implemented)

1. **P2-3:** Add idempotency wrapping to `fn-device-health-monitor`
2. **P2-4:** Move `DEMO_ELDER_ID` from hardcoded to env config
3. **P2-5:** Add content filtering to Browser Shield extension
4. **P2-6:** Upgrade voice intent classifier to NL NLP model
5. **P2-7:** Review storage signed URL TTL for voice playback
6. **P2-9:** Review DB connection pooling under load

## Migrating All 72 Edge Functions

Each function needs three changes:
1. `cors` → `corsHeaders(req)` in OPTIONS handler
2. `req.json()` → `readJsonBody(req)` for body parsing
3. `String(e.message ?? e)` → `safeErrorMessage(e)` in catch blocks
4. `json(body, status)` → `json(body, status, req)`

Run this sed script for bulk find-and-replace:

```bash
# In supabase/functions/
for f in $(find . -name 'index.ts' -not -path './_shared/*'); do
  sed -i "s/headers: cors }/headers: corsHeaders(req) }/g" "$f"
  sed -i "s/return json(result\.body, result\.status ?? 200)/return json(result.body, result.status ?? 200, req)/g" "$f"
  sed -i "s/return json({ error:/return json({ error: safeErrorMessage(e) }, 400, req);/g" "$f"
done
```
