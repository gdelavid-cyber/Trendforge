import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/header';
import { Web4AgentsClient } from './web4/_components/web4-agents-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Web4 Sovereign Agents // Autonomous Wealth Operating System | Trendly',
  description: 'Deploy autonomous economic agents with Conway crypto wallets, EIP-8004 identities, and Darwinian survival instincts.',
};

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <Web4AgentsClient user={session?.user || null} />
    </div>
  );
}
