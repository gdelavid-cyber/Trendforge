export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/header';
import { LaunchClient } from './_components/launch-client';

export default async function LaunchPage({ params }: { params: { taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;

  let task: any = null;
  let userTask: any = null;
  try {
    task = await prisma.task.findUnique({ where: { id: params.taskId } });
    if (!task) notFound();
    userTask = await prisma.userTask.findUnique({
      where: { userId_taskId: { userId, taskId: params.taskId } },
    });
  } catch (e) { console.error(e); }

  if (!task) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <LaunchClient
        task={{ id: task.id, title: task.title, steps: task.steps, toolLinks: task.toolLinks, category: task.category }}
        userTask={userTask ? { stepsCompleted: userTask.stepsCompleted, status: userTask.status } : null}
      />
    </div>
  );
}
