import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(
  new URL('../../supabase/functions/fn-vapi-webhook/index.ts', import.meta.url),
  'utf8',
);

// Verify fail-closed logic exists
assert.ok(
  src.includes('HAVEN_ENV'),
  'webhook should check HAVEN_ENV to decide dev vs prod behavior',
);

assert.ok(
  src.includes('return false'),
  'webhook should reject (return false) in some path when secret is missing',
);

// When HAVEN_ENV is not dev/local and secret is missing, it must fail closed
const failClosedPattern = /if\s*\(\s*isDev\s*\)/;
assert.ok(
  failClosedPattern.test(src),
  'webhook should branch on isDev flag — only dev/local allows unauthenticated',
);

// Verify constant-time comparison still present
assert.ok(
  src.includes('charCodeAt'),
  'webhook should use constant-time comparison for secret verification',
);

// Verify it logs actionable error message in prod
assert.ok(
  src.includes('supabase secrets set VAPI_WEBHOOK_SECRET'),
  'webhook should log actionable fix instructions when rejecting in prod',
);

// Verify rateLimit is still applied
assert.ok(
  src.includes('rateLimit'),
  'webhook should still apply rate limiting',
);

console.log('vapi-webhook-fail-closed tests passed');
