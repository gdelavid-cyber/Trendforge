export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { approveGate } from '@/lib/execution/engine';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body?.approvalId) return NextResponse.json({ error: 'approvalId required' }, { status: 400 });

    const user = await prismaUser(session.user.email);
    const result = await approveGate(body.approvalId, user.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === 'Not found' ? 404 : 409 });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Approve failed' }, { status: 500 });
  }
}

async function prismaUser(email: string) {
  const { prisma } = await import('@/lib/db');
  return prisma.user.findUniqueOrThrow({ where: { email } });
}
