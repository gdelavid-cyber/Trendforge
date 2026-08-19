export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;

    // Find a mentor
    const mentor = await prisma.user.findFirst({
      where: { isMentor: true, id: { not: userId } },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'No mentors available right now' }, { status: 404 });
    }

    await prisma.mentorship.upsert({
      where: { mentorId_menteeId: { mentorId: mentor.id, menteeId: userId } },
      update: {},
      create: { mentorId: mentor.id, menteeId: userId },
    });

    return NextResponse.json({ success: true, mentorName: mentor.name });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to apply' }, { status: 500 });
  }
}
