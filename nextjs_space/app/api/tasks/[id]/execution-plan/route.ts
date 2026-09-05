import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { startOrGetExecutionPlan } from '@/lib/execution/autonomous-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;
    const taskId = params.id;

    let plan = await prisma.executionPlan.findFirst({
      where: { taskId, userId: userId || null },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { artifacts: true, logs: { orderBy: { timestamp: 'desc' } } },
        },
      },
    });

    if (!plan) {
      plan = await startOrGetExecutionPlan(taskId, userId);
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
