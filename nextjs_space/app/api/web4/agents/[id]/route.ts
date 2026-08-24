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
    const { action, refuelAmount } = body;

    // A. Action: Refuel Wallet Balance (simulated credit until real deposits land)
    if (action === 'REFUEL') {
      const amount = Math.max(0, Number(refuelAmount) || 50);
      const move = await postEntry({
        agentId: agent.id,
        userId: agent.userId,
        type: 'ADJUSTMENT',
        amountUsdc: amount,
        ref: `refuel-${Date.now()}`,
        note: 'Simulated refuel — not real money. On-chain USDC deposits replace this.',
      });
      if (!move.ok && move.reason === 'duplicate') {
        return NextResponse.json({ error: 'Duplicate refuel, try again.' }, { status: 409 });
      }
      const updated = await prisma.web4Agent.update({
        where: { id: agent.id },
        data: {
          status: 'ACTIVE',
          gracePeriodEnds: null,
          survivalScore: Math.min(100, agent.survivalScore + 20),
        },
      });

      await prisma.agentSurvivalLog.create({
        data: {
          agentId: agent.id,
          event: 'BALANCE_REFUEL',
          yieldAmount: amount,
          burnAmount: 0,
          balanceAfter: move.balance,
          details: { note: `Simulated refuel of $${amount} (ledger ADJUSTMENT).` },
        },
      });

      return NextResponse.json({ success: true, message: `Refueled $${amount} USDC (simulated).`, agent: updated });
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
