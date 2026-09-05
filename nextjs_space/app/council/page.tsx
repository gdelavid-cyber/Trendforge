export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { CouncilBoardroom } from '@/components/council/council-boardroom';

export default async function CouncilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-transparent text-white pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CouncilBoardroom />
      </main>
    </div>
  );
}
