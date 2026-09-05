import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { startOrGetExecutionPlan, advanceExecutionPlan } from '@/lib/execution/autonomous-engine';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Initialize or fetch the active plan
    const plan = await startOrGetExecutionPlan(task.id, userId);

    // Trigger initial advancement (kicks off research + buyer discovery in autonomous engine)
    let advanceResult: any = null;
    try {
      advanceResult = await advanceExecutionPlan(plan.id, 'HYBRID');
    } catch (e: any) {
      console.warn('Initial advancement warning:', e.message);
    }

    return NextResponse.json({
      ok: true,
      planId: plan.id,
      status: plan.status,
      advanceResult,
      message: 'Autonomous swarm successfully dispatched.',
    });
  } catch (error: any) {
    console.error('Failed to execute swarm:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}