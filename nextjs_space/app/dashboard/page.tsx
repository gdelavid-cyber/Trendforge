export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { DashboardClient } from './_components/dashboard-client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;

  let user: any = null;
  let trendingMoves: any[] = [];
  let userTasks: any[] = [];
  let trendSummary = '';

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userTasks: true,
      },
    });

    const now = new Date();
    trendingMoves = await prisma.task.findMany({
      where: {
        isTrending: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { trendScore: 'desc' },
      take: 5,
    });

    userTasks = await prisma.userTask.findMany({
      where: { userId },
    });

    const digest = await prisma.weeklyDigest.findFirst({ orderBy: { weekOf: 'desc' } });
    trendSummary = digest?.trendSummary ?? '';
  } catch (e) {
    console.error('Dashboard data query failed:', e);
  }

  const completedCount = userTasks.filter(ut => ut.status === 'COMPLETED').length;

  const headerStats = user
    ? {
        totalEarnings: user.totalEarnings,
        completedCount,
        userTasks,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F3F3F5]">
      <Header userStats={headerStats} />
      <DashboardClient
        user={
          user
            ? {
                name: user.name,
                role: user.role,
                totalEarnings: user.totalEarnings,
                completedCount,
                userTasks,
                favorCredits: user.favorCredits,
              }
            : null
        }
        trendingMoves={trendingMoves.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          riskLevel: t.riskLevel,
          startupCost: t.startupCost,
          estimatedEarningsLow: t.estimatedEarningsLow,
          estimatedEarningsHigh: t.estimatedEarningsHigh,
          timeToFirstDollar: t.timeToFirstDollar,
          category: t.category,
          trendScore: t.trendScore,
          expiresAt: t.expiresAt?.toISOString() ?? null,
        }))}
        userTaskIds={userTasks.map((ut: any) => ut.taskId)}
        trendSummary={trendSummary}
      />
    </div>
  );
}
