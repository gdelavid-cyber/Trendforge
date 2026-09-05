export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { voteType } = await request.json();

    const existing = await prisma.vote.findUnique({
      where: { userId_taskId: { userId, taskId: params.id } },
    });

    if (existing) {
      if (existing.voteType === voteType) {
        // Remove vote
        await prisma.vote.delete({ where: { id: existing.id } });
        await prisma.task.update({
          where: { id: params.id },
          data: voteType === 'UP' ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
        });
      } else {
        // Switch vote
        await prisma.vote.update({ where: { id: existing.id }, data: { voteType } });
        await prisma.task.update({
          where: { id: params.id },
          data: voteType === 'UP'
            ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
            : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
        });
      }
    } else {
      await prisma.vote.create({ data: { userId, taskId: params.id, voteType } });
      await prisma.task.update({
        where: { id: params.id },
        data: voteType === 'UP' ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
      });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id }, select: { upvotes: true, downvotes: true } });
    return NextResponse.json({ upvotes: task?.upvotes ?? 0, downvotes: task?.downvotes ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
