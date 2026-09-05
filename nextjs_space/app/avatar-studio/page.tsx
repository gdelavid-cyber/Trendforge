import { Header } from '@/components/layouts/header';
import { AvatarStudioClient } from './_components/avatar-studio-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { loadMergedCatalog } from '@/lib/experience/cosmetics/server-catalog';

export const dynamic = 'force-dynamic';

export default async function AvatarStudioPage() {
  const [session, mergedCatalog] = await Promise.all([
    getServerSession(authOptions),
    loadMergedCatalog(),
  ]);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <AvatarStudioClient user={session?.user} initialCatalog={mergedCatalog} />
    </div>
  );
}
