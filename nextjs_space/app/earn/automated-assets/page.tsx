export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/header';
import { AutomatedAssetsFlow } from './_components/automated-assets-flow';

export default async function AutomatedAssetsPage() {
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

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      <Header />
      <AutomatedAssetsFlow userEarnings={userEarnings} />
    </div>
  );
}