export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { getUserGrantStatus } from '@/lib/money/grants/micro-grant';

export async function GET() {
  try {
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

    const status = await getUserGrantStatus(user.id);
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch grant status' }, { status: 500 });
  }
}
