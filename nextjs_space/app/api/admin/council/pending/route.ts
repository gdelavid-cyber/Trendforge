export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { isCouncilUserModeEnabled, isUserAdmin } from '@/lib/council/config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isUserAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const showUserMode = isCouncilUserModeEnabled();

  const whereClause: any = { status: 'admin_review' };
  if (!showUserMode) {
    // Internal mode: hide anything already sent to users
    whereClause.adminReview = {
      OR: [{ sentToUsers: false }, { is: null }],
    };
  }

  const sessions = await prisma.councilSession.findMany({
    where: whereClause,
    include: {
      adminReview: true,
      hotTrendProposal: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    sessions,
    userModeEnabled: showUserMode,
  });
}
