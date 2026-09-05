export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { AdminClient } from './_components/admin-client';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  if ((session.user as any)?.role !== 'ADMIN') redirect('/dashboard');

  let logs: any[] = [];
  let pendingStories: any[] = [];
  let userCount = 0;
  let taskCount = 0;

  try {
    logs = await prisma.trendIngestionLog.findMany({ orderBy: { executedAt: 'desc' }, take: 20 });
    pendingStories = await prisma.successStory.findMany({
      where: { verificationStatus: 'PENDING' },
      include: { user: { select: { name: true, email: true } }, task: { select: { title: true } } },
    });
    userCount = await prisma.user.count();
    taskCount = await prisma.task.count();
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen">
      <Header />
      <AdminClient
        logs={logs.map((l: any) => ({ id: l.id, source: l.source, status: l.status, recordsIngested: l.recordsIngested, errorMessage: l.errorMessage, executedAt: l.executedAt?.toISOString() ?? null, durationMs: l.durationMs }))}
        pendingStories={pendingStories.map((s: any) => ({ id: s.id, earningsAmount: s.earningsAmount, description: s.description, userName: s.user?.name ?? 'Unknown', userEmail: s.user?.email ?? '', taskTitle: s.task?.title ?? 'Unknown' }))}
        userCount={userCount}
        taskCount={taskCount}
      />
    </div>
  );
}
