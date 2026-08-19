export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const logs = await prisma.trendIngestionLog.findMany({ orderBy: { executedAt: 'desc' }, take: 50 });
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
