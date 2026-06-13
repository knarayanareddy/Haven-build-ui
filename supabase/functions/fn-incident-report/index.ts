import { admin, cors, dispatchNotification, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertActorMatches, assertCarerPermission, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: 'uuid', reported_by_id: 'uuid', incident_type: 'string', description_nl: 'string', severity: 'string' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertActorMatches(userId, String(body.reported_by_id), 'reported_by_id');
    await assertCarerPermission(userId, String(body.elder_id), 'incidents');
    const db = userClient(req);
    const { data, error } = await db.from("incidents").insert({ elder_id: body.elder_id, reported_by_id: userId, incident_type: body.incident_type, description_nl: body.description_nl, severity: body.severity, meldcode_step_reached: body.meldcode_step_reached, external_report_made: Boolean(body.external_report_made), external_authority_nl: body.external_authority_nl }).select().single();
    if (error) throw error;
    if (["hoog", "kritiek"].includes(body.severity)) {
      const { data: family } = await admin().from("family_relationships").select("family_member_id").eq("elder_id", body.elder_id).eq("elder_consented", true).eq("is_active", true).eq("can_view_alerts", true);
      await Promise.all((family ?? []).map((f) => dispatchNotification({ recipient_id: f.family_member_id, elder_id: body.elder_id, notification_type: "systeem", title_nl: "Zorgincident", title_en: "Care incident", body_nl: "Er is een zorgincident vastgelegd dat aandacht vraagt.", body_en: "A care incident was recorded and needs attention.", data: { incident_id: data.id } })));
    }
    await recordMetric("fn-incident-report", started, "success");
    return json({ success: true, incident_id: data.id });
  } catch (e) {
    await recordMetric("fn-incident-report", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
