import { admin, cors, corsHeaders, json, readJsonBody, recordMetric, safeErrorMessage } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    const body = await readJsonBody(req) as Record<string, unknown>;
    validateBody(body, { elder_id: 'uuid' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertSelf(userId, String(body.elder_id), 'BUURT opt-out');
    const db = admin();
    const now = new Date().toISOString();
    const { error: profileError } = await db.from("neighbourhood_profiles").update({ is_active: false, opted_out_at: now, deleted_at: now }).eq("elder_id", userId);
    if (profileError) throw profileError;
    const { error: tagsError } = await db.from("elder_interest_tags").delete().eq("elder_id", userId);
    if (tagsError) throw tagsError;
    const { error: connError } = await db.from("neighbourhood_connections").update({ status: "ended", ended_by: userId, ended_reason_internal: "elder_opted_out" }).or(`initiator_elder_id.eq.${userId},recipient_elder_id.eq.${userId}`);
    if (connError) throw connError;
    await recordMetric("fn-buurt-optout", started, "success");
    return json({ success: true, opted_out_at: now });
  } catch (e) {
    await recordMetric("fn-buurt-optout", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});