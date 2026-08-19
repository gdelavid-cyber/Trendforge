'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function completePowerMoveAction(taskId: string, earnings: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: 'Unauthorized' };
    const userId = (session.user as any)?.id;

    // Get the task details to check total steps
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: 'Power Move not found' };

    const totalSteps = (() => {
      try {
        const s = typeof task.steps === 'string' ? JSON.parse(task.steps) : (task.steps ?? []);
        return s?.length ?? 5;
      } catch {
        return 5;
      }
    })();

    // 1. Update UserTask to COMPLETED status
    await prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: {
        userId,
        taskId,
        status: 'COMPLETED',
        stepsCompleted: totalSteps,
        earningsReported: earnings,
        completedAt: new Date(),
        hasOptedInRisk: true,
      },
      update: {
        status: 'COMPLETED',
        stepsCompleted: totalSteps,
        earningsReported: earnings,
        completedAt: new Date(),
      },
    });

    // 2. Increment user's totalEarnings in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnings: {
          increment: earnings,
        },
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/community');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to complete power move:', error);
    return { error: 'Server error completing power move' };
  }
}
