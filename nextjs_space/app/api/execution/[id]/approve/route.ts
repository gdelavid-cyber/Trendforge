import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const execution = await db.trendExecution.findUnique({ where: { id: params.id } });
  if (!execution) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (execution.status !== 'AWAITING_APPROVAL')
    return NextResponse.json({ error: `Cannot approve from status ${execution.status}` }, { status: 409 });

  const degraded = await db.executionStage.count({
    where: { executionId: params.id, usedFallback: true },
  });

  const updated = await db.trendExecution.update({
    where: { id: params.id },
    data: { status: degraded > 0 ? 'DEGRADED' : 'COMPLETED', approvedAt: new Date() },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
