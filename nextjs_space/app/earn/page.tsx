export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { getReadyTasks } from '@/lib/tasks/ready';
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
    tasks = await getReadyTasks(6);
  } catch (e) {
    console.error('Failed to load ready tasks for earn page:', e);
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
          estimatedEarningsLow: t.estimatedEarningsLow ?? t.earningsLow ?? 450,
          estimatedEarningsHigh: t.estimatedEarningsHigh ?? t.earningsHigh ?? 1850,
          timeToFirstDollar: t.timeToFirstDollar ?? '24-48 hrs',
          trendScore: t.trendScore ?? 95,
        }))} 
      />
    </div>
  );
}