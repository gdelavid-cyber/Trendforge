export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });

    const [pending, history] = await Promise.all([
      prisma.approval.findMany({
        where: { userId: user.id, status: 'PENDING' },
        include: {
          userTask: { select: { task: { select: { title: true } }, mode: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.approval.findMany({
        where: { userId: user.id, NOT: { status: 'PENDING' } },
        include: {
          userTask: { select: { task: { select: { title: true } }, mode: true } },
        },
        orderBy: { reviewedAt: 'desc' },
        take: 20,
      }),
    ]);

    return NextResponse.json({ success: true, pending, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Approvals lookup failed' }, { status: 500 });
  }
}
