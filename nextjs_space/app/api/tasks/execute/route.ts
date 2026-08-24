export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { startExecution, type ExecutionMode } from '@/lib/execution/engine';

const MODES: ExecutionMode[] = ['DIY', 'CO_PILOT', 'AUTOPILOT'];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, mode, stepIndex, companionId } = body ?? {};

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }
    if (!MODES.includes(mode)) {
      return NextResponse.json({ error: `mode must be one of ${MODES.join(', ')}` }, { status: 400 });
    }

    const user = await prismaUser(session.user.email);

    // Autopilot ships behind an env flag until operations sign off.
    if (mode === 'AUTOPILOT' && process.env.AUTOPILOT_ENABLED !== '1') {
      return NextResponse.json({ error: 'Autopilot is not enabled yet. Use Co-pilot or DIY.' }, { status: 403 });
    }

    const result = await startExecution(user.id, taskId, mode, {
      stepIndex: typeof stepIndex === 'number' ? stepIndex : undefined,
      companionId: typeof companionId === 'string' ? companionId : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, userTaskId: result.userTaskId }, { status: 409 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution start failed' }, { status: 500 });
  }
}

async function prismaUser(email: string) {
  const { prisma } = await import('@/lib/db');
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return user;
}
