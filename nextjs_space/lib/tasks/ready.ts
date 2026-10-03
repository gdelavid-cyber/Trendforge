import { db } from '@/lib/db';
import { harvestLiveSignalsAndTasks } from '@/lib/pipeline/live-scrapling';
import { HIGH_PROFIT_OPPORTUNITY_MATRIX } from '@/lib/council/signal-harvester';

const READY_MAX_AGE_HOURS = 72;

export function themeSlug(name: string, category: string): string {
  return `${category}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}`;
}

/**
 * Prisma filter that strictly excludes all Vitest / integration test fixture tasks
 * (e.g. "Exec test task test-...", "Proof test task ...", "Brain priority task ...", "fixture").
 */
export const NON_TEST_TASK_WHERE = {
  AND: [
    { NOT: { title: { startsWith: 'Exec test task', mode: 'insensitive' as const } } },
    { NOT: { title: { startsWith: 'Proof test task', mode: 'insensitive' as const } } },
    { NOT: { title: { startsWith: 'Brain priority task', mode: 'insensitive' as const } } },
    { NOT: { title: { startsWith: 'Platform default task', mode: 'insensitive' as const } } },
    { NOT: { title: { startsWith: 'Test Council Approval', mode: 'insensitive' as const } } },
    { NOT: { title: { startsWith: 'phase2-', mode: 'insensitive' as const } } },
    { NOT: { title: { contains: 'test-', mode: 'insensitive' as const } } },
    { NOT: { title: { contains: 'fixture', mode: 'insensitive' as const } } },
    { NOT: { description: { in: ['state machine fixture', 'fixture', 'd'] } } },
  ],
};

export const NON_TEST_TREND_WHERE = {
  AND: [
    { NOT: { name: { startsWith: 'Trend fixture', mode: 'insensitive' as const } } },
    { NOT: { name: { startsWith: 'Prio fixture', mode: 'insensitive' as const } } },
    { NOT: { name: { startsWith: 'Proof trend', mode: 'insensitive' as const } } },
    { NOT: { name: { startsWith: 'phase2-', mode: 'insensitive' as const } } },
    { NOT: { name: { contains: 'test-', mode: 'insensitive' as const } } },
    { NOT: { name: { contains: 'fixture', mode: 'insensitive' as const } } },
  ],
};

/**
 * Archives any leftover test/fixture tasks in the database older than 60 seconds
 * so they never pollute user-facing dashboards or task feeds.
 */
export async function archiveStaleTestTasks(): Promise<void> {
  try {
    const oneMinAgo = new Date(Date.now() - 60_000);
    await db.task.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: oneMinAgo },
        OR: [
          { title: { startsWith: 'Exec test task', mode: 'insensitive' } },
          { title: { startsWith: 'Proof test task', mode: 'insensitive' } },
          { title: { startsWith: 'Brain priority task', mode: 'insensitive' } },
          { title: { startsWith: 'Platform default task', mode: 'insensitive' } },
          { title: { contains: 'test-', mode: 'insensitive' } },
          { title: { contains: 'fixture', mode: 'insensitive' } },
          { description: { in: ['state machine fixture', 'fixture', 'd'] } },
        ],
      },
      data: {
        status: 'ARCHIVED',
        isFeatured: false,
      },
    });
  } catch {
    // Non-fatal cleanup
  }
}

