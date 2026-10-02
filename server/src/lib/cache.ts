/**
 * Tiny in-memory TTL cache with in-flight de-duplication: concurrent requests for
 * the same key share one upstream call, which keeps us well inside free-tier limits.
 * Failed calls are not cached.
 */
interface Entry {
  expires: number;
  value: Promise<unknown>;
}

const MAX_ENTRIES = 1000;
const store = new Map<string, Entry>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    // refresh LRU position
    store.delete(key);
    store.set(key, hit);
    return hit.value as Promise<T>;
  }
  const value = fn();
  store.set(key, { expires: now + ttlMs, value });
  value.catch(() => {
    if (store.get(key)?.value === value) store.delete(key);
  });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
  return value;
}

export const cacheStats = () => ({ entries: store.size, max: MAX_ENTRIES });
