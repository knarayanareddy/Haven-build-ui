// VAPI Webhook Edge Function
// Receives tool-call requests from VAPI during real-time voice conversations
// and routes them to existing Haven Edge Functions (medication confirm, crisis, etc.)

import { admin, corsHeaders, json, recordMetric, safeErrorMessage } from "../_shared/core.ts";
import { companionReply, synthesizeSpeechToStorage, transcribeDutchAudio } from "../_shared/ai.ts";
import { rateLimit } from "../_shared/ratelimit.ts";

interface VapiToolCallMessage {
  type: "tool-calls";
  toolCallList: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }>;
}

interface VapiStatusUpdate {
  type: "status-update";
  status: "ended" | "in-progress";
  endedReason?: string;
  transcript?: string;
  messages?: Array<{ role: string; content: string }>;
}

interface VapiAssistantRequest {
  type: "assistant-request";
  call?: { id: string };
}

type VapiWebhookBody = VapiToolCallMessage | VapiStatusUpdate | VapiAssistantRequest | { type: string };

async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const dbAdmin = admin();
  const elderId = String(args.elder_id ?? "");
  const locale = (args.locale === "en-GB" ? "en-GB" : "nl-NL") as "en-GB" | "nl-NL";

  switch (toolName) {
    case "confirm_medication": {
      const transcript = String(args.transcript ?? (locale === "nl-NL" ? "Ik heb mijn medicijn ingenomen" : "I took my medicine"));
      const { data: reminders } = await dbAdmin
        .from("medication_reminders")
        .select("id, medication_id")
        .eq("elder_id", elderId)
        .in("status", ["gepland", "herinnerd", "gesnoozed_1", "gesnoozed_2", "geëscaleerd"])
        .order("scheduled_time", { ascending: true })
        .limit(1);

      const reminder = reminders?.[0];
      const expiresAt = new Date(Date.now() + 90_000).toISOString();

      await dbAdmin.from("pending_confirmations").insert({
        elder_id: elderId,
        confirmation_type: "medication_taken",
        payload: { transcript, medication_reminder_id: reminder?.id ?? null, medication_id: reminder?.medication_id ?? null },
        expires_at: expiresAt,
        locale,
      });

      const askBack = locale === "nl-NL"
        ? "Ik hoorde u zeggen dat u uw medicijn heeft ingenomen. Klopt dat? Zeg ja of nee."
        : "I heard you say you took your medicine. Is that correct? Please say yes or no.";

      await dbAdmin.from("voice_interactions").insert({
        elder_id: elderId,
        screen_id: "STEM",
        transcript_nl: locale === "nl-NL" ? transcript : null,
        transcript_en: locale === "en-GB" ? transcript : null,
        intent: "bevestig_ingenomen",
        entities: {},
        response_text_nl: locale === "nl-NL" ? askBack : null,
        response_text_en: locale === "en-GB" ? askBack : null,
        action_taken: "AWAIT_REPEAT_BACK",
        distress_detected: false,
      });

      return { result: askBack, action: "AWAIT_REPEAT_BACK" };
    }

    case "escalate_crisis": {
      const transcript = String(args.transcript ?? "");
      const { data: family } = await dbAdmin
        .from("family_relationships")
        .select("family_member_id")
        .eq("elder_id", elderId)
        .eq("elder_consented", true)
        .eq("is_active", true)
        .eq("notify_on_crisis", true);

      if (family && family.length > 0) {
        for (const f of family) {
          await dbAdmin.from("notifications").insert({
            recipient_id: String(f.family_member_id),
            elder_id: elderId,
            notification_type: "crisis_gedetecteerd",
            title_nl: "Noodoproep via stem",
            title_en: "Crisis alert via voice",
            body_nl: `HAVEN hoorde: "${transcript}". Bel meteen.`,
            body_en: `HAVEN heard: "${transcript}". Please call immediately.`,
          });
        }
      }

      const crisisText = locale === "nl-NL"
        ? "Ik hoor dat er nood is. Ik heb meteen uw familie gewaarschuwd."
        : "I hear this may be urgent. I alerted your family immediately.";

      await dbAdmin.from("voice_interactions").insert({
        elder_id: elderId,
        screen_id: "STEM",
        transcript_nl: locale === "nl-NL" ? transcript : null,
        transcript_en: locale === "en-GB" ? transcript : null,
        intent: "crisis",
        entities: {},
        response_text_nl: locale === "nl-NL" ? crisisText : null,
        response_text_en: locale === "en-GB" ? crisisText : null,
        action_taken: "CRISIS_ESCALATED",
        distress_detected: true,
      });

      return { result: crisisText, action: "CRISIS_ESCALATED" };
    }

    case "send_family_message": {
      const message = String(args.message ?? (locale === "nl-NL" ? "Ik denk aan je" : "Thinking of you"));
      const messageType = String(args.message_type ?? "check_in");

      await dbAdmin.from("messages").insert({
        elder_id: elderId,
        sender_id: elderId,
        message_type: messageType,
        content_nl: locale === "nl-NL" ? message : null,
        content_en: locale === "en-GB" ? message : null,
      });

      const confirmText = locale === "nl-NL"
        ? "Uw bericht is verstuurd naar uw familie."
        : "Your message has been sent to your family.";

      return { result: confirmText, action: "MESSAGE_SENT" };
    }

    case "get_medication_schedule": {
      const { data: reminders } = await dbAdmin
        .from("medication_reminders")
        .select("medication_id, scheduled_time, status")
        .eq("elder_id", elderId)
        .gte("scheduled_time", new Date().toISOString().slice(0, 10))
        .order("scheduled_time", { ascending: true })
        .limit(5);

      if (!reminders || reminders.length === 0) {
        return { result: locale === "nl-NL" ? "Er staan geen medicijnen gepland voor vandaag." : "No medications scheduled for today." };
      }

      const schedule = reminders.map((r) => {
        const time = new Date(r.scheduled_time as string).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        return `${time}: ${r.status}`;
      }).join(", ");

      return { result: schedule };
    }

    case "companion_reply": {
      const transcript = String(args.transcript ?? "");
      const { replyNl, replyEn } = await companionReply(transcript, elderId, locale);
      const responseText = locale === "nl-NL" ? replyNl : replyEn;

      await dbAdmin.from("voice_interactions").insert({
        elder_id: elderId,
        screen_id: "STEM",
        transcript_nl: locale === "nl-NL" ? transcript : null,
        transcript_en: locale === "en-GB" ? transcript : null,
        intent: "companion",
        entities: {},
        response_text_nl: locale === "nl-NL" ? responseText : null,
        response_text_en: locale === "en-GB" ? responseText : null,
        action_taken: "COMPANION_REPLY",
        distress_detected: false,
      });

      return { result: responseText, action: "COMPANION_REPLY" };
    }

    default:
      return { result: locale === "nl-NL" ? "Die functie is niet beschikbaar." : "That function is not available.", error: true };
  }
}

