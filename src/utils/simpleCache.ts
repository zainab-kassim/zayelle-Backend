// generic in-memory TTL cache, same idea as getCachedRates.ts — cheap to
// explain, avoids a Redis dependency for data that's fine being a few
// minutes stale
const store = new Map<string, { data: unknown; expiresAt: number }>();

export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = store.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const data = await fetcher();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
