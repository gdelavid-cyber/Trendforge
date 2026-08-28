import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DashboardSalesClient } from './_components/dashboard-sales-client';

export default async function DashboardSalesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;

  const sales = await prisma.sale.findMany({
    where: userId ? { userId } : {},
    include: {
      task: { select: { id: true, title: true, category: true } },
      lead: { select: { buyerName: true, source: true, sourceUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const compliance = userId
    ? await prisma.complianceAgreement.findFirst({ where: { userId } })
    : null;

  return (
    <DashboardSalesClient
      initialSales={JSON.parse(JSON.stringify(sales))}
      isKycVerified={!!compliance?.termsAccepted}
    />
  );
}
