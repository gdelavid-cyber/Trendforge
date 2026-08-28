import { StatusClient } from './_components/status-client';

export const metadata = {
  title: 'System Status & Swarm Uptime // Live Observability | Trendly',
  description: 'Public real-time operational status, swarm agent uptime, and latency metrics for Trendly.',
};

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <StatusClient />
    </div>
  );
}
