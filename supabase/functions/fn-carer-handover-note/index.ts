import { admin, cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertCarerCan, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { assertNoBsnText } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, {
      elder_id: "uuid",
      appetite: "number",
      mood: "number",
    }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    await assertCarerCan(userId, String(body.elder_id));

    if (body.notes_nl || body.notes_en) {
      assertNoBsnText(body.notes_nl ?? "");
      assertNoBsnText(body.notes_en ?? "");
    }
    if (body.concerns_nl || body.concerns_en) {
      assertNoBsnText(body.concerns_nl ?? "");
      assertNoBsnText(body.concerns_en ?? "");
    }

    const idem = req.headers.get("idempotency-key") ?? body.idempotency_key;
    const result = await withIdempotency({
      key: idem,
      functionName: "fn-carer-handover-note",
      elderId: body.elder_id,
      profileId: userId,
      requestBody: body,
      run: async () => {
        const db = userClient(req);
        const { data: note, error } = await db.from("carer_handover_notes").insert({
          elder_id: body.elder_id,
          carer_id: userId,
          visit_id: body.visit_id ?? null,
          appetite: Math.max(1, Math.min(5, Number(body.appetite))),
          mood: Math.max(1, Math.min(5, Number(body.mood))),
          mobility: body.mobility ?? null,
          concerns_nl: body.concerns_nl ?? null,
          concerns_en: body.concerns_en ?? null,
          photo_path: body.photo_path ?? null,
          administered_medication_id: body.administered_medication_id ?? null,
          administered_at: body.administered_at ?? null,
        }).select().single();
        if (error) throw error;

        // Add family recipients as specified.
        const recipients: string[] = Array.isArray(body.family_recipient_ids) ? body.family_recipient_ids : [];
        for (const rid of recipients) {
          await db.from("carer_handover_recipients").insert({ handover_id: note.id, family_member_id: rid }).catch(() => undefined);
        }

        return { body: { handover_id: note.id, recipients_added: recipients.length, appetite: note.appetite, mood: note.mood } };
      },
    });

    await recordMetric("fn-carer-handover-note", started, "success");
    return json(result.body, result.status ?? 200);
  } catch (e) {
    await recordMetric("fn-carer-handover-note", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
