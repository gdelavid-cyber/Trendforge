import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await swarmMemory.getAgent(params.id);
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const activityLogs = await prisma.agentActivityLog.findMany({
      where: { agentId: params.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      agent,
      activityLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
