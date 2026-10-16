import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StarNetOrchestrator, SwarmAgentRole } from '@/lib/swarm/orchestrator';

/**
 * GET /api/starnet/tasks
 * Lists tasks in the queue with optional filtering.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ventureId = searchParams.get('ventureId') || undefined;
  const status = searchParams.get('status') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  try {
    const tasks = await prisma.starNetTask.findMany({
      where: {
        ...(ventureId ? { ventureId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        venture: {
          select: { id: true, name: true, lifecycleState: true },
        },
      },
    });

    return NextResponse.json({ ok: true, count: tasks.length, tasks });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

/**
 * POST /api/starnet/tasks
 * Queues a new task or executes the next pending task.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orchestrator = StarNetOrchestrator.getInstance();

    if (body.action === 'PROCESS_NEXT') {
      const result = await orchestrator.processNextPendingTask();
      return NextResponse.json({ ok: true, executed: !!result, result });
    }

    if (body.action === 'EXECUTE_TASK' && body.taskId) {
      const result = await orchestrator.executeTask(body.taskId);
      return NextResponse.json({ ok: true, result });
    }

    // Default: Queue new task
    const { ventureId, agentRole, taskType, payload } = body;
    if (!agentRole || !taskType) {
      return NextResponse.json(
        { ok: false, error: 'agentRole and taskType are required' },
        { status: 400 }
      );
    }

    const task = await orchestrator.queueTask(
      ventureId || null,
      agentRole as SwarmAgentRole,
      taskType,
      payload || {}
    );

    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to process task request' }, { status: 500 });
  }
}
