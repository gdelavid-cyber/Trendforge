import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { startOrGetExecutionPlan, advanceExecutionPlan } from '@/lib/execution/autonomous-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;
    const taskId = params.id;

    const body = await req.json().catch(() => ({}));
    const { companionId, salesOption } = body;

    // Start or fetch the plan
    const plan = await startOrGetExecutionPlan(taskId, userId, companionId);

    // If waiting for choice and choice provided, advance
    let result;
    if (salesOption || plan.status === 'IN_PROGRESS' || plan.status === 'NOT_STARTED') {
      result = await advanceExecutionPlan(plan.id, salesOption);
    } else {
      result = {
        ok: true,
        planId: plan.id,
        currentMilestone: plan.currentMilestone,
        status: plan.status,
        actionTaken: 'Plan fetched.',
      };
    }

    return NextResponse.json({ success: true, plan, result });
  } catch (error: any) {
    console.error('Task execute error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Execution failed' }, { status: 500 });
  }
}
