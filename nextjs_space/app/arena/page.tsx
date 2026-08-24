export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { ArenaSelectClient } from './_components/arena-select-client';
import { loadMergedCatalog } from '@/lib/cosmetics/server-catalog';

export const metadata = {
  title: 'The World // Trendly',
  description: 'Select your autonomous AI combatant, customize combat loadouts, and enter high-stakes battle arena tournaments.',
};

export default async function ArenaPage() {
  const [session, mergedCatalog] = await Promise.all([
    getServerSession(authOptions),
    loadMergedCatalog(),
  ]);
  const userEmail = session?.user?.email;

  let agents: any[] = [];
  let user: any = null;

  if (userEmail) {
    user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user) {
      agents = await prisma.web4Agent.findMany({
        where: { userId: user.id },
        include: {
          battlesAsChallenger: { orderBy: { createdAt: 'desc' }, take: 5 },
          battlesAsDefender: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { profit: 'desc' },
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] text-white relative overflow-hidden">
      <Header />
      <ArenaSelectClient initialAgents={agents} user={user} initialCatalog={mergedCatalog} />
    </div>
  );
}
