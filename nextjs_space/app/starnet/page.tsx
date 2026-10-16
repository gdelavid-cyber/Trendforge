export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layouts/header';
import { StarNetDashboardClient } from './_components/starnet-client';

export default async function StarNetDashboardPage() {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }

  let tasks: any[] = [];
  let approvals: any[] = [];
  let ventures: any[] = [];
  let agentSpends: any[] = [];

  try {
    const [fetchedTasks, fetchedApprovals, fetchedVentures, fetchedSpends] = await Promise.all([
      prisma.starNetTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          venture: {
            select: { id: true, name: true, lifecycleState: true },
          },
        },
      }),
      prisma.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          venture: {
            select: { id: true, name: true, slug: true, lifecycleState: true },
          },
        },
      }),
      prisma.venture.findMany({
        where: {
          lifecycleState: { notIn: ['ARCHIVED'] },
        },
        include: {
          offers: true,
          financialRecords: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.agentSpend.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    tasks = fetchedTasks;
    approvals = fetchedApprovals;
    ventures = fetchedVentures;
    agentSpends = fetchedSpends;
  } catch (err) {
    console.error('[StarNetDashboardPage] Data query failed:', err);
  }

  return (
    <div className="min-h-screen bg-[#02040A] text-[#F3F3F5] selection:bg-cyan-500/30">
      <Header />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StarNetDashboardClient
          initialTasks={tasks}
          initialApprovals={approvals}
          initialVentures={ventures}
          initialSpends={agentSpends}
          userId={userId || 'operator'}
        />
      </main>
    </div>
  );
}
