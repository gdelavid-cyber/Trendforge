import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await swarmMemory.getTask(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const evidence = await prisma.evidenceBundle.findUnique({ where: { taskId: params.id } });
    const attestation = await prisma.attestation.findUnique({ where: { taskId: params.id } });
    const logs = await prisma.agentActivityLog.findMany({
      where: { taskId: params.id },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({
      success: true,
      task,
      evidence,
      attestation,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
