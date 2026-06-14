import { cors, corsHeaders, json, readJsonBody, recordMetric, safeErrorMessage, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    const body = await readJsonBody(req) as Record<string, unknown>;
    validateBody(body, { elder_id: 'uuid', consent_type: 'string', granted: 'boolean' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertSelf(userId, String(body.elder_id), 'consent update');

    const db = userClient(req);
    const { data: consent, error } = await db.from("consent_records").insert({ elder_id: userId, consent_type: body.consent_type, granted: Boolean(body.granted), channel: body.channel ?? "elder_app", consent_version: body.consent_version ?? "1.2.1", withdrawn_at: body.granted ? null : new Date().toISOString() }).select().single();
    if (error) throw error;
    if (body.relationship_id && body.relationship_kind === "family") {
      const { error: relError } = await db.from("family_relationships").update({ elder_consented: Boolean(body.granted), elder_consented_at: body.granted ? new Date().toISOString() : null, is_active: Boolean(body.granted) }).eq("id", body.relationship_id).eq("elder_id", userId);
      if (relError) throw relError;
    }
    await recordMetric("fn-consent-update", started, "success");
    return json({ success: true, consent_record_id: consent.id });
  } catch (e) {
    await recordMetric("fn-consent-update", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});