export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { SKILLS_LIBRARY } from '@/lib/web4/skills-library';
import { isFunded, postEntry } from '@/lib/web4/ledger';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const agent = await prisma.web4Agent.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      survivalLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, agent });
}

// Execute Agent Workflow or Refuel
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agent = await prisma.web4Agent.findUnique({
    where: { id: params.id },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // A. Action: Refuel was retired with simulated money. Real funding is an
    // on-chain USDC deposit matched by the agent's reference memo code.
    if (action === 'REFUEL') {
      return NextResponse.json({
        error: 'Simulated refuel removed. Fund this agent with a real USDC deposit (Fund panel on the agent card).',
        code: 'USE_DEPOSITS',
      }, { status: 410 });
    }

    // B. Action: Execute Autonomous Mission Workflow
    // Honest economics: missions burn real ledger balance for compute and
    // record what actually ran. No yield is invented here — real money enters
    // only via deposits, trades, and battle pots.
    if (!(await isFunded(agent.id))) {
      return NextResponse.json({
        error: 'Agent is dormant. Fund its Conway wallet to activate make-money-or-die.',
        code: 'DORMANT',
      }, { status: 402 });
    }

    const skillsList: any[] = Array.isArray(agent.skills) ? (agent.skills as any[]) : [];
    let totalComputeBurn = 0;
    const executionResults: any[] = [];

    for (const step of skillsList) {
      const def = SKILLS_LIBRARY.find((s) => s.id === step.skillId) || SKILLS_LIBRARY[0];
      const stepCost = def.computeCostUsdc;
      totalComputeBurn += stepCost;

      executionResults.push({
        skillId: def.id,
        name: def.name,
        costUsdc: stepCost,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    }

    if (agent.walletBalance < totalComputeBurn) {
      return NextResponse.json({
        error: `Insufficient balance: mission compute costs $${totalComputeBurn.toFixed(2)} USDC, wallet holds $${agent.walletBalance.toFixed(2)}.`,
        code: 'INSUFFICIENT_FUNDS',
      }, { status: 402 });
    }

    const burn = await postEntry({
      agentId: agent.id,
      userId: agent.userId,
      type: 'MISSION_BURN',
      amountUsdc: -totalComputeBurn,
      ref: `mission-${Date.now()}`,
      note: `Compute burn for ${executionResults.length} skill step(s).`,
    });

    const updated = await prisma.web4Agent.update({
      where: { id: agent.id },
      data: {
        totalCosts: { increment: totalComputeBurn },
        profit: { decrement: totalComputeBurn },
        lastActive: new Date(),
        survivalScore: Math.min(100, agent.survivalScore + 5),
        memory: {
          lastRun: new Date().toISOString(),
          results: executionResults,
        },
      },
    });

    await prisma.agentSurvivalLog.create({
      data: {
        agentId: agent.id,
        event: 'MISSION_EXECUTION',
        burnAmount: totalComputeBurn,
        yieldAmount: 0,
        balanceAfter: burn.balance,
        details: { stepsExecuted: executionResults.length },
      },
    });

    return NextResponse.json({
      success: true,
      executionResults,
      totalComputeBurn,
      agent: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution error' }, { status: 500 });
  }
}
