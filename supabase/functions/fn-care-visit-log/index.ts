import { admin, corsHeaders, dispatchNotification, json, readJsonBody, recordMetric, safeErrorMessage, userClient } from "../_shared/core.ts";
import { assertActorMatches, assertCarerPermission, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    await rateLimit(req, "fn-care-visit-log");
    const body = await readJsonBody(req) as Record<string, unknown>;
    validateBody(body, { elder_id: 'uuid', carer_id: 'uuid', visit_date: 'string' }, { allowUnknown: true });
    
    const userId = await getJwtUserId(req);
    assertActorMatches(userId, String(body.carer_id), 'carer_id');
    await assertCarerPermission(userId, String(body.elder_id), 'create_visit_logs');

    // ─── Scope R6 Fix: Post-Erasure Identity Check ───
    // Query profiles.status for the elder_id in the request body
    // If status != 'active' -> return 403 immediately; no DB write
    // Log rejection to audit_log
    const dbAdmin = admin();
    const { data: targetProfile } = await dbAdmin
      .from("profiles")
      .select("status")
      .eq("id", body.elder_id)
      .maybeSingle();

    if (targetProfile?.status !== "active") {
      await dbAdmin.from("audit_log").insert({
        actor_id: userId,
        actor_role: "carer_professional",
        action: "POST_ERASURE_WRITE_REJECTION",
        table_name: "carer_visit_logs",
        elder_id: String(body.elder_id),
        extra: { reason: "Attempted to sync offline capture entries for an already erased or suspended older adult entity", profile_status: targetProfile?.status },
      }).catch(() => undefined);
      const err = new Error("403 Forbidden: Targeted older adult entity has been erased or suspended; write rejected");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const db = userClient(req);
    const { data, error } = await db.from("carer_visit_logs").insert({ 
      elder_id: body.elder_id, 
      carer_id: userId, 
      visit_date: body.visit_date, 
      check_in_time: body.check_in_time ?? new Date().toISOString(), 
      check_out_time: body.check_out_time ? String(body.check_out_time) : null, 
      activities_nl: body.activities_nl ?? [], 
      observations_nl: body.observations_nl ? String(body.observations_nl) : null, 
      mood_observed: body.mood_observed ? Number(body.mood_observed) : null, 
      concerns_nl: body.concerns_nl ? String(body.concerns_nl) : null, 
      follow_up_required: Boolean(body.follow_up_required) 
    }).select().single();
    
    if (error) throw error;

    // ─── Cross-app push notification to family members ───
    const { data: family } = await dbAdmin
      .from("family_relationships")
      .select("family_member_id")
      .eq("elder_id", body.elder_id)
      .eq("is_active", true)
      .eq("elder_consented", true);
    for (const f of family ?? []) {
      try {
        await dispatchNotification({
          recipient_id: String(f.family_member_id),
          elder_id: String(body.elder_id),
          notification_type: "carer_visit",
          title_nl: "Zorgbezoek afgerond",
          title_en: "Care visit completed",
          body_nl: "De verzorger heeft het bezoek afgerond. Bekijk het rapport in HAVEN.",
          body_en: "The carer has completed the visit. View the report in HAVEN.",
          data: { visit_log_id: data.id },
        });
      } catch {
        // Non-blocking: notification failure should not fail the visit log
      }
    }

    await recordMetric("fn-care-visit-log", started, "success");
    return json({ success: true, visit_log_id: data.id }, 200, req);
  } catch (error) {
    const isR6Err = String((error as Error).message ?? error).includes("403 Forbidden: Targeted older adult");
    const status = (error as { status?: number }).status ?? (isR6Err ? 403 : 400);

    await recordMetric("fn-care-visit-log", started, "error");
    return json({ error: safeErrorMessage(error) }, status, req);
  }
});
