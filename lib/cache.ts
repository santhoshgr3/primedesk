/**
 * Tiny in-process TTL cache. Swap the Map for Redis (REDIS_URL) in production.
 * Good enough for dashboard/report snapshots that are expensive to compute and
 * fine to be a minute stale.
 */
type Entry = { value: unknown; expiresAt: number };
const store = new Map<string, Entry>();

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [k, e] of store) if (e.expiresAt < now) store.delete(k);
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  sweep(now);
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const value = await producer();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Drop cached entries whose key starts with `prefix` (call after writes). */
export function invalidate(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
