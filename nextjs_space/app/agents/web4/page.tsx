import { Header } from '@/components/header';
import { Web4AgentsClient } from './_components/web4-agents-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export default async function Web4AgentsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <Web4AgentsClient user={session?.user} />
    </div>
  );
}
