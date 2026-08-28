import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { advanceExecutionPlan } from '@/lib/execution/autonomous-engine';
import { logExecutionEvent } from '@/lib/execution/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const plan = await prisma.executionPlan.findFirst({
      where: { taskId },
    });

    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    const updated = await prisma.executionPlan.update({
      where: { id: plan.id },
      data: { status: 'IN_PROGRESS' },
    });

    await logExecutionEvent({
      taskId,
      logType: 'user_action',
      actor: 'user',
      actorId: 'user',
      actionDescription: 'Resumed autonomous execution plan.',
    });

    const result = await advanceExecutionPlan(plan.id);

    return NextResponse.json({ success: true, plan: updated, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
