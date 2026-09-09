import { db } from '@/lib/db';

const READY_MAX_AGE_HOURS = 72;

export function themeSlug(name: string, category: string): string {
  return `${category}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}`;
}

export async function getReadyTasks(limit = 40) {
  const cutoff = new Date(Date.now() - READY_MAX_AGE_HOURS * 3600_000);

  const tasks = await db.task.findMany({
    where: {
      status: 'PENDING',
      createdAt: { gte: cutoff },
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
      timeToFirstDollar: t.timeToFirstDollar,
      difficulty: t.difficulty,
      riskLevel: t.riskLevel,
      ageHours,
      scrapedAt: scrapedAt.toISOString(),
      trendUpdatedAt: t.trend.updatedAt.toISOString(),
      stale: ageHours > 48,
    };
  });
}
