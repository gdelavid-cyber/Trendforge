export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { id } = params;

  const copilotSession = await prisma.coPilotSession.findUnique({
    where: { id },
    include: {
      lead: true,
      suggestions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      callSession: true,
      paymentLinks: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!copilotSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (copilotSession.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    session: copilotSession,
  });
}
