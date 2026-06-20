import { admin, sha256 } from './core.ts';

// P0-11 FIX: Atomic idempotency via INSERT ... ON CONFLICT DO NOTHING
// Uses .onConflict('key_hash').ignore() so that duplicate inserts return
// { data: null, error: null } instead of throwing a 409 Conflict error.
// Requires UNIQUE constraint on key_hash (migration 20260614000001).

export async function withIdempotency<T>(params: {
  key?: string | null;
  functionName: string;
  elderId?: string;
  profileId?: string;
  requestBody: unknown;
  run: () => Promise<{ status?: number; body: T }>;
}) {
  if (!params.key) return params.run();

  const db = admin();
  const keyHash = await sha256(`${params.functionName}:${params.key}`);
  const requestHash = await sha256(JSON.stringify(params.requestBody));
  const t0 = new Date().toISOString();

  // P0-11 FIX: Atomic test-and-set with .onConflict().ignore()
  const { data: inserted, error: insertError } = await db
    .from('idempotency_keys')
    .insert({
      key_hash: keyHash,
      function_name: params.functionName,
      elder_id: params.elderId ?? null,
      profile_id: params.profileId ?? null,
      request_hash: requestHash,
      status: 'claimed',
      claimed_at: t0,
    })
    .onConflict('key_hash')
    .ignore()
    .select('*')
    .maybeSingle();

  // .onConflict().ignore() returns { data: insertedRow, error: null } on success
  // and { data: null, error: null } on conflict (no error thrown).
  if (insertError) throw insertError;

  if (inserted) {
    // We won the race. Execute the handler.
    try {
      const result = await params.run();
      await db.from('idempotency_keys')
        .update({
          response_body: result.body as unknown as Record<string, unknown>,
          status_code: result.status ?? 200,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('key_hash', keyHash);
      return result;
    } catch (runError) {
      await db.from('idempotency_keys')
        .update({
          status: 'errored',
          error_message: String((runError as Error).message ?? runError).slice(0, 480),
          completed_at: new Date().toISOString(),
        })
        .eq('key_hash', keyHash);
      throw runError;
    }
  }

  // Key already exists — read its current state
  const { data: existing } = await db
    .from('idempotency_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (!existing) {
    throw new Error('Idempotency key state is inconsistent; please retry');
  }

  // Already completed → return stored response
  if (existing.status === 'completed' && existing.completed_at) {
    return { status: existing.status_code ?? 200, body: existing.response_body as T };
  }

  // Previously errored → allow retry with new key
  if (existing.status === 'errored') {
    throw new Error(`Previous attempt failed: ${existing.error_message ?? 'unknown'}. Retry with a new key.`);
  }

  // Claimed but not completed — check if stale (>30s)
  if (existing.status === 'claimed') {
    const ageMs = Date.now() - new Date(existing.claimed_at ?? t0).getTime();
    if (ageMs > 30_000) {
      // Stale claim: take it over
      await db.from('idempotency_keys')
        .update({ status: 'claimed', claimed_at: new Date().toISOString(), request_hash: requestHash })
        .eq('key_hash', keyHash);
      const result = await params.run();
      await db.from('idempotency_keys')
        .update({ response_body: result.body as unknown as Record<string, unknown>, status_code: result.status ?? 200, status: 'completed', completed_at: new Date().toISOString() })
        .eq('key_hash', keyHash);
      return result;
    }
    // In-flight: wait briefly, then recheck
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { data: recheck } = await db.from('idempotency_keys')
      .select('*').eq('key_hash', keyHash).maybeSingle();
    if (recheck?.status === 'completed' && recheck.completed_at) {
      return { status: recheck.status_code ?? 200, body: recheck.response_body as T };
    }
    throw new Error('A request with this key is still in progress. Please wait.');
  }

  if (existing.request_hash !== requestHash) {
    throw new Error('Idempotency key was reused with a different request body');
  }

  throw new Error('Unexpected idempotency key state');
}
