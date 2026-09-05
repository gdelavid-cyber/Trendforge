export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET() {
  try {
    const favors = await prisma.favor.findMany({
      where: { status: 'OPEN' },
      include: { fromUser: { select: { name: true } }, task: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ favors });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch favors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { description, taskId } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if ((user?.favorCredits ?? 0) < 1) {
      return NextResponse.json({ error: 'Not enough favor credits' }, { status: 400 });
    }

    const favor = await prisma.favor.create({
      data: { fromUserId: userId, description: description ?? '', taskId: taskId ?? null },
    });

    await prisma.user.update({ where: { id: userId }, data: { favorCredits: { decrement: 1 } } });

    return NextResponse.json({ favor });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create favor' }, { status: 500 });
  }
}
