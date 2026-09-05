import { redis } from '@/lib/core/redis';
import { prisma } from '@/lib/core/db';
import { JobStage } from '@prisma/client';

export const QUEUE_KEYS = {
  p0: 'swarm:queue:p0', // High priority (e.g. user-requested / fast-track)
  p1: 'swarm:queue:p1', // Normal priority (standard catalog scan)
  p2: 'swarm:queue:p2', // Low priority / backfill
};

// In-process memory queue fallback when Redis is offline
const inMemoryQueues: Record<string, string[]> = {
  p0: [],
  p1: [],
  p2: [],
};

export async function enqueueJob(jobId: string, priorityTier: number = 1): Promise<void> {
  const queueKey = priorityTier === 0 ? QUEUE_KEYS.p0 : priorityTier === 2 ? QUEUE_KEYS.p2 : QUEUE_KEYS.p1;
  const tierName = priorityTier === 0 ? 'p0' : priorityTier === 2 ? 'p2' : 'p1';

  try {
    await redis.rpush(queueKey, jobId);
  } catch {
    inMemoryQueues[tierName].push(jobId);
  }
}

/**
 * Pops the next available job checking priority p0 -> p1 -> p2 in strict order.
 */
export async function popJob(timeoutSecs: number = 2): Promise<{ jobId: string; tier: string } | null> {
  try {
    const result = await redis.blpop(QUEUE_KEYS.p0, QUEUE_KEYS.p1, QUEUE_KEYS.p2, timeoutSecs);
    if (result && result.length === 2) {
      const [queueKey, jobId] = result;
      const tier = queueKey.endsWith('p0') ? 'p0' : queueKey.endsWith('p2') ? 'p2' : 'p1';
      return { jobId, tier };
    }
  } catch {
    // Check in-memory fallback
    for (const tier of ['p0', 'p1', 'p2'] as const) {
      if (inMemoryQueues[tier].length > 0) {
        const jobId = inMemoryQueues[tier].shift()!;
        return { jobId, tier };
      }
    }
  }
  return null;
}

export async function moveToDeadLetter(jobId: string, reason: string): Promise<void> {
  await prisma.assetJob.update({
    where: { id: jobId },
    data: {
      stage: JobStage.DEAD_LETTER,
      errorMessage: reason,
    },
  });
}
