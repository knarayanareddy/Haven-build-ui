import { admin, cors, corsHeaders, json, recordMetric, safeErrorMessage } from "../_shared/core.ts";
import { requireInternalAccess } from "../_shared/internal.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    requireInternalAccess(req);
    const db = admin();
    const [profiles, flags, metrics] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('feature_flags').select('id', { count: 'exact', head: true }),
      db.from('perf_metrics').select('id', { count: 'exact', head: true }).gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
    ]);
    await recordMetric('fn-health-check', started, 'success');
    return json({ success: true, status: 'ok', checks: { database: profiles.error ? 'error' : 'ok', feature_flags: flags.error ? 'error' : 'ok', recent_metrics_count: metrics.count ?? 0 }, timestamp: new Date().toISOString() });
  } catch (e) {
    await recordMetric('fn-health-check', started, 'error');
    return json({ success: false, status: 'error', error: safeErrorMessage(e) }, 500);
  }
});