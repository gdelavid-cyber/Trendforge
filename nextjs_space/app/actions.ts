'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Marks a Power Move completed. Honesty boundary: this records that the WORK
 * was done — nothing else. It deliberately accepts no earnings figure and
 * touches no money field: income is recorded exclusively by the ledger when
 * real money lands (deposits, trade proceeds, battle pots). Any payout for
 * this task happens outside Trendly and is the user's to track at their bank.
 */
export async function completePowerMoveAction(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: 'Unauthorized' };
    const userId = (session.user as any)?.id;

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

    await prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: {
        userId,
        taskId,
        status: 'COMPLETED',
        stepsCompleted: totalSteps,
        earningsReported: null,
        completedAt: new Date(),
        hasOptedInRisk: true,
      },
      update: {
        status: 'COMPLETED',
        stepsCompleted: totalSteps,
        earningsReported: null,
        completedAt: new Date(),
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
