export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { TrendlyOsClient } from './_components/trendly-os-client';

export default async function TrendlyOsPage() {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }

  // Fetch initial telemetry server-side
  let recentDecisions: any[] = [];
  let pendingApprovals: any[] = [];
  let calibrationSnapshots: any[] = [];
  let recentRuns: any[] = [];
  let workflows: any[] = [];

  try {
    const [decisions, approvals, calibrations, runs, wf] = await Promise.all([
      prisma.decisionLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.approval.findMany({
        where: { status: 'PENDING' },
        include: {
          userTask: { select: { task: { select: { title: true } }, mode: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 15,
      }),
      prisma.calibrationSnapshot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.agentRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      userId
        ? prisma.agentWorkflow.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
    ]);

    recentDecisions = decisions;
    pendingApprovals = approvals;
    calibrationSnapshots = calibrations;
    recentRuns = runs;
    workflows = wf;
  } catch (err) {
    console.error('[TrendlyOsPage] Initial data fetch error:', err);
  }

  return (
    <div className="min-h-screen bg-[#04060C] text-slate-100 selection:bg-cyan-500/30">
      <Header />
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <TrendlyOsClient
          initialDecisions={recentDecisions}
          initialApprovals={pendingApprovals}
          initialCalibrations={calibrationSnapshots}
          initialRuns={recentRuns}
          initialWorkflows={workflows}
          userId={userId || 'guest'}
        />
      </main>
    </div>
  );
}
