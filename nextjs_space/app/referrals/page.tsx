import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { ReferralsClient } from './_components/referrals-client';

export const metadata = {
  title: 'Referral Partner Dashboard // 10% Recurring Commission | Trendly',
  description: 'Share Trendly, earn 10% recurring Stripe commissions and stack bonus autonomous agent runs.',
};

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <ReferralsClient />
    </div>
  );
}
