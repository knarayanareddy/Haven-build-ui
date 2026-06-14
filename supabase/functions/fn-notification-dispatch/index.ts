import { cors, corsHeaders, dispatchNotification, json, readJsonBody, recordMetric, requireFields, safeErrorMessage } from "../_shared/core.ts";
import { requireInternalAccess } from "../_shared/internal.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    requireInternalAccess(req);
    const body = await readJsonBody(req) as Record<string, unknown>;
    requireFields(body, ["recipient_id", "notification_type", "title_nl", "body_nl"]);
    const note = await dispatchNotification(body);
    await recordMetric("fn-notification-dispatch", started, "success");
    return json({ success: true, notification_id: note.id });
  } catch (e) {
    await recordMetric("fn-notification-dispatch", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});