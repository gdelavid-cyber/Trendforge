export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Header } from '@/components/header';
import { EarnLandingClient } from './_components/earn-landing-client';
import { EARN_METHODS } from '@/lib/earn/methods';

export default async function EarnLandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <EarnLandingClient methods={EARN_METHODS} isAuthenticated={!!session?.user} />
    </div>
  );
}