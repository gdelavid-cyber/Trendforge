import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DisputeHandlerAgent } from '@/lib/swarm/revenue/agents/disputeHandler';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export async function GET() {
  try {
    const disputes = await prisma.swarmTask.findMany({
      where: {
        OR: [
          { state: 'DISPUTED' },
          { escrowStatus: 'DISPUTED' },
          { state: 'REFUNDED' },
        ],
      },
      include: {
        evidenceBundle: true,
        escrowLedger: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ disputes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, disputeReason } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const agents = await swarmMemory.getActiveAgents();
    let handler = agents.find(a => a.role === 'DISPUTE_HANDLER');
    if (!handler) {
      handler = await swarmMemory.spawnAgent('DISPUTE_HANDLER', 'premium');
    }

    const agent = new DisputeHandlerAgent(handler);
    const result = await agent.execute({ taskId, disputeReason });

    return NextResponse.json({
      success: true,
      taskId,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
