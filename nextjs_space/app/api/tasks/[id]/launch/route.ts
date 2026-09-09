export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { STAGES } from '@/lib/execution/stages';
import { logActivity } from '@/lib/execution/activity';
import { runExecution } from '@/lib/execution/orchestrator';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const userTask = await prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId: params.id } },
      update: { status: 'IN_PROGRESS', launchedAt: new Date() },
      create: { userId, taskId: params.id, status: 'IN_PROGRESS', launchedAt: new Date() },
    });

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { trend: true },
    });

    let executionId: string | null = null;
    if (task?.trendId) {
      let execution = await prisma.trendExecution.findFirst({
        where: {
          trendId: task.trendId,
          userId,
          status: { in: ['QUEUED', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'DEGRADED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!execution) {
        execution = await prisma.trendExecution.create({
          data: {
            trendId: task.trendId,
            userId,
            status: 'QUEUED',
            lastCheckpoint: 'Initializing 6-stage pipeline',
            stages: {
              create: STAGES.map((s) => ({ stageKey: s.key, ordinal: s.ordinal, status: 'PENDING' })),
            },
          },
        });
        await logActivity({
          userId,
          kind: 'execution_started',
          title: `Task Run: ${task.title}`,
          detail: `Launched autonomous revenue kit for ${task.trend?.name || 'Trend'}`,
          executionId: execution.id,
          trendId: task.trendId,
        });
        void runExecution(execution.id).catch(console.error);
      }
      executionId = execution.id;
    }

    return NextResponse.json({ userTask, executionId });
  } catch (error: any) {
    console.error('Launch error:', error);
    return NextResponse.json({ error: 'Failed to launch task' }, { status: 500 });
  }
}
