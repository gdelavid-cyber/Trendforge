import { Header } from '@/components/header';
import { BattlesClient } from './_components/battles-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export default async function BattlesPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <BattlesClient user={session?.user} />
    </div>
  );
}
