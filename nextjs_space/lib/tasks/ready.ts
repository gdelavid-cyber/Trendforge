import { db } from '@/lib/db';
import { harvestLiveSignalsAndTasks } from '@/lib/pipeline/live-scrapling';

const READY_MAX_AGE_HOURS = 72;

export function themeSlug(name: string, category: string): string {
  return `${category}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}`;
}

export async function getReadyTasks(limit = 40) {
  const cutoff = new Date(Date.now() - READY_MAX_AGE_HOURS * 3600_000);

  let tasks = await db.task.findMany({
    where: {
      status: 'PENDING',
      createdAt: { gte: cutoff },
      NOT: { title: { startsWith: 'Proof test task' } },
      trend: {
        updatedAt: { gte: cutoff },
        status: { notIn: ['EXPIRED'] },
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
    orderBy: { createdAt: 'desc' },
    take: limit,
    distinct: ['title'],
  });

  // Self-heal: If fewer than requested ready tasks exist in the active 72h window,
  // trigger live-scrapling harvest and spawn tasks for freshest active trends.
  if (tasks.length < limit) {
    try {
      await harvestLiveSignalsAndTasks();
    } catch {}

    const existingTrendIds = new Set(tasks.map((t) => t.trendId));
    const freshTrends = await db.trend.findMany({
      where: {
        id: { notIn: Array.from(existingTrendIds) },
        updatedAt: { gte: cutoff },
        status: 'ACTIVE',
        isMonetizable: true,
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
      } catch (err) {
        // Unique title or collision; continue
      }
    }
  }

  const now = Date.now();
  return tasks.map((t) => {
    const ageHours = Number(((now - new Date(t.createdAt).getTime()) / 3600_000).toFixed(1));
    const scrapedAt = t.trend.signals[0]?.createdAt ?? t.trend.createdAt;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.trend.category,
      trendId: t.trend.id,
      trendName: t.trend.name,
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
      trendUpdatedAt: t.trend.updatedAt.toISOString(),
      stale: ageHours > 48,
    };
  });
}
