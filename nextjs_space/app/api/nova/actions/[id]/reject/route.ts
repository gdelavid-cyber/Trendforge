import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: 'Sign in.' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });

  const claimed = await prisma.novaAction.updateMany({
    where: { id: params.id, userId: user.id, status: 'PROPOSED' },
    data: { status: 'REJECTED', decidedAt: new Date() },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ ok: false, error: 'Action not found or already decided.' }, { status: 409 });
  }
  return NextResponse.json({ ok: true, status: 'REJECTED' });
}
