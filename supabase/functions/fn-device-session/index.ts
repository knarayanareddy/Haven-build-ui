import { cors, json, recordMetric, sha256, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { profile_id: 'uuid', platform: 'string', device_id: 'string' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertSelf(userId, String(body.profile_id), 'device session');
    const device_id_hash = await sha256(String(body.device_id));
    const { data, error } = await userClient(req)
      .from("device_sessions")
      .upsert({ profile_id: userId, platform: body.platform, device_label: body.device_label, device_id_hash, last_seen_at: new Date().toISOString(), revoked_at: body.revoked ? new Date().toISOString() : null }, { onConflict: "profile_id,device_id_hash" })
      .select()
      .single();
    if (error) throw error;
    await recordMetric("fn-device-session", started, "success");
    return json({ success: true, device_session_id: data.id });
  } catch (e) {
    await recordMetric("fn-device-session", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
