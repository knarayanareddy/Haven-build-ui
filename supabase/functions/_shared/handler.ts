import { corsHeaders, json, readJsonBody, recordMetric, safeErrorMessage } from "../_shared/core.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { captureException } from "../_shared/sentry.ts";

/**
 * P0-1+P0-3+P0-4 FIX: Standardised secure handler wrapper for all Edge Functions.
 * Automatically provides:
 *  - Dynamic CORS + security headers on every response
 *  - Sanitised error messages (never leaks internals)
 *  - Rate limiting with per-function identity tracking
 *  - Request body size enforcement via readJsonBody
 *  - Sentry error capture on failures
 *  - Consistent OPTIONS preflight handling
 */
export function havenHandler(
  fnName: string,
  handler: (req: Request, body: Record<string, unknown>) => Promise<{ status?: number; body: unknown }>,
) {
  return Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
    const started = Date.now();
    try {
      // P0-4: rate limit before any processing
      await rateLimit(req, fnName);
      const body = await readJsonBody(req) as Record<string, unknown>;
      const result = await handler(req, body);
      await recordMetric(fnName, started, "success");
      return json(result.body, result.status ?? 200, req);
    } catch (e) {
      await captureException(e, { fn: fnName });
      await recordMetric(fnName, started, "error");
      return json({ error: safeErrorMessage(e) }, 400, req);
    }
  });
}
