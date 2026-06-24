// In-memory fixed-window rate limiter. Per server instance (not durable across
// serverless instances), but bounds abuse / paid-API cost from a single instance.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Returns true if the action is allowed, false if the window limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
