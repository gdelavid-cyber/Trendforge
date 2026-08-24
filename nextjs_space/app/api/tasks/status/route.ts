export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const userTask = await prisma.userTask.findUnique({
      where: { userId_taskId: { userId: user.id, taskId } },
    });
    if (!userTask) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pendingApproval = await prisma.approval.findFirst({
      where: { userTaskId: userTask.id, status: 'PENDING' },
      orderBy: { stepIndex: 'asc' },
    });

    return NextResponse.json({ success: true, userTask, pendingApproval });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Status lookup failed' }, { status: 500 });
  }
}
