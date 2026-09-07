export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { QuickWinsFlow } from './_components/quick-wins-flow';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

export default async function QuickWinsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let userEarnings = 0;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });
    if (user) userEarnings = user.totalEarnings;
  }

  // Live-only: no hardcoded buyers or opportunities. Empty pipeline shows
  // $0 + pending fresh intel — retry, never blocked, never fake.
  const defaultOpportunities: VettedOpportunity[] = [];

  const defaultLeads: GuidedLead[] = [];

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      <Header />
      {defaultOpportunities.length === 0 && defaultLeads.length === 0 && (
        <p className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground pt-6">
          pending fresh intel — retry
        </p>
      )}
      <QuickWinsFlow
        initialOpportunities={defaultOpportunities}
        initialLeads={defaultLeads}
        userEarnings={userEarnings}
      />
    </div>
  );
}