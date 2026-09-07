export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const cursor = searchParams.get('cursor');
  const accept = req.headers.get('accept') || '';
  const where: any = taskId ? { taskId } : {};
  const logs = await prisma.executionLog.findMany({
    where,
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const entries = logs.map((l) => ({ id: l.id, kind: l.logType, taskId: l.taskId, text: l.actionDescription, timestamp: l.timestamp.toISOString(), hash: l.hash }));
  const nextCursor = logs.length > 0 ? logs[logs.length - 1].id : null;
  if (accept.includes('text/event-stream')) {
    const stream = new ReadableStream({
      start(c) {
        for (const e of entries) c.enqueue(`data: ${JSON.stringify(e)}\n\n`);
        c.enqueue(`event: cursor\ndata: ${JSON.stringify({ nextCursor })}\n\n`);
        c.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
  }
  return NextResponse.json({ success: true, entries, nextCursor });
}
