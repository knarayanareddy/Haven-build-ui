import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { alertLevelFromScore, scoreScamText } from "../../../packages/scam-engine/src/catalog.mjs";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function admin() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function userClient(req: Request) {
  const url = requireEnv("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const authorization = req.headers.get("authorization");
  if (!key) throw new Error("SUPABASE_ANON_KEY is not configured");
  if (!authorization) throw new Error("Missing bearer token");
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
}

export function publicClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!key) throw new Error("SUPABASE_ANON_KEY is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function requireFields<T extends Record<string, unknown>>(body: T, fields: string[]) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length) throw new Error(`Missing required field(s): ${missing.join(", ")}`);
}

export function scoreScam(raw: string) {
  const result = scoreScamText(raw);
  const threatTypes = result.hits.length ? result.hits.map((hit) => {
    if (hit.id.startsWith('NL_BANK')) return 'bankhelpdeskfraude';
    if (hit.id.startsWith('NL_PAYMENT') || hit.id.startsWith('NL_REMOTE')) return 'phishing';
    return 'andere';
  }) : ['andere'];
  return {
    score: result.score,
    alert_level: alertLevelFromScore(result.score),
    threat_types: [...new Set(threatTypes)],
    layer_scores: {
      reputation: Math.min(100, Math.round(result.score * 0.55)),
      pattern: Math.min(100, Math.round(result.score * 0.95)),
      nlp_intent: Math.min(100, Math.round(result.score * 0.75)),
      longitudinal: Math.min(100, Math.round(result.score * 0.35)),
    },
  };
}

export async function recordMetric(fn_name: string, started: number, status: "success" | "error" | "fallback") {
  try {
    await admin().from("perf_metrics").insert({ fn_name, duration_ms: Date.now() - started, status, env: Deno.env.get("HAVEN_ENV") ?? "production" });
  } catch (_) {
    console.log(JSON.stringify({ fn_name, status, duration_ms: Date.now() - started, metric: "local-log" }));
  }
}

export async function dispatchNotification(params: {
  recipient_id: string;
  elder_id?: string;
  notification_type: string;
  title_nl: string;
  title_en?: string;
  body_nl: string;
  body_en?: string;
  data?: Record<string, string>;
}) {
  const db = admin();
  const { data: note, error } = await db.from("notifications").insert(params).select().single();
  if (error) throw error;
  const { data: tokens } = await db.from("push_tokens").select("token").eq("profile_id", params.recipient_id).eq("is_active", true);
  if (tokens?.length) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tokens.map((t) => ({ to: t.token, title: params.title_nl, body: params.body_nl, data: params.data ?? {}, sound: "default" }))),
    });
    await db.from("notifications").update({ sent_at: new Date().toISOString() }).eq("id", note.id);
  }
  return note;
}
