import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { WorkflowBuilderClient } from './_components/workflow-builder-client';

export const metadata = {
  title: 'Swarm Workflow Builder // Agent Chaining & Pipelines | Trendly',
  description: 'Chain multiple autonomous agents sequentially into end-to-end monetization pipelines.',
};

export default async function WorkflowsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <WorkflowBuilderClient user={session.user} />
    </div>
  );
}
