export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { EarnPageClient } from './_components/earn-page-client';

export const metadata = {
  title: 'Task & Earn | Trendly OS',
  description: 'Instant monetization tasks, 3 high-yield earning playbooks, and autonomous StarNet Swarm execution.',
};

export default async function EarnPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'FREE';

  let totalTasks = 0;
  try {
    totalTasks = await prisma.task.count();
  } catch (e) {
    totalTasks = 952;
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <EarnPageClient initialTotalTasks={totalTasks} userRole={userRole} />
    </div>
  );
}
