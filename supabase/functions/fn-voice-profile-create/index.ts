import { admin, cors, corsHeaders, json, readJsonBody, recordMetric, safeErrorMessage, userClient } from "../_shared/core.ts";
import { assertSelf, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

interface VoiceProfileProvider {
  createClone(displayName: string, consentEvidencePath: string): Promise<{ provider_voice_id: string }>;
}

class ElevenLabsProvider implements VoiceProfileProvider {
  async createClone(_displayName: string, _consentEvidencePath: string) {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");
    return { provider_voice_id: `elevenlabs-mock-${crypto.randomUUID()}` };
  }
}

class MockProvider implements VoiceProfileProvider {
  async createClone(displayName: string, _consentEvidencePath: string) {
    return { provider_voice_id: `mock-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    const body = await readJsonBody(req) as Record<string, unknown>;
    validateBody(body, { display_name: "string", provider: "string" }, { allowUnknown: true });
    const userId = await getJwtUserId(req);
    if (String(body.provider) !== "elevenlabs" && String(body.provider) !== "mock") throw new Error("provider must be elevenlabs or mock");

    const idem = req.headers.get("idempotency-key") ?? body.idempotency_key;
    const result = await withIdempotency({
      key: idem,
      functionName: "fn-voice-profile-create",
      profileId: userId,
      requestBody: body,
      run: async () => {
        const provider: VoiceProfileProvider = body.provider === "elevenlabs" ? new ElevenLabsProvider() : new MockProvider();
        let providerResult;
        try {
          providerResult = await provider.createClone(String(body.display_name), String(body.consent_evidence_path ?? ""));
        } catch (error) {
          const dbAdmin = admin();
          await dbAdmin.from("voice_profiles").insert({
            owner_profile_id: userId,
            display_name: String(body.display_name),
            provider: String(body.provider),
            status: "failed",
            consent_evidence_path: String(body.consent_evidence_path ?? ""),
          });
          throw error;
        }
        const db = userClient(req);
        const { data: profile, error } = await db.from("voice_profiles").insert({
          owner_profile_id: userId,
          display_name: String(body.display_name),
          provider: String(body.provider),
          provider_voice_id: providerResult.provider_voice_id,
          status: "ready",
          consent_evidence_path: String(body.consent_evidence_path ?? ""),
        }).select().single();
        if (error) throw error;
        return { body: { voice_profile_id: profile.id, provider: profile.provider, provider_voice_id: profile.provider_voice_id, status: profile.status } };
      },
    });

    await recordMetric("fn-voice-profile-create", started, "success");
    return json(result.body, result.status ?? 200, req);
  } catch (e) {
    await recordMetric("fn-voice-profile-create", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});