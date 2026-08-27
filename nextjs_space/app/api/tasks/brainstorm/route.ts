export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { parseSteps } from '@/lib/tasks/steps';
import { makeLlm } from '@/lib/execution/llm';
import { runSquadBrainstorm } from '@/lib/execution/brainstorm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, userTaskId } = body ?? {};

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const session = await getServerSession(authOptions);
    let companionName = 'Kairos';
    let llm = makeLlm();

    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
          const primary = await prisma.companion.findFirst({
            where: { userId: user.id, isPrimary: true },
            select: { name: true },
          });
          if (primary?.name) companionName = primary.name;

          const { getUserLlm } = await import('@/lib/llm/user-llm');
          const userLlm = await getUserLlm(user.id);
          if (userLlm) llm = userLlm;
        }
      } catch {}
    }

    const steps = parseSteps(task.steps);

    const sessionData = await runSquadBrainstorm({
      taskTitle: task.title,
      taskCategory: task.category,
      steps,
      companionName,
      llm,
    });

    // If userTaskId is provided, also record the brainstorm artifact for persistence
    if (userTaskId) {
      const existing = await prisma.taskArtifact.findFirst({
        where: { userTaskId, kind: 'BRAINSTORM' },
      });
      if (!existing) {
        await prisma.taskArtifact.create({
          data: {
            userTaskId,
            stepIndex: 0,
            kind: 'BRAINSTORM',
            name: `Squad Strategy & Brainstorm: ${task.title}`,
            url: null,
            meta: sessionData as any,
          },
        });
      }
    }

    return NextResponse.json({ success: true, brainstorm: sessionData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Brainstorm failed' }, { status: 500 });
  }
}
