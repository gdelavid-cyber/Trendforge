import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AgentsClient } from './_components/agents-client';

export const metadata = {
  title: 'Agent Swarm // Autonomous Monetization Agents | Trendly',
  description: 'One-click autonomous AI agents that scrape markets, analyze demand, and execute prediction arbitrage.',
};

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#07070C] text-white">
      <AgentsClient user={session?.user || null} />
    </div>
  );
}
