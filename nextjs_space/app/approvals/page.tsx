import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { Header } from '@/components/layouts/header';
import { ApprovalsClient } from './_components/approvals-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Approval Inbox // Trendly',
};

export default async function ApprovalsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden font-sans">
      <Header />
      <ApprovalsClient />
    </div>
  );
}
