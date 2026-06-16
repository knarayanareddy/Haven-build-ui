import { admin, corsHeaders, dispatchNotification, json, recordMetric } from "../_shared/core.ts";
import { requireInternalAccess } from "../_shared/internal.ts";
import { asyncWrapper } from "../_shared/async_wrapper.ts";
import { captureException } from "../_shared/sentry.ts";

interface VitalRow {
  id: string;
  elder_id: string;
  vital_type: string;
  value: number;
  unit: string;
}

Deno.serve(asyncWrapper("fn-vital-threshold-check", async (req: Request) => {
  const started = Date.now();
  requireInternalAccess(req);

  const db = admin();
  const { data: vitalsRows, error } = await db
    .from("vital_signs")
    .select("id, elder_id, vital_type, value, unit")
    .eq("threshold_flag", true)
    .is("family_notified_at", null)
    .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const vitals = vitalsRows as VitalRow[] ?? [];
  let notifiedCount = 0;

  for (const vital of vitals) {
    try {
      // 1. Gated Family Delegate Query (Replaced can_view_medications with notify_on_crisis)
      const { data: family } = await db
        .from("family_relationships")
        .select("family_member_id")
        .eq("elder_id", vital.elder_id)
        .eq("elder_consented", true)
        .eq("is_active", true)
        .eq("notify_on_crisis", true);

      // 2. Gated Professional Carer Query (Added carer_relationships notification)
      const { data: carers } = await db
        .from("carer_relationships")
        .select("carer_member_id")
        .eq("elder_id", vital.elder_id)
        .eq("is_active", true)
        .eq("notify_on_crisis", true);

      // 3. Combine both stakeholder destination lists
      const recipients: string[] = [
        ...(family ?? []).map((f) => String(f.family_member_id)),
        ...(carers ?? []).map((c) => String(c.carer_member_id)),
      ];

      // 4. Dispatch using Promise.allSettled per Finding #5 async wrapper pattern
      await Promise.allSettled(recipients.map(async (recipientId) => {
        try {
          await dispatchNotification({
            recipient_id: recipientId,
            elder_id: vital.elder_id,
            notification_type: "welzijnscheck",
            title_nl: "Gezondheidswaarde vraagt aandacht",
            title_en: "Health reading needs attention",
            body_nl: "HAVEN zag een gezondheidswaarde buiten de ingestelde grens.",
            body_en: "HAVEN saw a health reading outside the configured threshold.",
            data: { vital_sign_id: vital.id },
          });
        } catch (pushErr) {
          await captureException(pushErr, { fn: "fn-vital-threshold-check", context: "per_recipient_dispatch", recipient: recipientId });
        }
      }));

      // Flawlessly commit operational notification timestamp
      await db.from("vital_signs").update({ family_notified_at: new Date().toISOString() }).eq("id", vital.id);
      notifiedCount++;
    } catch (rowErr) {
      await captureException(rowErr, { fn: "fn-vital-threshold-check", context: "per_vital_row", vital_id: vital.id });
    }
  }

  await recordMetric("fn-vital-threshold-check", started, "success");
  return json({ success: true, notified: notifiedCount, vitals_processed: vitals.length }, 200, req);
}));
