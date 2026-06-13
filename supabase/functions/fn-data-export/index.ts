import { cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { getJwtUserId, assertSelf } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: 'uuid' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertSelf(userId, String(body.elder_id), 'elder export');
    const { data, error } = await userClient(req).rpc("export_elder_data", { p_elder_id: userId });
    if (error) throw error;
    await recordMetric("fn-data-export", started, "success");
    return json({ success: true, export: data });
  } catch (e) {
    await recordMetric("fn-data-export", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
