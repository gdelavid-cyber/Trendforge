import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { db } from '@/lib/db';
import { runExecution } from '@/lib/execution/orchestrator';
import { STAGES } from '@/lib/execution/stages';
import { logActivity } from '@/lib/execution/activity';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id;

    const body = await request.json().catch(() => ({}));
    let { trendId, taskId, userId } = body;
    userId = sessionUserId || userId || null;

    if (!trendId && taskId) {
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: { trendId: true },
      });
      if (task) {
        trendId = task.trendId;
      }
    }

    if (!trendId) return NextResponse.json({ error: 'trendId or taskId required' }, { status: 400 });

    const trend = await db.trend.findUnique({
      where: { id: trendId },
      include: { _count: { select: { signals: true } } },
    });
    if (!trend) return NextResponse.json({ error: 'Trend not found' }, { status: 404 });

    // Reuse an in-flight or finished run for this user/trend rather than duplicating spend
    const existing = await db.trendExecution.findFirst({
      where: {
        trendId,
        ...(userId ? { userId } : {}),
        status: { in: ['QUEUED', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'DEGRADED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      if (existing.status === 'RUNNING' || existing.status === 'QUEUED') {
        void runExecution(existing.id).catch(console.error);
      }
      return NextResponse.json({ executionId: existing.id, resumed: true, status: existing.status });
    }

    const execution = await db.trendExecution.create({
      data: {
        trendId,
        userId,
        status: 'QUEUED',
        lastCheckpoint: 'Initializing 6-stage pipeline',
        stages: {
          create: STAGES.map((s) => ({ stageKey: s.key, ordinal: s.ordinal, status: 'PENDING' })),
        },
      },
    });

    if (userId) {
      await logActivity({
        userId,
        kind: 'execution_started',
        title: `Pipeline Started: ${trend.name}`,
        detail: `Autonomous revenue kit initiated for ${trend.category}`,
        executionId: execution.id,
        trendId,
      });
    }

    // Fire and forget — client polls. The stall sweeper covers a timeout kill.
    void runExecution(execution.id).catch((err) => {
      console.error('[Exec] Background run failed:', err);
      return db.trendExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', errorMessage: String(err) },
      });
    });

    return NextResponse.json({ executionId: execution.id, resumed: false, status: 'QUEUED' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