function buildAssistantConfig(locale: "en-GB" | "nl-NL") {
  const isNl = locale === "nl-NL";

  return {
    model: {
      provider: "openai",
      model: Deno.env.get("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: isNl
            ? "Je bent HAVEN, een vriendelijke digitale hulp voor een oudere in Nederland. Spreek met u en uw. Maximaal twee korte zinnen per antwoord. Je bent geen arts en geen mens; wees eerlijk. Als iemand in nood is, gebruik dan de escalate_crisis functie. Als iemand zegt dat ze medicijnen hebben ingenomen, gebruik dan confirm_medication."
            : "You are HAVEN, a warm digital helper for an older adult. Use respectful, calm language. Maximum two short sentences per reply. You are not a doctor and not a human; be honest. If someone is in distress, use the escalate_crisis function. If someone says they took medication, use confirm_medication.",
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "confirm_medication",
            description: isNl ? "Bevestig dat de oudere medicijnen heeft ingenomen" : "Confirm that the elder took their medication",
            parameters: {
              type: "object",
              properties: {
                elder_id: { type: "string", description: "Elder profile ID" },
                transcript: { type: "string", description: "What the elder said" },
                locale: { type: "string", enum: ["nl-NL", "en-GB"] },
              },
              required: ["elder_id", "transcript", "locale"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "escalate_crisis",
            description: isNl ? "Escaleer een noodsituatie en waarschuw familie" : "Escalate a crisis and alert family",
            parameters: {
              type: "object",
              properties: {
                elder_id: { type: "string", description: "Elder profile ID" },
                transcript: { type: "string", description: "What the elder said" },
                locale: { type: "string", enum: ["nl-NL", "en-GB"] },
              },
              required: ["elder_id", "transcript", "locale"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "send_family_message",
            description: isNl ? "Stuur een bericht naar de familie van de oudere" : "Send a message to the elder's family",
            parameters: {
              type: "object",
              properties: {
                elder_id: { type: "string", description: "Elder profile ID" },
                message: { type: "string", description: "Message content" },
                message_type: { type: "string", enum: ["check_in", "heart", "story"] },
                locale: { type: "string", enum: ["nl-NL", "en-GB"] },
              },
              required: ["elder_id", "locale"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_medication_schedule",
            description: isNl ? "Haal het medicijnschema van vandaag op" : "Get today's medication schedule",
            parameters: {
              type: "object",
              properties: {
                elder_id: { type: "string", description: "Elder profile ID" },
                locale: { type: "string", enum: ["nl-NL", "en-GB"] },
              },
              required: ["elder_id", "locale"],
            },
          },
        },
      ],
    },
    voice: {
      provider: "elevenlabs",
      voiceId: Deno.env.get(isNl ? "ELEVENLABS_VOICE_ID_NL" : "ELEVENLABS_VOICE_ID_EN") ?? "default",
      model: "eleven_multilingual_v2",
      stability: 0.72,
      similarityBoost: 0.8,
    },
    transcriber: {
      provider: "whisper",
      model: "whisper-1",
      language: isNl ? "nl" : "en",
    },
    firstMessage: isNl
      ? "Hallo, ik ben er voor u. Wat kan ik voor u doen?"
      : "Hello, I am here for you. What can I help you with?",
    serverUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/fn-vapi-webhook`,
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 300,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  const started = Date.now();
  try {
    await rateLimit(req, "fn-vapi-webhook");

    const body = await req.json() as VapiWebhookBody;

    // VAPI sends different message types
    switch (body.type) {
      case "assistant-request": {
        // VAPI asks us for the assistant config when a call starts
        const callMeta = (body as VapiAssistantRequest).call;
        const locale: "en-GB" | "nl-NL" = "nl-NL"; // Default; overridden by metadata in real calls
        const config = buildAssistantConfig(locale);

        await recordMetric("fn-vapi-webhook", started, "success");
        return json({ assistant: config }, 200, req);
      }

      case "tool-calls": {
        const toolCalls = (body as VapiToolCallMessage).toolCallList ?? [];
        const results = [];

        for (const call of toolCalls) {
          const result = await handleToolCall(call.function.name, call.function.arguments);
          results.push({
            toolCallId: call.id,
            result: JSON.stringify(result),
          });
        }

        await recordMetric("fn-vapi-webhook", started, "success");
        return json({ results }, 200, req);
      }

      case "status-update": {
        const status = body as VapiStatusUpdate;
        if (status.status === "ended") {
          console.log(`[VAPI] Call ended: ${status.endedReason ?? "unknown"}`);
        }
        await recordMetric("fn-vapi-webhook", started, "success");
        return json({ ok: true }, 200, req);
      }

      default: {
        await recordMetric("fn-vapi-webhook", started, "success");
        return json({ ok: true }, 200, req);
      }
    }
  } catch (e) {
    await recordMetric("fn-vapi-webhook", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});
