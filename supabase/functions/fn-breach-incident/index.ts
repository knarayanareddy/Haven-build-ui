import { cors, json, recordMetric, requireFields, userClient } from "../_shared/core.ts";
import { requireAdminBearer } from "../_shared/internal.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const adminUserId = await requireAdminBearer(req);
    const body = await req.json();
    requireFields(body, ["severity", "summary"]);
    const { data, error } = await userClient(req).from("data_breach_incidents").insert({ detected_by_id: body.detected_by_id ?? adminUserId, severity: body.severity, summary: body.summary, affected_data_categories: body.affected_data_categories ?? [], affected_subject_count: body.affected_subject_count, containment_action: body.containment_action, ap_notification_required: body.ap_notification_required, users_notification_required: body.users_notification_required, dpo_profile_id: body.dpo_profile_id }).select().single();
    if (error) throw error;
    await recordMetric("fn-breach-incident", started, "success");
    return json({ success: true, breach_incident_id: data.id, status: data.status });
  } catch (e) {
    await recordMetric("fn-breach-incident", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
