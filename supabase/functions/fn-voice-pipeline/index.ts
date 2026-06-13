import { admin, cors, dispatchNotification, json, recordMetric, userClient } from "../_shared/core.ts";
import { companionReply, generateEmbedding, synthesizeSpeechToStorage, transcribeDutchAudio } from "../_shared/ai.ts";
import { assertSelf, getJwtUserId, assertElderOrFamilyCan, assertCarerCan } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

function classify(transcript: string) {
  const t = transcript.toLowerCase();
  if (/(ingenomen|taken|done|klaar)/.test(t)) return { intent: "bevestig_ingenomen", action: "CONFIRM_MEDICATION_TAKEN" };
  if (/(gevallen|help|bang|ambulance|niet goed|scared|fallen|niet meer zijn)/.test(t)) return { intent: "crisis", action: "TRIGGER_CRISIS_FLOW" };
  if (/(verhaal|story|memory|herinnering)/.test(t)) return { intent: "life_story", action: "START_STORY" };
  if (/(familie|sarah|bericht|message)/.test(t)) return { intent: "family_message", action: "OPEN_FAMILY" };
  return { intent: "companion", action: "COMPANION_REPLY" };
}

async function isRepeatBackEnabled(adminClient: ReturnType<typeof admin>) {
  const { data: flag } = await adminClient.from("feature_flags").select("enabled, rollout_pct").eq("flag_key", "med_repeatback_confirmation_enabled").maybeSingle();
  return Boolean(flag?.enabled);
}

