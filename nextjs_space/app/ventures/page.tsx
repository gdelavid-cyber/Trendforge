export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { VenturesClient } from './_components/ventures-client';
import { generateCeoPortfolioBrief } from '@/lib/council/orchestration/venture-hierarchy';
import { getVentureGraveyard } from '@/lib/venture/engine';
import { clusterMarketSignals } from '@/lib/opportunity/intelligence';

export default async function VenturesPage() {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }

  // Fetch active ventures, brief, graveyard, and signal clusters
  let ventures: any[] = [];
  let brief: any = null;
  let graveyard: any[] = [];
  let signalClusters: any[] = [];
  let pendingApprovals: any[] = [];

  try {
    if (userId) {
      ventures = await prisma.venture.findMany({
        where: {
          userId,
          lifecycleState: { notIn: ['KILLED', 'ARCHIVED'] },
        },
        include: {
          offers: true,
          customers: true,
          leads: true,
          approvalRequests: { where: { status: 'PENDING' } },
          financialRecords: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      graveyard = await getVentureGraveyard(userId);
      brief = await generateCeoPortfolioBrief(userId);

      pendingApprovals = await prisma.humanApprovalRequest.findMany({
        where: { userId, status: 'PENDING' },
        include: {
          venture: { select: { id: true, name: true, slug: true, lifecycleState: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    signalClusters = await clusterMarketSignals();
  } catch (error) {
    console.error('VenturesPage data query failed:', error);
  }

  return (
    <div className="min-h-screen bg-[#02040A] text-[#F3F3F5]">
      <Header />
      <main className="max-w-[1260px] mx-auto px-4 md:px-6 py-8">
        <VenturesClient
          initialVentures={ventures}
          ceoBrief={brief}
          graveyard={graveyard}
          signalClusters={signalClusters}
          pendingApprovals={pendingApprovals}
        />
      </main>
    </div>
  );
}
