export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { parseSteps } from '@/lib/tasks/steps';

/**
 * Proof-of-work feed for one run: the live step log (with timing) plus the
 * artifact rows. Owner-scoped — anyone else gets 404 semantics.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const run = await prisma.userTask.findUnique({
    where: { id: params.id },
    include: { task: { select: { id: true, title: true, steps: true } } },
  });
  if (!run || run.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const artifacts = await prisma.taskArtifact.findMany({
    where: { userTaskId: run.id },
    orderBy: [{ stepIndex: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({
    success: true,
    run: {
      id: run.id,
      mode: run.mode,
      status: run.status,
      currentStep: run.currentStep,
      launchedAt: run.launchedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      task: { id: run.task.id, title: run.task.title, totalSteps: parseSteps(run.task.steps).length },
    },
    steps: Array.isArray(run.stepResults)
      ? (run.stepResults as any[]).map((e) => ({
          index: e.index,
          title: e.title ?? null,
          action: e.action ?? null,
          status: e.status,
          output: typeof e.output === 'string' ? e.output : '',
          startedAt: e.startedAt ?? null,
          finishedAt: e.finishedAt ?? null,
          durationMs: typeof e.durationMs === 'number' ? e.durationMs : null,
          at: e.at ?? null,
        }))
      : [],
    artifacts: artifacts.map((a) => ({
      id: a.id,
      stepIndex: a.stepIndex,
      kind: a.kind,
      name: a.name,
      url: a.url ?? null,
      meta: a.meta ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
