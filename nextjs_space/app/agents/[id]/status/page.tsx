import { AgentStatusClient } from './_components/agent-status-client';

export const metadata = {
  title: 'Agent Execution Terminal // Live Telemetry | Trendly',
  description: 'Real-time telemetry and execution logs for autonomous Swarm Agents.',
};

export default async function AgentStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <AgentStatusClient runId={id} />
    </div>
  );
}
