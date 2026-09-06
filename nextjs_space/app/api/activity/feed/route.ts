export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
  const cursor = searchParams.get('cursor');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  let where: any;
  if (taskId) {
    where = { taskId };
  } else {
    const owned = await prisma.userTask.findMany({ where: { userId: user.id }, select: { taskId: true }, take: 200 });
    const ids = [...new Set(owned.map((o) => o.taskId))];
    if (ids.length === 0) return NextResponse.json({ success: true, entries: [], nextCursor: null });
    where = { taskId: { in: ids } };
  }
  const logs = await prisma.executionLog.findMany({
    where: cursor ? { ...where, timestamp: { lt: new Date(parseInt(cursor)) } } : where,
    orderBy: { timestamp: 'desc' },
    take: limit + 1,
  });
  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? String(items[items.length - 1].timestamp.getTime()) : null;
  return NextResponse.json({
    success: true,
    entries: items.map((l) => ({ id: l.id, kind: l.logType, taskId: l.taskId, text: l.actionDescription, timestamp: l.timestamp.toISOString(), hash: l.hash })),
    nextCursor,
  });
}
