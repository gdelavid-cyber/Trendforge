import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runExecution } from '@/lib/execution/orchestrator';
import { STAGES } from '@/lib/execution/stages';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { trendId, userId } = await request.json();
    if (!trendId) return NextResponse.json({ error: 'trendId required' }, { status: 400 });

    const trend = await db.trend.findUnique({
      where: { id: trendId },
      include: { _count: { select: { signals: true } } },
    });
    if (!trend) return NextResponse.json({ error: 'Trend not found' }, { status: 404 });

    // Reuse an in-flight or finished run rather than duplicating spend
    const existing = await db.trendExecution.findFirst({
      where: { trendId, status: { in: ['QUEUED', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'DEGRADED'] } },
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
        userId: userId || null,
        status: 'QUEUED',
        stages: {
          create: STAGES.map((s) => ({ stageKey: s.key, ordinal: s.ordinal, status: 'PENDING' })),
        },
      },
    });

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
