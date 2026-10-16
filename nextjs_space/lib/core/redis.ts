const globalForRedis = globalThis as unknown as { redis: any | undefined };

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function createSafeRedis() {
  if (typeof window !== 'undefined') {
    return {} as any;
  }
  try {
    const Redis = require('ioredis');
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    client.on('error', () => {});
    return client;
  } catch {
    return {} as any;
  }
}

export const redis = globalForRedis.redis || createSafeRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export function createRedisClient() {
  return createSafeRedis();
}
