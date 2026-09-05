export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/layouts/header';
import { WithdrawalsAdminClient } from './_components/withdrawals-admin-client';

export default async function AdminWithdrawalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  if ((session.user as any)?.role !== 'ADMIN') redirect('/dashboard');

  let requests: any[] = [];
  try {
    const rows = await prisma.withdrawalRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        agent: { select: { name: true, walletBalance: true } },
        user: { select: { name: true, email: true } },
      },
    });
    requests = rows.map((r) => ({
      id: r.id,
      agentName: r.agent.name,
      agentBalance: r.agent.walletBalance,
      userName: r.user?.name ?? 'Unknown',
      userEmail: r.user?.email ?? '',
      amountUsdc: r.amountUsdc,
      destination: r.destination,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <WithdrawalsAdminClient requests={requests} />
    </div>
  );
}
