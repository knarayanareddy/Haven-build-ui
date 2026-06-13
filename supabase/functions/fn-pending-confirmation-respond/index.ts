import { admin, cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { confirmation_id: "uuid", resolution: "boolean" }, { allowUnknown: true });
    const userId = await getJwtUserId(req);

    const result = await withIdempotency({
      key: body.idempotency_key ?? String(body.confirmation_id),
      functionName: "fn-pending-confirmation-respond",
      requestBody: body,
      run: async () => {
        const db = userClient(req);
        const { data: pending, error: pErr } = await db.from("pending_confirmations")
          .select("*").eq("id", body.confirmation_id).maybeSingle();
        if (pErr) throw pErr;
        if (!pending) throw new Error("Confirmation not found");
        assertSelf(userId, String(pending.elder_id), "elder");
        if (new Date(pending.expires_at).getTime() < Date.now()) throw new Error("Confirmation expired");

        await db.from("pending_confirmations").update({
          resolution: Boolean(body.resolution),
          resolved_at: new Date().toISOString(),
        }).eq("id", body.confirmation_id);

        if (pending.confirmation_type === "fall_response" && body.resolution === true) {
          // Elder confirmed they are okay → mark fall as resolved.
          const dbAdmin = admin();
          await dbAdmin.from("fall_events").update({
            status: "resolved",
            elder_ack_at: new Date().toISOString(),
            resolution_notes: "Elder confirmed they are okay.",
          }).eq("id", pending.payload?.fall_event_id ?? "");
        }

        return { body: { confirmation_id: body.confirmation_id, resolution: Boolean(body.resolution), confirmation_type: pending.confirmation_type } };
      },
    });

    await recordMetric("fn-pending-confirmation-respond", started, "success");
    return json(result.body, result.status ?? 200);
  } catch (e) {
    await recordMetric("fn-pending-confirmation-respond", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
