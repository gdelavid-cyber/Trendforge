export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    const run = await prisma.agentRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    }

    // Only creator or admin can cancel
    if (run.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (run.status === 'completed' || run.status === 'failed') {
      return NextResponse.json({ error: `Cannot cancel an agent run with status '${run.status}'` }, { status: 400 });
    }

    const updated = await prisma.agentRun.update({
      where: { id },
      data: {
        status: 'cancelled',
        errorMessage: 'Execution manually cancelled by user.',
        completedAt: new Date(),
        logs: {
          set: `${run.logs}\n[${new Date().toISOString()}] [CANCEL] Run cancelled by user request.`,
        },
      },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error: any) {
    console.error('Cancel agent run error:', error);
    return NextResponse.json({ error: 'Failed to cancel agent run' }, { status: 500 });
  }
}
