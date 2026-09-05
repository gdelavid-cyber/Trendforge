export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/header';
import { Web4MarketplaceClient } from './web4/_components/web4-marketplace-client';

export const metadata = {
  title: 'Agent & Cosmetic Marketplace // Trendly Web4',
  description: 'Buy, sell, and hire verified high-yield autonomous Web4 agents and rare GTA cosmetic accessories.',
};

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <Web4MarketplaceClient user={session?.user || null} />
    </div>
  );
}
