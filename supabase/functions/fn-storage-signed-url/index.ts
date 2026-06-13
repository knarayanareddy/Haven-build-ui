import { cors, json, recordMetric, userClient } from "../_shared/core.ts";
import { assertElderOrFamilyCan, getJwtUserId } from "../_shared/authz.ts";
import { validateBody } from "../_shared/validation.ts";

const allowedBuckets = new Set(["voice-notes", "life-story-audio", "life-story-photos", "profile-photos", "document-vault", "ocr-inbox"]);

function firstPathSegment(path: string) {
  return path.split('/').filter(Boolean)[0] ?? '';
}

async function assertPathAccess(userId: string, bucket: string, path: string, operation: string) {
  const ownerId = firstPathSegment(path);
  if (!ownerId) throw new Error('Storage path must include an owner folder');
  if (ownerId === userId) return ownerId;
  if (operation === 'upload') throw new Error('Uploads are only allowed to the caller-owned folder');
  if (bucket === 'voice-notes') {
    await assertElderOrFamilyCan(userId, ownerId, 'messages');
    return ownerId;
  }
  if (bucket === 'life-story-audio' || bucket === 'life-story-photos') {
    await assertElderOrFamilyCan(userId, ownerId, 'stories');
    return ownerId;
  }
  throw new Error('Caller is not allowed to sign this storage path');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const started = Date.now();
  try {
    const body = await req.json();
    validateBody(body, { bucket: 'string', path: 'string', operation: 'string' }, { allowUnknown: true });
    if (!allowedBuckets.has(String(body.bucket))) throw new Error("Bucket is not allowed");
    const operation = String(body.operation);
    if (!["read", "upload"].includes(operation)) throw new Error('operation must be read or upload');
    const userId = await getJwtUserId(req);
    await assertPathAccess(userId, String(body.bucket), String(body.path), operation);
    const ttl = Math.min(Number(body.ttl_seconds ?? 300), 900);
    const storage = userClient(req).storage.from(String(body.bucket));
    if (operation === "upload") {
      const { data, error } = await storage.createSignedUploadUrl(String(body.path));
      if (error) throw error;
      await recordMetric("fn-storage-signed-url", started, "success");
      return json({ success: true, ...data });
    }
    const { data, error } = await storage.createSignedUrl(String(body.path), ttl);
    if (error) throw error;
    await recordMetric("fn-storage-signed-url", started, "success");
    return json({ success: true, signed_url: data.signedUrl, expires_in: ttl });
  } catch (e) {
    await recordMetric("fn-storage-signed-url", started, "error");
    return json({ error: String((e as Error).message ?? e) }, 400);
  }
});
