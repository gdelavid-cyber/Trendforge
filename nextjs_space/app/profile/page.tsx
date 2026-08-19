export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { ProfileClient } from './_components/profile-client';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;

  let user: any = null;
  let completedTasks = 0;
  try {
    user = await prisma.user.findUnique({ where: { id: userId } });
    completedTasks = await prisma.userTask.count({ where: { userId, status: 'COMPLETED' } });
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen">
      <Header />
      <ProfileClient
        user={user ? {
          name: user.name, email: user.email, role: user.role, skills: user.skills,
          riskTolerance: user.riskTolerance, totalEarnings: user.totalEarnings,
          favorCredits: user.favorCredits, isVIP: user.isVIP, isMentor: user.isMentor,
          createdAt: user.createdAt?.toISOString() ?? null,
        } : null}
        completedTasks={completedTasks}
      />
    </div>
  );
}
