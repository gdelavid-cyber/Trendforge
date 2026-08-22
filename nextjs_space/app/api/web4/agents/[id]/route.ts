export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { SKILLS_LIBRARY } from '@/lib/web4/skills-library';

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

    // A. Action: Refuel Wallet Balance
    if (action === 'REFUEL') {
      const amount = Number(refuelAmount) || 50;
      const updated = await prisma.web4Agent.update({
        where: { id: agent.id },
        data: {
          walletBalance: { increment: amount },
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
          balanceAfter: updated.walletBalance,
          details: { note: `Manually refueled by owner with $${amount} USDC.` },
        },
      });

      return NextResponse.json({ success: true, message: `Refueled $${amount} USDC!`, agent: updated });
    }

    // B. Action: Execute Autonomous Mission Workflow
    const skillsList: any[] = Array.isArray(agent.skills) ? (agent.skills as any[]) : [];
    let totalComputeBurn = 0;
    let totalYieldGenerated = 0;
    const executionResults: any[] = [];

    for (const step of skillsList) {
      const def = SKILLS_LIBRARY.find((s) => s.id === step.skillId) || SKILLS_LIBRARY[0];
      const stepCost = def.computeCostUsdc;
      const stepYield = Math.floor(120 + Math.random() * 380);

      totalComputeBurn += stepCost;
      totalYieldGenerated += stepYield;

      executionResults.push({
        skillId: def.id,
        name: def.name,
        costUsdc: stepCost,
        yieldUsdc: stepYield,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
    }

    const netProfit = totalYieldGenerated - totalComputeBurn;
    const updated = await prisma.web4Agent.update({
      where: { id: agent.id },
      data: {
        walletBalance: { increment: netProfit },
        totalEarnings: { increment: totalYieldGenerated },
        totalCosts: { increment: totalComputeBurn },
        profit: { increment: netProfit },
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
        yieldAmount: totalYieldGenerated,
        balanceAfter: updated.walletBalance,
        details: { stepsExecuted: executionResults.length, netProfit },
      },
    });

    return NextResponse.json({
      success: true,
      executionResults,
      netProfit,
      totalYieldGenerated,
      totalComputeBurn,
      agent: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution error' }, { status: 500 });
  }
}
