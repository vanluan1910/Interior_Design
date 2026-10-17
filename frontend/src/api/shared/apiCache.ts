/**
 * In-memory API request deduplication and short-term TTL caching for master data
 * Prevents redundant HTTP requests and eliminates waterfall/parallel duplicate calls
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inflightPromises = new Map<string, Promise<any>>();

export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlMs = 30000 // 30 seconds default TTL for master data
): Promise<T> {
  // 1. Check valid memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  // 2. Check if the exact same request is already in-flight
  if (inflightPromises.has(cacheKey)) {
    return inflightPromises.get(cacheKey) as Promise<T>;
  }

  // 3. Execute fetch and broadcast to all concurrent callers
  const promise = (async () => {
    try {
      const data = await fetchFn();
      if (data !== undefined && data !== null) {
        memoryCache.set(cacheKey, {
          data,
          expiry: Date.now() + ttlMs,
        });
      }
      return data;
    } finally {
      inflightPromises.delete(cacheKey);
    }
  })();

  inflightPromises.set(cacheKey, promise);
  return promise;
}

export function invalidateApiCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }
}
