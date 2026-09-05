import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = await prisma.autonomousAgent.findMany({
      orderBy: { revenueContributed: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      agents: agents.map(a => ({
        id: a.id,
        role: a.role,
        modelTier: a.modelTier,
        status: a.status,
        performanceScore: a.performanceScore,
        revenueContributed: a.revenueContributed,
        costIncurred: a.costIncurred,
        netContribution: a.revenueContributed - a.costIncurred,
        tasksCompleted: a.tasksCompleted,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
