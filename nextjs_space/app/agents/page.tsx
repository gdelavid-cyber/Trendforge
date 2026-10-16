import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { AgentsClient } from './_components/agents-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Autonomous Swarm Agents | Trendly OS',
  description: 'Deploy specialized autonomous AI agents to research trends, extract opportunities, and execute operations.',
};

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <AgentsClient user={session?.user || null} />
    </div>
  );
}
