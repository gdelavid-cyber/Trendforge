export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/council/config';
import { notifyAdmin } from '@/lib/council/admin-notify';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isUserAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sessionId, decision, notes = '' } = body;

    if (!sessionId || !['approved', 'rejected', 'needs_more_debate'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid parameters: decision must be approved, rejected, or needs_more_debate' },
        { status: 400 }
      );
    }

    const councilSession = await prisma.councilSession.findUnique({
      where: { id: sessionId },
    });

    if (!councilSession) {
      return NextResponse.json({ error: 'Council session not found' }, { status: 404 });
    }

    const adminUser = session.user as any;

    // 1. Record or update AdminReview
    const adminReview = await prisma.adminReview.upsert({
      where: { sessionId },
      create: {
        sessionId,
        adminId: adminUser.id || adminUser.email || 'admin',
        decision,
        notes,
      },
      update: {
        decision,
        notes,
        reviewedAt: new Date(),
      },
    });

    // 2. Update CouncilSession status
    await prisma.councilSession.update({
      where: { id: sessionId },
      data: {
        status: decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'in_debate',
      },
    });

    // 3. Dispatch admin notification & conditional user publishing
    const conclusion = (councilSession.conclusion as any) || {};
    const title = conclusion.title || 'Market Opportunity';

    const notifyResult = await notifyAdmin(sessionId, title);

    return NextResponse.json({
      success: true,
      message: `Council session review set to ${decision.toUpperCase()}.`,
      adminReview,
      publishedToUsers: notifyResult.publishedToUsers,
    });
  } catch (error: any) {
    console.error('[CouncilReview] Error:', error);
    return NextResponse.json({ error: error.message || 'Review failed' }, { status: 500 });
  }
}
