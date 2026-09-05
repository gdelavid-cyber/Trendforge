export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { isCouncilUserModeEnabled } from '@/lib/council/config';

export async function GET() {
  const userMode = isCouncilUserModeEnabled();

  // If Council User Mode is OFF -> internal mode only, return empty proposals list
  if (!userMode) {
    return NextResponse.json({
      success: true,
      userModeEnabled: false,
      message: 'Council discovery mode: internal only.',
      proposals: [],
    });
  }

  // If Council User Mode is ON -> return approved public proposals
  const proposals = await prisma.hotTrendProposal.findMany({
    where: {
      visibleToUsers: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    success: true,
    userModeEnabled: true,
    proposals,
  });
}
