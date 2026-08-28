export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { CommunityClient } from './_components/community-client';

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  let favors: any[] = [];
  let leaderboard: any[] = [];

  try {
    favors = await prisma.favor.findMany({
      where: { status: 'OPEN' },
      include: { fromUser: { select: { name: true } }, task: { select: { title: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    leaderboard = await prisma.user.findMany({
      take: 100,
      select: {
        id: true,
        name: true,
        isVIP: true,
        isMentor: true,
        userTasks: {
          select: {
            status: true,
            completedAt: true,
          },
        },
      },
    });
    // Rank by verified platform work (completed moves), never by money â€”
    // income is private ledger data, not a public leaderboard metric.
    leaderboard.sort((a: any, b: any) => {
      const aDone = a.userTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const bDone = b.userTasks.filter((t: any) => t.status === 'COMPLETED').length;
      return bDone - aDone;
    });
  } catch (e) {
    console.error('Community page data fetch failed:', e);
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <CommunityClient
        favors={favors.map((f: any) => ({ id: f.id, description: f.description, fromUser: f.fromUser?.name ?? 'Anonymous', task: f.task?.title ?? null, creditValue: f.creditValue }))}
        leaderboard={leaderboard.map((u: any) => ({
          id: u.id,
          name: u.name ?? 'Anonymous',
          completedCount: u.userTasks.filter((t: any) => t.status === 'COMPLETED').length,
          isVIP: u.isVIP,
          isMentor: u.isMentor,
          userTasks: u.userTasks,
        }))}
      />
    </div>
  );
}
