export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          step: 0,
          isCompleted: false,
        },
      });
    }

    const agentCount = await prisma.web4Agent.count({ where: { userId: user.id } });

    return NextResponse.json({
      success: true,
      progress,
      hasAgents: agentCount > 0,
      shouldShowTour: !progress.isCompleted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch onboarding status' }, { status: 500 });
  }
}
