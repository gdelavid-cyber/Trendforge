import { redis } from '@/lib/core/redis';

// In-memory + Redis cache for agent results (TTL 1 hour)
const memoryCache = new Map<string, { data: any; expiry: number }>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const REDIS_PREFIX = 'trendly:agent_cache:';

export function getCachedAgentResult(cacheKey: string): any | null {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

export async function getCachedAgentResultAsync(cacheKey: string): Promise<any | null> {
  const local = getCachedAgentResult(cacheKey);
  if (local !== null) return local;
  try {
    const raw = await redis.get(`${REDIS_PREFIX}${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(cacheKey, { data: parsed, expiry: Date.now() + DEFAULT_TTL_MS });
      return parsed;
    }
  } catch {
    // Redis offline in local/serverless fallback — rely on memoryCache
  }
  return null;
}

export function setCachedAgentResult(cacheKey: string, data: any, ttlMs: number = DEFAULT_TTL_MS): void {
  memoryCache.set(cacheKey, {
    data,
    expiry: Date.now() + ttlMs,
  });
  void redis
    .set(`${REDIS_PREFIX}${cacheKey}`, JSON.stringify(data), 'PX', ttlMs)
    .catch(() => {});
}
