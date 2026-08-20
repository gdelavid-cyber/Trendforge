export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const run = await prisma.agentRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      run: {
        id: run.id,
        agentType: run.agentType,
        status: run.status,
        parameters: run.parameters,
        result: run.result,
        logs: run.logs,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        errorMessage: run.errorMessage,
        costCents: run.costCents,
        durationMs: run.durationMs,
        correlationId: run.correlationId,
      },
    });
  } catch (error: any) {
    console.error('Fetch agent run status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
