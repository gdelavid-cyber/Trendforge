import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { BrainDashboard } from './_components/brain-dashboard';

export const metadata = {
  title: 'AI Brain Command Center // Autonomous Telemetry & HITL | Trendly',
  description: 'Autonomous AI Brain monitoring, anomaly detection, and human-in-the-loop decision console.',
};

export default async function BrainAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#07070C] text-white">
      <BrainDashboard user={session.user} />
    </div>
  );
}
