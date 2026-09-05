export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { NovaConsole } from '@/components/nova/nova-console';

export default async function NovaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <NovaConsole displayName={session.user.name ?? 'Operative'} />
    </div>
  );
}
