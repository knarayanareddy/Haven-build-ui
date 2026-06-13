import { cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertActorMatches, assertCarerPermission, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: 'uuid', carer_id: 'uuid', visit_date: 'string' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertActorMatches(userId, String(body.carer_id), 'carer_id');
    await assertCarerPermission(userId, String(body.elder_id), 'create_visit_logs');
    const { data, error } = await userClient(req).from("carer_visit_logs").insert({ elder_id: body.elder_id, carer_id: userId, visit_date: body.visit_date, check_in_time: body.check_in_time ?? new Date().toISOString(), check_out_time: body.check_out_time, activities_nl: body.activities_nl ?? [], observations_nl: body.observations_nl, mood_observed: body.mood_observed, concerns_nl: body.concerns_nl, follow_up_required: Boolean(body.follow_up_required) }).select().single();
    if (error) throw error;
    await recordMetric("fn-care-visit-log", started, "success");
    return json({ success: true, visit_log_id: data.id });
  } catch (e) {
    await recordMetric("fn-care-visit-log", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
