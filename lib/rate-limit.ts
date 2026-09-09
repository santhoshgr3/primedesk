import type { NextRequest } from "next/server";

/**
 * Fixed-window rate limiter. In-memory by default (per server instance);
 * swap the store for Redis in production via REDIS_URL.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
}

export function clientKey(req: NextRequest, scope: string) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = store.get(key);

  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfter: 0 };
  }
  b.count++;
  if (b.count > opts.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: opts.limit - b.count, retryAfter: 0 };
}

/** Guard helper for route handlers. Returns a 429 Response or null. */
export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  opts: { limit: number; windowMs: number },
): Response | null {
  const { ok, retryAfter } = rateLimit(clientKey(req, scope), opts);
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
