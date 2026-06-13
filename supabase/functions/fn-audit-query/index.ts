import { admin, cors, json, recordMetric } from "../_shared/core.ts";
import { assertSelfOrAdmin, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: 'uuid' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    await assertSelfOrAdmin(userId, String(body.elder_id));
    const { data, error } = await admin()
      .from("audit_log")
      .select("action,table_name,record_id,created_at,extra")
      .eq("elder_id", body.elder_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(body.limit ?? 50), 200));
    if (error) throw error;
    await recordMetric("fn-audit-query", started, "success");
    return json({ success: true, audit_events: data });
  } catch (e) {
    await recordMetric("fn-audit-query", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
