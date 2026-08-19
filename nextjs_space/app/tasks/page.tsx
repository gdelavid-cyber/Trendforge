export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { TasksContainer } from './_components/tasks-container';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;
  const userRole = (session.user as any)?.role || 'FREE';

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
  } catch (err) {
    console.error('Failed to query tasks user stats:', err);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F3F3F5]">
      <Header userStats={headerStats} />
      <TasksContainer userRole={userRole} />
    </div>
  );
}
