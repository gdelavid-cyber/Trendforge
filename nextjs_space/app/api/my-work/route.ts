import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { db } from '@/lib/db';
import { TrendExecutionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'active'; // active | done | all

  const activeStatuses: TrendExecutionStatus[] = [
    TrendExecutionStatus.QUEUED,
    TrendExecutionStatus.RUNNING,
    TrendExecutionStatus.AWAITING_APPROVAL,
  ];

  const doneStatuses: TrendExecutionStatus[] = [
    TrendExecutionStatus.COMPLETED,
    TrendExecutionStatus.DEGRADED,
    TrendExecutionStatus.FAILED,
  ];

  const statusFilter =
    filter === 'active'
      ? { in: activeStatuses }
      : filter === 'done'
      ? { in: doneStatuses }
      : undefined;

  const [executions, activeCount, unreadCount] = await Promise.all([
    db.trendExecution.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        trend: { select: { id: true, name: true, category: true } },
        stages: {
          select: { stageKey: true, status: true, ordinal: true, completedAt: true },
          orderBy: { ordinal: 'asc' },
        },
      },
      orderBy: [{ pinnedByUser: 'desc' }, { lastActivityAt: 'desc' }],
      take: 50,
    }),
    db.trendExecution.count({
      where: { userId, status: { in: activeStatuses } },
    }),
    db.userActivity.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({
    executions: executions.map((e) => ({
      id: e.id,
      trendId: e.trendId,
      trendName: e.trend?.name ?? 'Market Signal',
      category: e.trend?.category ?? 'GENERAL',
      status: e.status,
      progressPct: e.progressPct,
      currentStage: e.currentStage,
      lastCheckpoint: e.lastCheckpoint,
      lastActivityAt: e.lastActivityAt.toISOString(),
      startedAt: e.startedAt?.toISOString() ?? null,
      completedAt: e.completedAt?.toISOString() ?? null,
      pinned: e.pinnedByUser,
      unread: !e.userViewedAt || e.lastActivityAt > e.userViewedAt,
      stagesDone: e.stages.filter((s: { status: string }) => s.status === 'COMPLETED' || s.status === 'FALLBACK').length,
      stagesTotal: e.stages.length,
    })),
    activeCount,
    unreadCount,
  });
}
