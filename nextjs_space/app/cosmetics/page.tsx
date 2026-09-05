import { Header } from '@/components/layouts/header';
import { CosmeticsStore } from './_components/cosmetics-store';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';

export const dynamic = 'force-dynamic';

export default async function CosmeticsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <CosmeticsStore user={session?.user} />
    </div>
  );
}
