import { admin, corsHeaders, dispatchNotification, json, readJsonBody, safeErrorMessage, sha256, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody, assertMaxLength, MAX_STRING_FIELD } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { rateLimit } from "../_shared/ratelimit.ts";
import { scoreScam } from "../_shared/core.ts";
import { asyncWrapper } from "../_shared/async_wrapper.ts";

const RED_FLAGS_NL = [
  "Haast of druk om snel te handelen.",
  "Vraagt om codes, wachtwoorden of pin.",
  "Vraagt om geld over te maken naar een onbekende rekening.",
  "Bedreigt met gevolgen als u niet meewerkt.",
  "Zegt dat u het tegen niemand mag vertellen.",
];

const RED_FLAGS_EN = [
  "Pressure to act quickly.",
  "Asks for codes, passwords or PIN.",
  "Asks to transfer money to an unknown account.",
  "Threatens consequences if you do not cooperate.",
  "Says you must not tell anyone.",
];

const SAFE_SCRIPT_NL = "Ik ga hier niet op in. Ik bel mijn familie eerst en zij helpen mij verder. Dag.";
const SAFE_SCRIPT_EN = "I am not going along with this. I will call my family first and they will help me. Goodbye.";

const RECOVERY_CHECKLIST_NL = [
  "Hang direct op als u nog aan de lijn bent.",
  "Bel uw familie en vertel wat er is gebeurd.",
  "Bel uw bank als u iets heeft gedeeld (pin, code, geld).",
  "Noteer het nummer en de tijd voor de politie of Fraudehelpdesk.",
  "Wijzig wachtwoorden als u die heeft gedeeld.",
];

const RECOVERY_CHECKLIST_EN = [
  "Hang up immediately if still on the line.",
  "Call your family and tell them what happened.",
  "Call your bank if you shared any PIN, code or money.",
  "Note the number and time for police or the Fraudehelpdesk.",
  "Change passwords if you shared any.",
];

function classify(text: string): { score: number; intent: string } {
  const lower = text.toLowerCase();
  let score = 0;
  let intent = "general";
  if (/(bank|pin|pas|code|wachtwoord|password|transfer|overmaken|urgent|meteen|nu direct|geheim|vertel niemand|do not tell|anydesk|teamviewer|gift card|cadeaukaart|crypto|bitcoin)/.test(lower)) score += 35;
  if (/(bankhelpdesk|helpdesk|politie|belasting|overheid|amazon|microsoft|apple|google)/.test(lower)) intent = "impersonation";
  if (/(vriend|family|kind|kleinkind|grandson|granddaughter|hulp|babysit|emergency)/.test(lower) && /(geld|money|betaal|overmaken|transfer|send)/.test(lower)) intent = "friend_in_need";
  if (/(crypto|bitcoin|investering|opbrengst|rendement|winst|guaranteed|garandeerd)/.test(lower)) intent = "investment";
  return { score: Math.min(100, score), intent };
}

Deno.serve(asyncWrapper("fn-scam-coaching", async (req: Request) => {
  await rateLimit(req, "fn-scam-coaching");
  const body = await readJsonBody(req) as Record<string, unknown>;
  validateBody(body, { elder_id: "uuid", channel: "string", elder_prompt: "string" }, { allowUnknown: true });
  
  assertMaxLength(String(body.elder_prompt ?? ""), MAX_STRING_FIELD, 'elder_prompt');
  const userId = await getJwtUserId(req);
  assertSelf(userId, String(body.elder_id), "elder");

  const prompt = String(body.elder_prompt ?? "").slice(0, 800);
  const promptHash = await sha256(prompt);
  const idem = (req.headers.get("idempotency-key") ?? body.idempotency_key ?? promptHash) as string | undefined;
  const locale: "nl-NL" | "en-GB" = body.locale === "en-GB" ? "en-GB" : "nl-NL";
  const redFlags = locale === "nl-NL" ? RED_FLAGS_NL : RED_FLAGS_EN;
  const safeScript = locale === "nl-NL" ? SAFE_SCRIPT_NL : SAFE_SCRIPT_EN;
  const recovery = locale === "nl-NL" ? RECOVERY_CHECKLIST_NL : RECOVERY_CHECKLIST_EN;
  const scamEngine = scoreScam(prompt);
  const intent = classify(prompt);

  const result = await withIdempotency({
    key: idem,
    functionName: "fn-scam-coaching",
    elderId: String(body.elder_id),
    profileId: userId,
    requestBody: body,
    run: async () => {
      const db = userClient(req);
      const summary = locale === "nl-NL"
        ? `Ik denk dat dit voorzichtig behandeld moet worden. Risicoscore ${scamEngine.score}, patroon: ${intent.intent}.`
        : `I think this needs to be handled carefully. Risk score ${scamEngine.score}, pattern: ${intent.intent}.`;
      const recommended_actions = {
        red_flags: redFlags,
        safe_script: safeScript,
        recovery_checklist: recovery,
        next_step: locale === "nl-NL"
          ? "Bel uw familie en wacht op hulp voordat u iets doet."
          : "Call your family and wait for help before doing anything.",
        scam_engine: scamEngine,
        pattern: intent.intent,
      };

      const { data: session, error } = await db.from("scam_coaching_sessions").insert({
        elder_id: body.elder_id,
        channel: body.channel ? String(body.channel) : null,
        elder_prompt_hash: promptHash,
        assistant_summary_nl: locale === "nl-NL" ? summary : (scamEngine.threat_types?.length ? summary : ""),
        assistant_summary_en: locale === "en-GB" ? summary : null,
        recommended_actions,
      }).select().single();
      if (error) throw error;

      let familyNotified = false;
      if (scamEngine.score >= 40) {
        const dbAdmin = admin();
        const { data: family } = await dbAdmin.from("family_relationships")
          .select("family_member_id").eq("elder_id", body.elder_id).eq("elder_consented", true).eq("is_active", true).eq("notify_on_crisis", true);
        for (const f of family ?? []) {
          await dispatchNotification({
            recipient_id: String(f.family_member_id),
            elder_id: String(body.elder_id),
            notification_type: scamEngine.score >= 70 ? "scam_rood" : "scam_amber",
            title_nl: "Heeft u hier even tijd voor?",
            title_en: "Do you have a moment for this?",
            body_nl: "Er is een coaching-gesprek geweest over een mogelijk verdacht contact. Bel rustig even.",
            body_en: "A coaching conversation was held about a possibly suspicious contact. Please call calmly.",
            data: { scam_coaching_session_id: session.id, score: scamEngine.score, intent: intent.intent },
          });
        }
        familyNotified = true;
        await db.from("scam_coaching_sessions").update({ family_notified_at: new Date().toISOString() }).eq("id", session.id);
      }

      return { body: { scam_coaching_session_id: session.id, summary, recommended_actions, family_notified: familyNotified, scam_engine: scamEngine, pattern: intent.intent } };
    },
  });

  return json(result.body, result.status ?? 200, req);
}));