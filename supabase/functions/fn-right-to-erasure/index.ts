import { admin, cors, json, recordMetric } from "../_shared/core.ts";
import { assertActorMatches, assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

async function removeStoragePrefix(bucket: string, prefix: string) {
  const db = admin();
  const { data, error } = await db.from('storage.objects').select('name').eq('bucket_id', bucket).like('name', `${prefix}/%`).limit(1000);
  if (error) throw error;
  const names = (data ?? []).map((row) => row.name).filter(Boolean);
  if (!names.length) return 0;
  const result = await db.storage.from(bucket).remove(names);
  if (result.error) throw result.error;
  return names.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: 'uuid' }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    assertSelf(userId, String(body.elder_id), 'elder deletion request');
    assertActorMatches(userId, typeof body.requested_by_id === 'string' ? body.requested_by_id : undefined, 'requested_by_id');

    const db = admin();
    const { data: requestRow, error } = await db
      .from("deletion_requests")
      .insert({ elder_id: userId, requested_by_id: userId, reason: body.reason ?? "user_request", status: "processing" })
      .select()
      .single();
    if (error) throw error;

    const now = new Date().toISOString();
    const softDeleteTables = [
      "elder_profiles",
      "contacts",
      "medications",
      "tasks",
      "family_messages",
      "life_stories",
      "memory_lane_photos",
      "documents",
      "companion_memory",
      "scam_events",
      "location_events",
      "neighbourhood_profiles",
      "financial_accounts",
      "financial_transactions",
      "nutrition_logs",
      "browser_shield_events",
      "care_plans",
      "care_plan_items",
      "carer_visit_logs",
      "appointments",
      "transport_requests",
      "telehealth_sessions",
      "driving_events",
      "wandering_events",
      "wearable_devices",
      "skill_offerings",
      "skill_exchange_matches",
      "legacy_accounts",
      "bereavement_events",
      "grandchild_profiles",
      "medication_ocr_jobs",
      "document_analysis_jobs",
      "fhir_import_jobs",
      "external_care_sync_jobs",
      "medication_refill_events"
    ];
    for (const table of softDeleteTables) {
      const { error: updateError } = await db.from(table).update({ deleted_at: now }).eq("elder_id", userId);
      if (updateError) throw updateError;
    }

    const bulkUpdates = [
      db.from("voice_interactions").update({ transcript_nl: null, transcript_en: null, response_text_nl: null, response_text_en: null, deleted_at: now }).eq("elder_id", userId),
      db.from("family_relationships").update({ is_active: false, elder_consented: false, deleted_at: now }).eq("elder_id", userId),
      db.from("carer_relationships").update({ is_active: false, elder_consented: false, deleted_at: now }).eq("elder_id", userId),
    ];
    for (const result of await Promise.all(bulkUpdates)) if (result.error) throw result.error;

    const directDeletes = [
      db.from("consent_records").delete().eq("elder_id", userId),
      db.from("medication_reminders").delete().eq("elder_id", userId),
      db.from("wellness_checkins").delete().eq("elder_id", userId),
      db.from("hydration_logs").delete().eq("elder_id", userId),
      db.from("vital_signs").delete().eq("elder_id", userId),
      db.from("cognitive_checkins").delete().eq("elder_id", userId),
      db.from("incidents").delete().eq("elder_id", userId),
      db.from("safeguarding_reports").delete().eq("elder_id", userId),
      db.from("device_sessions").delete().eq("profile_id", userId),
      db.from("notification_preferences").delete().eq("profile_id", userId),
      db.from("push_tokens").update({ is_active: false }).eq("profile_id", userId),
      db.from("notifications").delete().eq("elder_id", userId),
      db.from("notifications").delete().eq("recipient_id", userId),
      db.from("call_reputation_lookups").delete().eq("elder_id", userId),
      db.from("health_record_imports").delete().eq("elder_id", userId),
      db.from("safety_digests").delete().eq("elder_id", userId),
      db.from("elder_interest_tags").delete().eq("elder_id", userId),
      db.from("event_interests").delete().eq("elder_id", userId),
      db.from("emergency_access_tokens").delete().eq("elder_id", userId),
      db.from("emergency_profile_access_log").delete().eq("elder_id", userId),
      db.from("app_events").delete().eq("elder_id", userId),
      db.from("app_events").delete().eq("profile_id", userId),
      db.from("idempotency_keys").delete().eq("elder_id", userId),
      db.from("idempotency_keys").delete().eq("profile_id", userId),
    ];
    for (const result of await Promise.all(directDeletes)) if (result.error) throw result.error;

    const { error: connectionError } = await db.from("neighbourhood_connections").update({ status: "ended", ended_by: userId, ended_reason_internal: "elder_erasure_request" }).or(`initiator_elder_id.eq.${userId},recipient_elder_id.eq.${userId}`);
    if (connectionError) throw connectionError;

    const storageCleanup = {} as Record<string, number>;
    for (const bucket of ["voice-notes", "life-story-audio", "life-story-photos", "profile-photos", "document-vault", "ocr-inbox", "tts-cache"]) {
      storageCleanup[bucket] = await removeStoragePrefix(bucket, userId);
    }

    const { error: reqUpdateError } = await db.from("deletion_requests").update({ status: "completed", completed_at: now, confirmation_sent_at: now }).eq("id", requestRow.id);
    if (reqUpdateError) throw reqUpdateError;
    await recordMetric("fn-right-to-erasure", started, "success");
    return json({ success: true, deletion_request_id: requestRow.id, completed_at: now, storage_cleanup: storageCleanup, legacy_secret_store_cleanup_required: true });
  } catch (e) {
    await recordMetric("fn-right-to-erasure", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
