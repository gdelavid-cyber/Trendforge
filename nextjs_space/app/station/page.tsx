export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layouts/header';
import { checkStationHealth } from '@/lib/execution/runners/starnet';
import { StationClient } from './_components/station-client';

export default async function StationPage() {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }

  let isStationAlive = false;
  try {
    isStationAlive = await checkStationHealth();
  } catch {
    isStationAlive = false;
  }

  let stations: any[] = [];
  let jobs: any[] = [];
  let ventures: any[] = [];

  if (userId) {
    try {
      stations = await prisma.starNetStation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      jobs = await prisma.starNetJob.findMany({
        where: {
          station: { userId },
        },
        include: {
          station: { select: { id: true, name: true, url: true } },
        },
        orderBy: { dispatchedAt: 'desc' },
        take: 30,
      });

      ventures = await prisma.venture.findMany({
        where: {
          userId,
          lifecycleState: { notIn: ['KILLED', 'ARCHIVED'] },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          industry: true,
          lifecycleState: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (err) {
      console.error('[StationPage] data load error:', err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-purple-500/30">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StationClient
          initialIsAlive={true}
          initialStations={stations}
          initialJobs={jobs}
          ventures={ventures}
          starnetUrl="in-process"
        />
      </main>
    </div>
  );
}
