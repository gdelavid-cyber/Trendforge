import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { HealthDashboard } from './_components/health-dashboard';

export const metadata = {
  title: 'Infrastructure Health & Gateway Monitoring // Admin | Trendly',
  description: 'Real-time API error rates, external dependency latencies, and circuit breaker status.',
};

export default async function AdminHealthPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#07070C] text-white">
      <HealthDashboard user={session.user} />
    </div>
  );
}
