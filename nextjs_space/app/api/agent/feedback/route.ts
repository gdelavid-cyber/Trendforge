export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const body = await request.json();
    const { runId, rating, feedback } = body ?? {};

    if (!runId || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Missing runId or rating' }, { status: 400 });
    }

    const run = await prisma.agentRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    }

    const updated = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        userRating: rating,
        userFeedback: feedback?.trim() || null,
      },
    });

    // Reward user with 5 Community Points for submitting feedback
    await prisma.user.update({
      where: { id: userId },
      data: {
        communityPoints: { increment: 5 },
      },
    });

    return NextResponse.json({
      success: true,
      runId: updated.id,
      rating: updated.userRating,
      communityPointsAwarded: 5,
    });
  } catch (error: any) {
    console.error('Agent feedback submission error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit feedback' }, { status: 500 });
  }
}
