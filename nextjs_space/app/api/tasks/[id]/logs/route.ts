export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 });
    }

    const logs = await prisma.executionLog.findMany({
      where: { taskId },
      orderBy: { timestamp: 'asc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        taskId: l.taskId,
        milestoneId: l.milestoneId,
        logType: l.logType,
        actor: l.actor,
        actorId: l.actorId,
        actionDescription: l.actionDescription,
        inputs: l.inputs,
        outputs: l.outputs,
        artifacts: l.artifacts,
        timestamp: l.timestamp.toISOString(),
        hash: l.hash,
        prevHash: l.prevHash,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
