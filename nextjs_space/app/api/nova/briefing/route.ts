import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { getNovaBriefing } from '@/lib/growth/nova/reads';

// N1: live-state briefing. Reads are free — Nova charges for actions and
// messages, never for showing you your own status.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'Sign in to view your briefing.' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });
  }
  const briefing = await getNovaBriefing(user.id, String(user.role ?? 'FREE'));
  return NextResponse.json({ ok: true, briefing });
}
