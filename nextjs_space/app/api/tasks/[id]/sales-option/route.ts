import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { advanceExecutionPlan } from '@/lib/execution/autonomous-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await req.json();
    const { option } = body; // 'BOT_SELLS' | 'YOU_SELL' | 'HYBRID'

    if (!option) {
      return NextResponse.json({ success: false, error: 'Option is required' }, { status: 400 });
    }

    const plan = await prisma.executionPlan.findFirst({
      where: { taskId },
    });

    if (!plan) return NextResponse.json({ success: false, error: 'Execution plan not found' }, { status: 404 });

    // Update plan with salesOption and advance execution
    await prisma.executionPlan.update({
      where: { id: plan.id },
      data: { salesOption: option, status: 'IN_PROGRESS' },
    });

    const result = await advanceExecutionPlan(plan.id, option);

    return NextResponse.json({ success: true, planId: plan.id, option, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
