export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { ProfileClient } from './_components/profile-client';
import { userRealIncomeUsdc } from '@/lib/web4/ledger';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as any)?.id;

  let user: any = null;
  let completedTasks = 0;
  let badges: any[] = [];
  let agentRunsCount = 0;
  let realIncomeUsdc = 0;

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true,
      },
    });
    completedTasks = await prisma.userTask.count({ where: { userId, status: 'COMPLETED' } });
    agentRunsCount = await prisma.agentRun.count({ where: { userId, status: 'completed' } });
    badges = user?.badges || [];
    realIncomeUsdc = await userRealIncomeUsdc(userId);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <ProfileClient
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills: user.skills,
                riskTolerance: user.riskTolerance,
                totalEarnings: user.totalEarnings,
                realIncomeUsdc,
                favorCredits: user.favorCredits,
                isVIP: user.isVIP,
                isMentor: user.isMentor,
                referralCode: user.referralCode,
                successFeeOptIn: user.successFeeOptIn,
                communityPoints: user.communityPoints,
                bonusAgentRuns: user.bonusAgentRuns,
                createdAt: user.createdAt?.toISOString() ?? null,
              }
            : null
        }
        completedTasks={completedTasks}
        agentRunsCount={agentRunsCount}
        badges={badges.map((b: any) => ({
          badgeId: b.badgeId,
          earnedAt: b.earnedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
