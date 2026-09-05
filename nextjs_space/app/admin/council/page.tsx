export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { isUserAdmin, isCouncilUserModeEnabled } from '@/lib/council/config';
import { Header } from '@/components/header';
import { CouncilDashboard } from './_components/council-dashboard';

export default async function AdminCouncilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Strict admin check
  if (!isUserAdmin(session.user as any)) {
    redirect('/dashboard');
  }

  const userModeEnabled = isCouncilUserModeEnabled();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <CouncilDashboard userModeEnabled={userModeEnabled} />
    </div>
  );
}
