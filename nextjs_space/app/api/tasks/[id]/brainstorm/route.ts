import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { runSquadBrainstorm } from '@/lib/execution/brainstorm';
import { parseSteps } from '@/lib/pipeline/steps';
import { makeLlm } from '@/lib/execution/llm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { trend: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const parsedSteps = parseSteps(task.steps);
    const llm = makeLlm();

    const brainstormResult = await runSquadBrainstorm({
      taskTitle: task.title,
      taskCategory: task.category,
      steps: parsedSteps,
      companionName: 'Kairos',
      llm,
    });

    const deliverables = [
      'Turnkey Deliverable Artifact',
      'Audio Voiceover & Pitch Deck',
      '9:16 Video Asset Script',
      'Target Buyer Leads & Tailored Outreach',
    ];

    const structured = {
      marketVector: task.title,
      targetBuyer: task.category === 'LOCAL_SERVICES' ? 'Local Service Contractors' : 'High-Growth Tech Startups & Agencies',
      deliverables,
      estimatedTime: task.timeToFirstDollar || '24-48 hours',
      estimatedYield: `$${task.estimatedEarningsLow ?? 500} - $${task.estimatedEarningsHigh ?? 2500}`,
      consensusStrategy: brainstormResult.consensusStrategy,
      keyTactics: brainstormResult.keyTactics,
      dialogue: brainstormResult.dialogue,
      roleAssignments: brainstormResult.roleAssignments,
    };

    return NextResponse.json({ ok: true, brainstorm: structured });
  } catch (error: any) {
    console.error('Failed to generate brainstorm:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}