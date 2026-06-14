// ─── P0-4 FIX: Simple in-memory rate limiter ───
// For production, replace with Supabase-backed or Redis-backed rate limiting.
// This provides basic protection against brute-force and DoS attacks.

const WINDOW_MS = 60_000; // 1 minute window
const PER_WINDOW = 30;    // max 30 requests per window per caller

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 300_000);

export function rateLimit(req: Request, fnName: string): void {
  // Determine caller identity: JWT subject preferred, fallback to IP
  const auth = req.headers.get("authorization") ?? "";
  const jwtHint = auth.replace(/^Bearer\s+/i, "").slice(-20); // last 20 chars of JWT
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const callerId = jwtHint || ip;
  const key = `${fnName}:${callerId}`;

  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count++;
  if (entry.count > PER_WINDOW) {
    throw new Error("Rate limit exceeded. Please wait before retrying.");
  }
}
