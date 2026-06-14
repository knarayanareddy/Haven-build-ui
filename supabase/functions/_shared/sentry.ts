// ─── P1-5 FIX: Validate DSN is a real Sentry endpoint ───
const SENTRY_DSN_REGEX = /^https:\/\/[a-f0-9]+@[a-zA-Z0-9.-]+\.ingest\.(us|de)\.sentry\.io\/\d+$/;

export async function captureException(error: unknown, context: Record<string, unknown> = {}) {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return;
  // P1-5 FIX: validate DSN format before sending
  if (!SENTRY_DSN_REGEX.test(dsn)) {
    console.warn('SENTRY_DSN does not match expected Sentry ingest URL format; skipping error report');
    return;
  }
  try {
    await fetch(dsn, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: String((error as Error)?.message ?? error),
        level: 'error',
        platform: 'deno',
        extra: scrub(context),
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Never throw from error reporting
  }
}

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = /email|phone|name|token|transcript|audio|address|secret|key|password|pin|bsn/i.test(k)
        ? '[redacted]'
        : scrub(v);
    }
    return out;
  }
  return value;
}
