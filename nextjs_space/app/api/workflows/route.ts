export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { launchAgentRun } from '@/lib/agents/orchestrator';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const workflows = await prisma.agentWorkflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, workflows });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role || 'FREE';

    const body = await request.json();
    const { name, steps } = body ?? {};

    if (!name?.trim() || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Workflow name and steps array required' }, { status: 400 });
    }

    const workflow = await prisma.agentWorkflow.create({
      data: {
        userId,
        name: name.trim(),
        definition: steps,
        status: 'active',
        lastRunAt: new Date(),
      },
    });

    // Launch first agent step in sequence
    const firstStep = steps[0];
    const firstRun = await launchAgentRun({
      userId,
      agentType: firstStep.agentType,
      parameters: firstStep.parameters || {},
      userRole,
    });

    return NextResponse.json({
      success: true,
      workflowId: workflow.id,
      firstRunId: firstRun.runId,
    });
  } catch (error: any) {
    console.error('Workflow creation error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create workflow' }, { status: 500 });
  }
}
