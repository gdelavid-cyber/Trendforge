import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = await prisma.autonomousAgent.findMany({
      orderBy: { performanceScore: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      rankings: agents.map((a, index) => ({
        rank: index + 1,
        id: a.id,
        role: a.role,
        score: a.performanceScore,
        revenue: a.revenueContributed,
        cost: a.costIncurred,
        net: a.revenueContributed - a.costIncurred,
        status: a.status,
        cyclesWithoutRevenue: a.cyclesSinceRevenue,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
