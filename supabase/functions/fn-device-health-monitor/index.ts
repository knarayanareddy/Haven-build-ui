import { admin, cors, corsHeaders, dispatchNotification, json, recordMetric, requireInternalAccess, safeErrorMessage } from "../_shared/core.ts";

const TWELVE_H = 12;
const TWENTY_FOUR_H = 24;
const FORTY_EIGHT_H = 48;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    requireInternalAccess(req);
    const db = admin();
    const now = Date.now();

    // For each elder with active family, find the latest device session.
    const { data: elders } = await db.from("profiles")
      .select("id, preferred_name, full_name")
      .eq("role", "elder")
      .is("deleted_at", null);
    const eventsWritten: string[] = [];
    const familyNotified: string[] = [];
    const escalations: string[] = [];

    for (const elder of elders ?? []) {
      const { data: session } = await db.from("device_sessions")
        .select("id, last_seen_at, platform")
        .eq("profile_id", elder.id)
        .is("revoked_at", null)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!session) {
        // No session recorded ever → mark warn.
        const { data: ev } = await db.from("device_health_events").insert({
          profile_id: elder.id,
          severity: "warn",
          event_key: "no_heartbeat_12h",
          message_nl: "HAVEN heeft nog geen hartslag ontvangen.",
          message_en: "HAVEN has not received a heartbeat yet.",
          details: { reason: "no_session_recorded" },
        }).select("id").single();
        if (ev) eventsWritten.push(ev.id);
        continue;
      }
      const ageMs = now - new Date(session.last_seen_at).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      if (ageHours >= FORTY_EIGHT_H) {
        const { data: ev } = await db.from("device_health_events").insert({
          profile_id: elder.id,
          device_session_id: session.id,
          severity: "p0",
          event_key: "no_heartbeat_48h",
          message_nl: "HAVEN heeft al twee dagen geen contact gehad met de telefoon.",
          message_en: "HAVEN has not heard from the phone in 2 days.",
          details: { last_seen_at: session.last_seen_at, age_hours: Math.round(ageHours) },
        }).select("id").single();
        if (ev) eventsWritten.push(ev.id);
        // Notify family with escalated severity
        const { data: family } = await db.from("family_relationships")
          .select("family_member_id").eq("elder_id", elder.id).eq("elder_consented", true).eq("is_active", true).eq("notify_on_crisis", true);
        for (const f of family ?? []) {
          await dispatchNotification({
            recipient_id: f.family_member_id,
            elder_id: elder.id,
            notification_type: "welzijnscheck",
            title_nl: "HAVEN heeft al twee dagen geen contact",
            title_en: "HAVEN has been offline for 2 days",
            body_nl: "Het kan zijn dat de telefoon uit staat, of dat er iets is veranderd in de rechten. Wilt u even langsgaan?",
            body_en: "The phone may be off, or permissions may have changed. Could you check in?",
            data: { device_session_id: session.id, severity: "p0" },
          });
        }
        escalations.push(elder.id);
        familyNotified.push(...(family ?? []).map((f) => f.family_member_id));
        continue;
      }
      if (ageHours >= TWENTY_FOUR_H) {
        const { data: ev } = await db.from("device_health_events").insert({
          profile_id: elder.id,
          device_session_id: session.id,
          severity: "p1",
          event_key: "no_heartbeat_24h",
          message_nl: "HAVEN heeft vandaag geen contact gehad met de telefoon.",
          message_en: "HAVEN has not heard from the phone today.",
          details: { last_seen_at: session.last_seen_at, age_hours: Math.round(ageHours) },
        }).select("id").single();
        if (ev) eventsWritten.push(ev.id);
        const { data: family } = await db.from("family_relationships")
          .select("family_member_id").eq("elder_id", elder.id).eq("elder_consented", true).eq("is_active", true);
        for (const f of family ?? []) {
          await dispatchNotification({
            recipient_id: f.family_member_id,
            elder_id: elder.id,
            notification_type: "welzijnscheck",
            title_nl: "HAVEN heeft vandaag niet gecheckt",
            title_en: "HAVEN hasn't checked in today",
            body_nl: "Het kan zijn dat de telefoon uit staat of dat er iets is veranderd in de rechten. Een belletje kan geen kwaad.",
            body_en: "The phone may be off or permissions changed. A quick call is a good idea.",
            data: { device_session_id: session.id, severity: "p1" },
          });
        }
        familyNotified.push(...(family ?? []).map((f) => f.family_member_id));
        continue;
      }
      if (ageHours >= TWELVE_H) {
        const { data: ev } = await db.from("device_health_events").insert({
          profile_id: elder.id,
          device_session_id: session.id,
          severity: "warn",
          event_key: "no_heartbeat_12h",
          message_nl: "HAVEN heeft al meer dan 12 uur niet gecheckt bij de telefoon.",
          message_en: "HAVEN hasn't checked in for over 12 hours.",
          details: { last_seen_at: session.last_seen_at, age_hours: Math.round(ageHours) },
        }).select("id").single();
        if (ev) eventsWritten.push(ev.id);
      }
    }

    await recordMetric("fn-device-health-monitor", started, "success");
    return json({ ok: true, events_written: eventsWritten.length, family_notified: familyNotified.length, escalations: escalations.length });
  } catch (e) {
    await recordMetric("fn-device-health-monitor", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});