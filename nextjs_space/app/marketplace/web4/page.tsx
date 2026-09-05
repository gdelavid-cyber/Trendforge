import { Header } from '@/components/header';
import { Web4MarketplaceClient } from './_components/web4-marketplace-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';

export const dynamic = 'force-dynamic';

export default async function Web4MarketplacePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <Web4MarketplaceClient user={session?.user} />
    </div>
  );
}
