export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { TaskDetailClient } from './_components/task-detail-client';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;

  let task: any = null;
  let userTask: any = null;
  let stories: any[] = [];
  let artifacts: any[] = [];
  let headerStats: any = null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userTasks: true },
    });
    if (user) {
      const completedCount = user.userTasks.filter(ut => ut.status === 'COMPLETED').length;
      headerStats = {
        totalEarnings: user.totalEarnings,
        completedCount,
        userTasks: user.userTasks,
      };
    }

    task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { trend: true },
    });
    if (!task) notFound();
    userTask = await prisma.userTask.findUnique({
      where: { userId_taskId: { userId, taskId: params.id } },
    });
    if (userTask) {
      artifacts = await prisma.taskArtifact.findMany({
        where: { userTaskId: userTask.id },
        orderBy: [{ stepIndex: 'asc' }, { createdAt: 'asc' }],
      });
    }
    stories = await prisma.successStory.findMany({
      where: { taskId: params.id, isPublished: true, verificationStatus: 'VERIFIED' },
      include: { user: { select: { name: true } } },
      take: 5,
    });
  } catch (e) {
    console.error(e);
  }

  if (!task) notFound();

  const serialized = {
    ...task,
    weekOf: task.weekOf?.toISOString() ?? null,
    createdAt: task.createdAt?.toISOString() ?? null,
    trend: task.trend ? { ...task.trend, detectedAt: task.trend.detectedAt?.toISOString() ?? null, createdAt: task.trend.createdAt?.toISOString() ?? null } : null,
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header userStats={headerStats} />
      <TaskDetailClient
        task={serialized}
        userTask={userTask ? { ...userTask, launchedAt: userTask.launchedAt?.toISOString() ?? null, completedAt: userTask.completedAt?.toISOString() ?? null, createdAt: userTask.createdAt?.toISOString() ?? null } : null}
        artifacts={artifacts.map((a: any) => ({ id: a.id, stepIndex: a.stepIndex, kind: a.kind, name: a.name, url: a.url ?? null, createdAt: a.createdAt?.toISOString() ?? null }))}
        stories={stories.map((s: any) => ({ id: s.id, earningsAmount: s.earningsAmount, description: s.description, userName: s.user?.name ?? 'Anonymous' }))}
      />
    </div>
  );
}
