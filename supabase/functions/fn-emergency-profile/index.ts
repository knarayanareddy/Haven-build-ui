import { corsHeaders, json, publicClient, readJsonBody, recordMetric, safeErrorMessage, sha256, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    const body = await readJsonBody(req) as Record<string, unknown>;
    if (body.action === "create_token") {
      // P0-4: rate limit token creation
      rateLimit(req, "fn-emergency-profile-create");
      validateBody(body, { action: 'string', elder_id: 'uuid', label: 'string' }, { allowUnknown: true });
      const userId = await getJwtUserId(req);
      assertSelf(userId, String(body.elder_id), 'emergency profile token');
      const raw = crypto.randomUUID() + crypto.randomUUID();
      const token_hash = await sha256(raw);
      const { data, error } = await userClient(req)
        .from("emergency_access_tokens")
        .insert({ elder_id: userId, token_hash, label: body.label, expires_at: body.expires_at ?? null })
        .select()
        .single();
      if (error) throw error;
      await recordMetric("fn-emergency-profile", started, "success");
      return json({ success: true, token_id: data.id, emergency_token: raw }, 200, req);
    }

    // P1-7 FIX: Rate-limit the public retrieval endpoint to prevent enumeration
    rateLimit(req, "fn-emergency-profile-lookup");
    validateBody(body, { emergency_token: 'string' }, { allowUnknown: true });
    const { data, error } = await publicClient().rpc("get_emergency_profile", { p_token: body.emergency_token });
    if (error) throw error;
    await recordMetric("fn-emergency-profile", started, "success");
    return json({ success: true, emergency_profile: data }, 200, req);
  } catch (e) {
    await recordMetric("fn-emergency-profile", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});