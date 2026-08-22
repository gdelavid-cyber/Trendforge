import { prisma } from '@/lib/db';

export async function getUserGrantStatus(userId: string) {
  let grant = await prisma.grant.findFirst({
    where: { userId },
  });

  if (!grant) {
    // Automatically provision $25.00 bootstrap micro-grant expiring in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    grant = await prisma.grant.create({
      data: {
        userId,
        amount: 25.0,
        status: 'available',
        expiresAt,
      },
    });
  }

  const agentCount = await prisma.web4Agent.count({ where: { userId } });
  const onboarding = await prisma.onboardingProgress.findUnique({ where: { userId } });

  const isEligibleToClaim = grant.status === 'available' && !grant.claimedAt;

  return {
    grant,
    isEligibleToClaim,
    hasDeployedAgent: agentCount > 0,
    hasCompletedOnboarding: onboarding?.isCompleted || false,
  };
}

export async function claimUserGrant(userId: string, targetAgentId?: string) {
  const status = await getUserGrantStatus(userId);
  if (!status.isEligibleToClaim) {
    throw new Error('Grant is already claimed or expired.');
  }

  const updatedGrant = await prisma.grant.update({
    where: { id: status.grant.id },
    data: {
      status: 'claimed',
      claimedAt: new Date(),
    },
  });

  // If a target agent is specified, credit the grant directly to the agent's Conway wallet
  if (targetAgentId) {
    await prisma.web4Agent.update({
      where: { id: targetAgentId },
      data: {
        walletBalance: { increment: status.grant.amount },
        totalEarnings: { increment: status.grant.amount },
        profit: { increment: status.grant.amount },
        survivalScore: 95,
      },
    });
  }

  return {
    success: true,
    grant: updatedGrant,
    amountClaimed: status.grant.amount,
  };
}
