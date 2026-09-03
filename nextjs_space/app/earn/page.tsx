export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
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

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <EarnLandingClient userEarnings={totalEarnings} />
    </div>
  );
}