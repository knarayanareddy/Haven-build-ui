import { admin, cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertElderOrFamilyCan, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

const PROVIDERS = new Set(["mock", "livekit", "twilio"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: "uuid", provider: "string" }, { allowUnknown: true });
    if (!PROVIDERS.has(String(body.provider))) throw new Error("provider must be mock, livekit or twilio");
    const userId = await getJwtUserId(req);
    await assertElderOrFamilyCan(userId, String(body.elder_id), "messages");

    const idem = req.headers.get("idempotency-key") ?? body.idempotency_key;
    const result = await withIdempotency({
      key: idem,
      functionName: "fn-video-call-create",
      elderId: body.elder_id,
      profileId: userId,
      requestBody: body,
      run: async () => {
        const roomId = `haven-${body.elder_id}-${Date.now()}`;
        const db = userClient(req);
        const { data: session, error } = await db.from("video_call_sessions").insert({
          elder_id: body.elder_id,
          initiator_id: userId,
          provider: body.provider,
          provider_room_id: roomId,
          status: "created",
        }).select().single();
        if (error) throw error;
        return { body: { video_call_session_id: session.id, provider: body.provider, provider_room_id: roomId, status: "created", join_url_for_elder: `haven://call/${session.id}?role=elder` } };
      },
    });

    await recordMetric("fn-video-call-create", started, "success");
    return json(result.body, result.status ?? 200);
  } catch (e) {
    await recordMetric("fn-video-call-create", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
