import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { masterBrain } from '@/lib/swarm/revenue/masterBrain';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await masterBrain.buildContext();
    const latestReviews = await prisma.strategyUpdate.findMany({
      orderBy: { appliedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      brainContext: ctx,
      latestStrategyReviews: latestReviews,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