async function selectVoiceConfig(adminClient: ReturnType<typeof admin>, elderId: string, locale: "en-GB" | "nl-NL"): Promise<{ voiceId?: string; useFamiliar: boolean; crisisOverride: boolean; disclosure: "always" | "first_of_day" | "none" }> {
  const { data: pref } = await adminClient.from("elder_voice_preferences").select("voice_profile_id, use_familiar_voice, disclosure_mode").eq("elder_id", elderId).maybeSingle();
  if (!pref?.use_familiar_voice || !pref.voice_profile_id) return { useFamiliar: false, crisisOverride: false, disclosure: "none" };
  const { data: profile } = await adminClient.from("voice_profiles").select("status, provider_voice_id").eq("id", pref.voice_profile_id).maybeSingle();
  if (!profile || profile.status !== "ready") return { useFamiliar: false, crisisOverride: false, disclosure: "none" };
  return { voiceId: profile.provider_voice_id ?? undefined, useFamiliar: true, crisisOverride: false, disclosure: pref.disclosure_mode ?? "first_of_day" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { elder_id: "uuid", screen_id: "string" }, { allowUnknown: true });
    const userId = await getJwtUserId(req);

    // Support self or delegated access (Family with message permission, or Carer)
    let authorized = false;
    if (userId === String(body.elder_id)) {
      authorized = true;
    } else {
      const isFamily = await assertElderOrFamilyCan(userId, String(body.elder_id), "messages").then(() => true).catch(() => false);
      const isCarer = await assertCarerCan(userId, String(body.elder_id)).then(() => true).catch(() => false);
      authorized = isFamily || isCarer;
    }
    if (!authorized) {
      throw new Error("Caller is not authorized to interact on behalf of this elder");
    }

    const idem = req.headers.get("idempotency-key") ?? body.idempotency_key;
    const result = await withIdempotency({
      key: idem,
      functionName: "fn-voice-pipeline",
      elderId: body.elder_id,
      profileId: userId,
      requestBody: body,
      run: async () => {
        const db = userClient(req);
        const dbAdmin = admin();
        const locale = (body.locale === "nl-NL" ? "nl-NL" : "en-GB") as "en-GB" | "nl-NL";
        const transcript = body.audio_base64 ? await transcribeDutchAudio(String(body.audio_base64)) : String(body.transcript_text ?? (locale === "nl-NL" ? "Ik heb mijn pillen ingenomen en ik voel me rustig." : "I took my pills and I feel calm."));
        const c = classify(transcript);
        const distress = c.intent === "crisis";

        // Repeat-back confirmation for medication intake when flag is on.
        const repeatBackOn = await isRepeatBackEnabled(dbAdmin);
        if (c.intent === "bevestig_ingenomen" && repeatBackOn) {
          // Insert a pending_confirmation instead of immediately marking the reminder taken.
          const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();
          const { data: reminders } = await db.from("medication_reminders").select("id, medication_id").eq("elder_id", body.elder_id).in("status", ["gepland", "herinnerd", "gesnoozed_1", "gesnoozed_2", "geëscaleerd"]).order("scheduled_time", { ascending: true }).limit(1);
          const reminder = reminders?.[0];
          await db.from("pending_confirmations").insert({
            elder_id: body.elder_id,
            confirmation_type: "medication_taken",
            payload: { transcript, medication_reminder_id: reminder?.id ?? null, medication_id: reminder?.medication_id ?? null },
            expires_at: expiresAt,
          });
          const askBack = locale === "nl-NL"
            ? `Ik hoorde u zeggen dat u uw medicijn heeft ingenomen. Klopt dat? Zeg ja of nee.`
            : `I heard you say you took your medicine. Is that correct? Please say yes or no.`;
          // Persist the interaction in "awaiting confirmation" mode.
          await db.from("voice_interactions").insert({
            elder_id: body.elder_id,
            screen_id: body.screen_id,
            transcript_nl: locale === "nl-NL" ? transcript : null,
            transcript_en: locale === "en-GB" ? transcript : null,
            intent: c.intent,
            entities: body.entities ?? {},
            response_text_nl: locale === "nl-NL" ? askBack : null,
            response_text_en: locale === "en-GB" ? askBack : null,
            distress_detected: false,
            action_taken: "AWAIT_REPEAT_BACK",
            duration_ms: Date.now() - started,
          });
          const voice = await selectVoiceConfig(dbAdmin, body.elder_id, locale);
          const audioUrl = await synthesizeSpeechToStorage({ elderId: body.elder_id, interactionId: `await-${Date.now()}`, text: askBack, locale }).catch(() => null);
          return { body: { intent: c.intent, action_taken: "AWAIT_REPEAT_BACK", awaiting_confirmation: true, confirmation_prompt: askBack, audio_url: audioUrl, voice_profile: voice } };
        }

        const memoriesResponse = await db.from("companion_memory").select("content_nl,content_en").eq("elder_id", body.elder_id).is("deleted_at", null).limit(6);
        if (memoriesResponse.error) throw memoriesResponse.error;
        const memories = (memoriesResponse.data ?? []).map((m) => locale === "nl-NL" ? m.content_nl : (m.content_en ?? m.content_nl));

        const responseText = distress
          ? (locale === "nl-NL" ? "Ik ben bij u. Ik waarschuw uw familie en toon de hulpknop." : "I am with you. I will notify your family and show the help button.")
          : c.intent === "bevestig_ingenomen"
            ? (locale === "nl-NL" ? "Goed gedaan. Ik heb het genoteerd." : "Well done. I recorded it.")
            : await companionReply({ locale, transcript, memories, screenId: body.screen_id });

        const embedding = await generateEmbedding(transcript).catch(() => null);

        const { data: interaction, error } = await db.from("voice_interactions").insert({
          elder_id: body.elder_id,
          screen_id: body.screen_id,
          transcript_nl: locale === "nl-NL" ? transcript : null,
          transcript_en: locale === "en-GB" ? transcript : null,
          intent: c.intent,
          entities: body.entities ?? {},
          response_text_nl: locale === "nl-NL" ? responseText : null,
          response_text_en: locale === "en-GB" ? responseText : null,
          distress_detected: distress,
          distress_phrase: distress ? transcript : null,
          action_taken: c.action,
          duration_ms: Date.now() - started,
          embedding,
        }).select().single();
        if (error) throw error;

        if (c.intent === "bevestig_ingenomen" && !repeatBackOn) {
          const { data: reminders, error: remindersError } = await db.from("medication_reminders").select("id").eq("elder_id", body.elder_id).in("status", ["gepland", "herinnerd", "gesnoozed_1", "gesnoozed_2", "geëscaleerd"]).order("scheduled_time", { ascending: true }).limit(1);
          if (remindersError) throw remindersError;
          if (reminders?.[0]) {
            const { error: markError } = await db.rpc("mark_reminder_taken", { p_reminder_id: reminders[0].id, p_elder_id: body.elder_id });
            if (markError) throw markError;
          }
        }

        if (c.intent === "companion" && transcript.length > 12) {
          const { error: memoryError } = await db.from("companion_memory").insert({ elder_id: body.elder_id, memory_type: "emotional_state", content_nl: locale === "nl-NL" ? transcript.slice(0, 240) : "Gesprek in Engels opgeslagen.", content_en: locale === "en-GB" ? transcript.slice(0, 240) : null, importance_score: 4, embedding, source: "voice_interaction", source_id: interaction.id });
          if (memoryError) throw memoryError;
        }

        if (distress) {
          const { data: family, error: familyError } = await db.from("family_relationships").select("family_member_id").eq("elder_id", body.elder_id).eq("elder_consented", true).eq("is_active", true).eq("notify_on_crisis", true);
          if (familyError) throw familyError;
          await Promise.all((family ?? []).map((f) => dispatchNotification({ recipient_id: f.family_member_id, elder_id: body.elder_id, notification_type: "crisis_gedetecteerd", title_nl: "HAVEN hulpvraag", title_en: "HAVEN help request", body_nl: "Er is een mogelijke hulpvraag uitgesproken. Bel rustig meteen even.", body_en: "A possible help request was spoken. Please calmly call now.", data: { interaction_id: interaction.id } })));
        }

        // Voice selection: crisis → neutral voice; otherwise prefer Familiar Voice if configured.
        let voice = await selectVoiceConfig(dbAdmin, body.elder_id, locale);
        if (distress) voice = { ...voice, crisisOverride: true, useFamiliar: false };
        let speakText = responseText;
        if (voice.useFamiliar && voice.disclosure === "always") {
          speakText = (locale === "nl-NL" ? "Dit is HAVEN, met de stem van uw familielid. " : "This is HAVEN, using your family member's voice. ") + responseText;
        }

        const audioUrl = await synthesizeSpeechToStorage({ elderId: body.elder_id, interactionId: interaction.id, text: speakText, locale }).catch(() => null);
        if (audioUrl) {
          await db.from("voice_interactions").update({ response_audio_path: `tts-cache/${body.elder_id}/${interaction.id}.mp3` }).eq("id", interaction.id);
        }

        await recordMetric("fn-voice-pipeline", started, "success");
        return { body: { transcript, intent: c.intent, entities: body.entities ?? {}, response_text: speakText, audio_url: audioUrl, action_taken: c.action, distress_detected: distress, interaction_id: interaction.id, voice_profile: voice } };
      },
    });

    return json(result.body, result.status ?? 200);
  } catch (e) {
    await recordMetric("fn-voice-pipeline", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