export async function getReadyTasks(limit = 40) {
  await archiveStaleTestTasks();

  const cutoff = new Date(Date.now() - READY_MAX_AGE_HOURS * 3600_000);

  // Ensure the 6 core high-margin commercial plays from HIGH_PROFIT_OPPORTUNITY_MATRIX exist
  // so Today's Money-Making Tasks always leads with actionable, high-cashflow plays.
  const featuredCount = await db.task.count({
    where: {
      status: 'PENDING',
      isFeatured: true,
      ...NON_TEST_TASK_WHERE,
    },
  });

  if (featuredCount < 6) {
    for (const opp of HIGH_PROFIT_OPPORTUNITY_MATRIX.slice(0, 6)) {
      try {
        const existing = await db.task.findFirst({
          where: { title: opp.title, status: 'PENDING' },
        });
        if (existing) {
          if (!existing.isFeatured) {
            await db.task.update({
              where: { id: existing.id },
              data: { isFeatured: true, trendScore: 96 },
            });
          }
          continue;
        }

        const trend = await db.trend.create({
          data: {
            name: opp.title.slice(0, 120),
            sourcePlatforms: [opp.source],
            mentionVelocity: 92,
            confidence: 0.95,
            category: 'AGENT_ECONOMY',
            status: 'ACTIVE',
            isMonetizable: true,
            monetizationScore: 0.95,
            newsSummary: String(opp.rawInsight || opp.title),
            whyItMatters: String(opp.rawInsight || opp.title),
            detectedAt: new Date(),
          },
        });

        await db.task.create({
          data: {
            trendId: trend.id,
            title: String(opp.title),
            category: 'AGENT_ECONOMY',
            description: String(opp.rawInsight || opp.title),
            difficulty: 'LOW',
            timeToFirstDollar: String(opp.estimatedVelocity || '24-48 hours'),
            estimatedEarningsLow: 500,
            estimatedEarningsHigh: 2400,
            startupCost: 0,
            status: 'PENDING',
            isFeatured: true,
            isVerified: true,
            trendScore: 96,
            steps: [
              'Use Station Signal Dish (scrape_reddit_painpoints / scrape_google_maps_local) to pull active buyers',
              'Deploy turnkey service package or Micro-SaaS starter from Code Workbench',
              'Run Outreach Relay (b2b_lead_extractor + cold_email_sequence_writer) to pitch 15 decision-makers',
              'Collect upfront setup fee + monthly recurring retainer via Stripe checkout',
            ],
          },
        });
      } catch {
        // Ignore duplicate constraint race
      }
    }
  }

  let tasks = await db.task.findMany({
    where: {
      status: 'PENDING',
      createdAt: { gte: cutoff },
      ...NON_TEST_TASK_WHERE,
      trend: {
        updatedAt: { gte: cutoff },
        status: { notIn: ['EXPIRED'] },
        ...NON_TEST_TREND_WHERE,
      },
    },
    include: {
      trend: {
        select: {
          id: true,
          name: true,
          category: true,
          updatedAt: true,
          createdAt: true,
          signals: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          },
        },
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { trendScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    distinct: ['title'],
  });

  // Self-heal: If fewer than requested ready tasks exist in the active 72h window,
  // trigger live-scrapling harvest and spawn tasks for freshest active commercial trends.
  if (tasks.length < Math.min(limit, 6)) {
    try {
      await harvestLiveSignalsAndTasks();
    } catch {}

    const existingTrendIds = new Set(tasks.map((t) => t.trendId).filter(Boolean));
    const freshTrends = await db.trend.findMany({
      where: {
        id: { notIn: Array.from(existingTrendIds) as string[] },
        updatedAt: { gte: cutoff },
        status: 'ACTIVE',
        isMonetizable: true,
        ...NON_TEST_TREND_WHERE,
      },
      include: {
        signals: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit - tasks.length,
    });

    for (const trend of freshTrends) {
      try {
        const spawned = await db.task.create({
          data: {
            trendId: trend.id,
            title: `Monetize ${trend.name}`,
            category: trend.category,
            description:
              trend.whyItMatters ||
              trend.newsSummary ||
              `High-intent monetization blueprint executing ${trend.name}.`,
            difficulty: 'LOW',
            timeToFirstDollar: '24-48 hours',
            estimatedEarningsLow: 450,
            estimatedEarningsHigh: 1850,
            startupCost: 0,
            status: 'PENDING',
            trendScore: 90 + Math.min(10, trend.mentionVelocity),
          },
          include: {
            trend: {
              select: {
                id: true,
                name: true,
                category: true,
                updatedAt: true,
                createdAt: true,
                signals: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: { createdAt: true },
                },
              },
            },
          },
        });
        tasks.push(spawned);
      } catch {
        // Unique title or collision; continue
      }
    }

    // If still fewer than 6 commercial tasks (e.g. fresh DB after purging test fixtures),
    // seed from the vetted HIGH_PROFIT_OPPORTUNITY_MATRIX commercial archetypes.
    if (tasks.length < 6) {
      for (const opp of HIGH_PROFIT_OPPORTUNITY_MATRIX.slice(0, 6 - tasks.length)) {
        try {
          const trend = await db.trend.create({
            data: {
              name: opp.title.slice(0, 120),
              sourcePlatforms: [opp.source],
              mentionVelocity: 88,
              confidence: 0.92,
              category: 'AGENT_ECONOMY',
              status: 'ACTIVE',
              isMonetizable: true,
              monetizationScore: 0.92,
              newsSummary: String(opp.rawInsight || opp.title),
              whyItMatters: String(opp.rawInsight || opp.title),
              detectedAt: new Date(),
            },
          });

          const createdTask = await db.task.create({
            data: {
              trendId: trend.id,
              title: String(opp.title),
              category: 'AGENT_ECONOMY',
              description: String(opp.rawInsight || opp.title),
              difficulty: 'LOW',
              timeToFirstDollar: String(opp.estimatedVelocity || '24-48 hours'),
              estimatedEarningsLow: 450,
              estimatedEarningsHigh: 2200,
              startupCost: 0,
              status: 'PENDING',
              trendScore: 94,
              steps: [
                'Use Station Signal Dish (scrape_reddit_painpoints / scrape_google_maps_local) to pull active buyers',
                'Deploy turnkey service package or Micro-SaaS starter from Code Workbench',
                'Run Outreach Relay (b2b_lead_extractor + cold_email_sequence_writer) to pitch 15 decision-makers',
                'Collect upfront setup fee + monthly recurring retainer via Stripe checkout',
              ],
            },
            include: {
              trend: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  updatedAt: true,
                  createdAt: true,
                  signals: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                  },
                },
              },
            },
          });
          tasks.push(createdTask as any);
        } catch {
          // continue on duplicate
        }
      }
    }
  }

  const now = Date.now();
  return tasks
    .filter((t) => Boolean(t.trend))
    .map((t) => {
      const ageHours = Number(((now - new Date(t.createdAt).getTime()) / 3600_000).toFixed(1));
      const scrapedAt = t.trend!.signals[0]?.createdAt ?? t.trend!.createdAt;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.trend!.category,
        trendId: t.trend!.id,
        trendName: t.trend!.name,
        startupCost: t.startupCost,
        earningsLow: t.estimatedEarningsLow,
        earningsHigh: t.estimatedEarningsHigh,
        estimatedEarningsLow: t.estimatedEarningsLow,
        estimatedEarningsHigh: t.estimatedEarningsHigh,
        timeToFirstDollar: t.timeToFirstDollar,
        difficulty: t.difficulty,
        riskLevel: t.riskLevel,
        trendScore: t.trendScore,
        ageHours,
        scrapedAt: scrapedAt.toISOString(),
        trendUpdatedAt: t.trend!.updatedAt.toISOString(),
        stale: ageHours > 48,
      };
    });
}
