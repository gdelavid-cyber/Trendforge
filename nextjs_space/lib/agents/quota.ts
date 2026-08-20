import { prisma } from '@/lib/db';

export const AGENT_CONFIGS: {
  [key: string]: {
    name: string;
    description: string;
    category: string;
    freeLimit: number;
    proLimit: number;
    costCents: number;
    estimatedDuration: string;
    timeoutMs: number;
  };
} = {
  reddit_scraper: {
    name: 'Reddit Problem Scraper & Guide Generator',
    description: 'Scrapes trending subreddits, extracts recurring pain points using LLM, and compiles an actionable monetization PDF guide.',
    category: 'Market Research',
    freeLimit: Number(process.env.AGENT_QUOTA_FREE_REDDIT) || 1,
    proLimit: Number(process.env.AGENT_QUOTA_PRO_REDDIT) || 999,
    costCents: 15,
    estimatedDuration: '45-90 sec',
    timeoutMs: 5 * 60 * 1000, // 5 min timeout
  },
  prediction_arbitrage: {
    name: 'Polymarket Yield & Arbitrage Scanner',
    description: 'Scans prediction markets for pricing inefficiencies, calculates fee-adjusted expected value, and executes simulated trades.',
    category: 'DeFi & Trading',
    freeLimit: Number(process.env.AGENT_QUOTA_FREE_ARBITRAGE) || 1,
    proLimit: Number(process.env.AGENT_QUOTA_PRO_ARBITRAGE) || 999,
    costCents: 10,
    estimatedDuration: '30-60 sec',
    timeoutMs: 5 * 60 * 1000, // 5 min timeout
  },
};

/**
 * Checks and resets weekly quota for a user if a new week has started
 */
export async function getUserQuota(userId: string, agentType: string, userRole: string = 'FREE') {
  const config = AGENT_CONFIGS[agentType];
  if (!config) throw new Error(`Unknown agent type: ${agentType}`);

  const isPro = userRole === 'PRO' || userRole === 'ELITE' || userRole === 'ADMIN';
  const maxLimit = isPro ? config.proLimit : config.freeLimit;

  const now = new Date();
  // Get start of current week (Monday 00:00 UTC)
  const currentWeekStart = new Date(now);
  const day = currentWeekStart.getUTCDay();
  const diff = currentWeekStart.getUTCDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart.setUTCDate(diff);
  currentWeekStart.setUTCHours(0, 0, 0, 0);

  let quotaRecord = await prisma.agentQuota.findUnique({
    where: {
      userId_agentType: { userId, agentType },
    },
  });

  if (!quotaRecord) {
    quotaRecord = await prisma.agentQuota.create({
      data: {
        userId,
        agentType,
        runsUsed: 0,
        runsLimit: maxLimit,
        weekStart: currentWeekStart,
      },
    });
  } else if (new Date(quotaRecord.weekStart) < currentWeekStart) {
    // Reset weekly runs
    quotaRecord = await prisma.agentQuota.update({
      where: {
        userId_agentType: { userId, agentType },
      },
      data: {
        runsUsed: 0,
        runsLimit: maxLimit,
        weekStart: currentWeekStart,
      },
    });
  }

  const remaining = Math.max(0, quotaRecord.runsLimit - quotaRecord.runsUsed);
  const hasQuota = isPro || remaining > 0;

  return {
    runsUsed: quotaRecord.runsUsed,
    runsLimit: quotaRecord.runsLimit,
    remaining,
    hasQuota,
    isPro,
    config,
  };
}

/**
 * Increments quota consumption after a successful agent initiation
 */
export async function consumeQuota(userId: string, agentType: string): Promise<void> {
  await prisma.agentQuota.upsert({
    where: {
      userId_agentType: { userId, agentType },
    },
    update: {
      runsUsed: { increment: 1 },
    },
    create: {
      userId,
      agentType,
      runsUsed: 1,
      runsLimit: 1,
      weekStart: new Date(),
    },
  });
}
