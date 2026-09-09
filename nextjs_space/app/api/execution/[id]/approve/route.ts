import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const execution = await db.trendExecution.findUnique({ where: { id: params.id } });
  if (!execution) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (execution.status !== 'AWAITING_APPROVAL')
    return NextResponse.json({ error: `Cannot approve from status ${execution.status}` }, { status: 409 });

  let body: { path?: string } = {};
  try {
    body = await req.json();
  } catch {}

  const chosenPath = body.path === 'ai_assists' ? 'AI Assists' : 'User Sells';

  const degraded = await db.executionStage.count({
    where: { executionId: params.id, usedFallback: true },
  });

  const finalStatus = degraded > 0 ? 'DEGRADED' : 'COMPLETED';

  const updated = await db.trendExecution.update({
    where: { id: params.id },
    data: { status: finalStatus, approvedAt: new Date() },
  });

  // Mark all associated tasks as COMPLETED so they drop off the Ready list immediately
  await db.task.updateMany({
    where: { trendId: execution.trendId },
    data: { status: 'COMPLETED' },
  });

  // Log transparent approval event
  await db.executionEvent.create({
    data: {
      executionId: params.id,
      actor: 'user',
      stageKey: 'sell_fork',
      message: `Deliverable approved by user (${chosenPath}). Ready tasks marked COMPLETED.`,
      data: { chosenPath, finalStatus },
    },
  });

  return NextResponse.json({ success: true, status: updated.status, chosenPath });
}
