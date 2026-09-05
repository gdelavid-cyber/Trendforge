import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { getNovaBriefing } from '@/lib/growth/nova/reads';
import { serviceUserId } from '@/lib/growth/nova/service-auth';

// N1: live-state briefing. Reads are free — Nova charges for actions and
// messages, never for showing you your own status.
// Direction B: opencode sessions may read with x-nova-key + ?userId=.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const svcUserId = serviceUserId(req, url);
  let userId: string;
  let role = 'FREE';
  if (svcUserId) {
    const row = await prisma.user.findUnique({ where: { id: svcUserId }, select: { id: true, role: true } });
    if (!row) return NextResponse.json({ ok: false, error: 'Unknown user.' }, { status: 404 });
    userId = row.id;
    role = String(row.role ?? 'FREE');
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: 'Sign in to view your briefing.' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 404 });
    }
    userId = user.id;
    role = String(user.role ?? 'FREE');
  }
  const briefing = await getNovaBriefing(userId, role);
  return NextResponse.json({ ok: true, briefing });
}
