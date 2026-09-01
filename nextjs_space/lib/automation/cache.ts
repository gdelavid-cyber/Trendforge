// In-memory + Redis cache for agent results (TTL 1 hour)
const memoryCache = new Map<string, { data: any; expiry: number }>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCachedAgentResult(cacheKey: string): any | null {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

export function setCachedAgentResult(cacheKey: string, data: any, ttlMs: number = DEFAULT_TTL_MS): void {
  memoryCache.set(cacheKey, {
    data,
    expiry: Date.now() + ttlMs,
  });
}
