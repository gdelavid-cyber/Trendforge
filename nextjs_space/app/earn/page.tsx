export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { EarnLandingClient } from './_components/earn-landing-client';

export default async function EarnLandingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let totalEarnings = 0;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });
    if (user) totalEarnings = user.totalEarnings;
  }

  let tasks: any[] = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: { trendScore: 'desc' },
      take: 6,
    });
  } catch (e) {
    console.error('Failed to load tasks for earn page:', e);
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <EarnLandingClient 
        userEarnings={totalEarnings} 
        tasks={tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          estimatedEarningsLow: t.estimatedEarningsLow,
          estimatedEarningsHigh: t.estimatedEarningsHigh,
          timeToFirstDollar: t.timeToFirstDollar,
          trendScore: t.trendScore,
        }))} 
      />
    </div>
  );
}