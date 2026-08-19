export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { MarketplaceClient } from './_components/marketplace-client';

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  let templates: any[] = [];
  try {
    templates = await prisma.template.findMany({
      where: { isApproved: true },
      include: { user: { select: { name: true } } },
      orderBy: { downloads: 'desc' },
    });
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen">
      <Header />
      <MarketplaceClient templates={templates.map((t: any) => ({
        id: t.id, title: t.title, description: t.description, price: t.price,
        category: t.category, downloads: t.downloads, userName: t.user?.name ?? 'Anonymous',
      }))} />
    </div>
  );
}
