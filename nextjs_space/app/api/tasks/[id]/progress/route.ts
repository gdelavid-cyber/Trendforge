export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { stepsCompleted } = await request.json();

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    const totalSteps = (() => { try { const s = typeof task?.steps === 'string' ? JSON.parse(task.steps) : (task?.steps ?? []); return s?.length ?? 0; } catch { return 5; } })();

    const isCompleted = stepsCompleted >= totalSteps;

    const userTask = await prisma.userTask.update({
      where: { userId_taskId: { userId, taskId: params.id } },
      data: {
        stepsCompleted,
        ...(isCompleted ? { status: 'COMPLETED', completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ userTask });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
