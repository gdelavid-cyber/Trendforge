export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getGuideStatus, markGuideSeen, markTourDone } from '@/lib/guide/status';

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId,
          step: 0,
          isCompleted: false,
        },
      });
    }

    const agentCount = await prisma.web4Agent.count({ where: { userId } });

    return NextResponse.json({
      success: true,
      progress,
      hasAgents: agentCount > 0,
      shouldShowTour: !progress.isCompleted,
      tourDone: progress.tourDone,
      guideSeenAt: progress.guideSeenAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

/**
 * Persists guide/tour state: { tourDone: true } after the spotlight finishes
 * once, { guideSeen: true } when the /guide hub is opened. Idempotent.
 */
export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let status;
    if (body.tourDone === true) {
      status = await markTourDone(userId);
    }
    if (body.guideSeen === true) {
      status = await markGuideSeen(userId);
    }
    if (!status) {
      return NextResponse.json({ error: 'Nothing to update (send tourDone and/or guideSeen)' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to persist guide status' }, { status: 500 });
  }
}
