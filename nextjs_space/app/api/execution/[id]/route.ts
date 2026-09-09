import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runExecution } from '@/lib/execution/orchestrator';
import { STAGES } from '@/lib/execution/stages';

export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const execution = await db.trendExecution.findUnique({
    where: { id: params.id },
    include: {
      stages: { orderBy: { ordinal: 'asc' } },
      trend: { select: { name: true, category: true } },
    },
  });

  if (!execution) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Self-heal: if the client is polling and the run is stale, kick it forward.
  const stale = Date.now() - execution.updatedAt.getTime() > 90_000;
  if (execution.status === 'RUNNING' && stale) {
    void runExecution(execution.id).catch(console.error);
  }

  return NextResponse.json({
    id: execution.id,
    status: execution.status,
    currentStage: execution.currentStage,
    progressPct: execution.progressPct,
    degraded: execution.stages.some((s) => s.usedFallback),
    trendName: execution.trend.name,
    revenueKit: execution.revenueKit,
    stages: STAGES.map((def) => {
      const row = execution.stages.find((s) => s.stageKey === def.key);
      return {
        key: def.key,
        label: def.label,
        description: def.description,
        ordinal: def.ordinal,
        status: row?.status ?? 'PENDING',
        usedFallback: row?.usedFallback ?? false,
        attempts: row?.attempts ?? 0,
        latencyMs: row?.latencyMs ?? 0,
        output: row?.output ?? null,
      };
    }),
  });
}
