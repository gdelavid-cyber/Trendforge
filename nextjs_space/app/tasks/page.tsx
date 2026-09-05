export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { Header } from '@/components/layouts/header';
import { TasksContainer } from './_components/tasks-container';

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userRole = (session.user as any)?.role || 'FREE';

  return (
    <div className="min-h-screen bg-transparent text-[#F3F3F5]">
      <Header />
      <TasksContainer userRole={userRole} />
    </div>
  );
}
