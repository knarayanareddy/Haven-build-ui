// ─── P1-1 FIX: Timing-safe HMAC comparison ───
export async function verifyHmacSha256(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const provided = signature.replace(/^sha256=/, '');
  // Constant-time comparison
  if (expected.length !== provided.length) {
    // Still do work to avoid length disclosure
    let dummy = 0;
    const maxLen = Math.max(expected.length, provided.length);
    for (let i = 0; i < maxLen; i++) dummy |= expected.charCodeAt(i % expected.length) ^ provided.charCodeAt(i % provided.length);
    void dummy;
    return false;
  }
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return result === 0;
}
