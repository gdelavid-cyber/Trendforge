import { prisma } from '@/lib/core/db';

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
    isFeaturedWeekly?: boolean;
  };
} = {
  reddit_scraper: {
    name: 'Reddit Problem Scraper & Guide Generator',
    description: 'Scrapes trending subreddits, extracts recurring pain points using LLM, and compiles an actionable monetization PDF guide.',
    category: 'Market Research',
    freeLimit: Number(process.env.AGENT_QUOTA_FREE_REDDIT) || 3,
    proLimit: Number(process.env.AGENT_QUOTA_PRO_REDDIT) || 999,
    costCents: 15,
    estimatedDuration: '45-90 sec',
    timeoutMs: 5 * 60 * 1000,
    isFeaturedWeekly: true, // Featured Free Agent this week
  },
  prediction_arbitrage: {
    name: 'Polymarket Yield & Arbitrage Scanner',
    description: 'Scans prediction markets for pricing inefficiencies, calculates fee-adjusted expected value, and executes simulated trades.',
    category: 'DeFi & Trading',
    freeLimit: Number(process.env.AGENT_QUOTA_FREE_ARBITRAGE) || 3,
    proLimit: Number(process.env.AGENT_QUOTA_PRO_ARBITRAGE) || 999,
    costCents: 10,
    estimatedDuration: '30-60 sec',
    timeoutMs: 5 * 60 * 1000,
  },
  openclaw_deployer: {
    name: 'OpenClaw Scraper VPS Deployer',
    description: 'Provisions dedicated headless scraping nodes, anti-bot bypass proxies, and runs automated telemetry health checks.',
    category: 'Infrastructure',
    freeLimit: 3,
    proLimit: 999,
    costCents: 25,
    estimatedDuration: '60-120 sec',
    timeoutMs: 10 * 60 * 1000,
  },
  ai_video_maker: {
    name: 'AI Viral Video & Script Generator',
    description: 'Synthesizes high-retention short-form video scripts, ElevenLabs neural voiceovers, kinetic captions, and 9:16 vertical video assets.',
    category: 'Content Creation',
    freeLimit: 3,
    proLimit: 999,
    costCents: 20,
    estimatedDuration: '45-90 sec',
    timeoutMs: 5 * 60 * 1000,
  },
  micro_saas_builder: {
    name: 'Full-Stack Micro-SaaS App Scaffolder',
    description: 'Transforms a software problem description into a full-stack Next.js App Router codebase with Stripe billing and GitHub deployment.',
    category: 'Software Engineering',
    freeLimit: 3,
    proLimit: 999,
    costCents: 35,
    estimatedDuration: '90-180 sec',
    timeoutMs: 10 * 60 * 1000,
  },
};

/**
 * Checks and resets weekly quota for a user if a new week has started
 */
export async function getUserQuota(userId: string, agentType: string, userRole: string = 'FREE') {
  const config = AGENT_CONFIGS[agentType];
  if (!config) throw new Error(`Unknown agent type: ${agentType}`);

  const isPro = userRole === 'PRO' || userRole === 'ELITE' || userRole === 'ADMIN' || userRole === 'ENTERPRISE';
  
  // Check user bonus runs and success fee opt-in benefits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bonusAgentRuns: true, successFeeOptIn: true },
  });

  const bonusRuns = (user?.bonusAgentRuns || 0) + (user?.successFeeOptIn ? 2 : 0);
  const baseLimit = isPro ? config.proLimit : (config.freeLimit + (config.isFeaturedWeekly ? 1 : 0));
  const maxLimit = baseLimit + bonusRuns;

  const now = new Date();
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

  const remaining = Math.max(0, maxLimit - quotaRecord.runsUsed);
  const hasQuota = isPro || remaining > 0;

  return {
    runsUsed: quotaRecord.runsUsed,
    runsLimit: maxLimit,
    remaining,
    hasQuota,
    isPro,
    isFeaturedWeekly: !!config.isFeaturedWeekly,
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
      runsLimit: 3,
      weekStart: new Date(),
    },
  });
}
