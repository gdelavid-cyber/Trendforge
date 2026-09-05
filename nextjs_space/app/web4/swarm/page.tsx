import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmCommandCenter } from '@/app/web4/_components/swarm-command-center';
import { SwarmNav } from './_components/swarm-nav';
import { prisma } from '@/lib/core/db';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm v2 | Command Center',
  description: 'Production Autonomous AI Revenue Engine - Maximize Revenue or Die',
};

export const dynamic = 'force-dynamic';

export default async function SwarmMainPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <Header />
      <SwarmNav
        isSurvival={brainState?.survivalMode ?? false}
        isDryRun={brainState?.dryRun ?? false}
      />
      <div className="flex-1">
        <SwarmCommandCenter />
      </div>
    </div>
  );
}
