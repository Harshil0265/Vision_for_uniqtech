/**
 * Small in-memory sliding-window rate limiter keyed by IP or account.
 * Used to throttle sign-in and sign-up attempts. For multi-instance
 * deployments, swap the Map for a shared store (e.g. Redis) behind the same interface.
 */

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  // Periodic cleanup so idle users do not leak memory.
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      if (times.every(t => t <= cutoff)) hits.delete(key);
    }
  }, windowMs).unref();

  function check(key: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter(t => t > now - windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return { allowed: false, retryAfterSec: Math.ceil((recent[0] + windowMs - now) / 1000) };
    }
    recent.push(now);
    hits.set(key, recent);
    return { allowed: true, retryAfterSec: 0 };
  }

  /** Forget a key (e.g. after a successful login). */
  check.reset = (key: string) => { hits.delete(key); };

  return check;
}
