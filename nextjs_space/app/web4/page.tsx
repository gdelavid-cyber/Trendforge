export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmNav } from './swarm/_components/swarm-nav';
import { SwarmCommandCenter } from './_components/swarm-command-center';
import { prisma } from '@/lib/db';

export default async function Web4SwarmPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col">
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
