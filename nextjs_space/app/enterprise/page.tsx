import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { EnterpriseClient } from './_components/enterprise-client';

export const metadata = {
  title: 'Enterprise Swarm & Custom Agents // Dedicated Infrastructure | Trendly',
  description: 'Enterprise-grade autonomous AI Swarms, dedicated proxies, custom LLM fine-tuning, and 99.9% SLA.',
};

export default async function EnterprisePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <EnterpriseClient user={session?.user || null} />
    </div>
  );
}
