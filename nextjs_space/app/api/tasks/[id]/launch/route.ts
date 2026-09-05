export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;

    const userTask = await prisma.userTask.upsert({
      where: { userId_taskId: { userId, taskId: params.id } },
      update: { status: 'IN_PROGRESS', launchedAt: new Date() },
      create: { userId, taskId: params.id, status: 'IN_PROGRESS', launchedAt: new Date() },
    });

    return NextResponse.json({ userTask });
  } catch (error: any) {
    console.error('Launch error:', error);
    return NextResponse.json({ error: 'Failed to launch task' }, { status: 500 });
  }
}
