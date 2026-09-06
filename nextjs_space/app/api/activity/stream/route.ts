export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const accept = req.headers.get('accept') || '';
  const where: any = taskId ? { taskId } : {};
  const logs = await prisma.executionLog.findMany({ where, orderBy: { timestamp: 'desc' }, take: 20 });
  const entries = logs.map((l) => ({ id: l.id, kind: l.logType, taskId: l.taskId, text: l.actionDescription, timestamp: l.timestamp.toISOString(), hash: l.hash }));
  if (accept.includes('text/event-stream')) {
    const body = `data: ${JSON.stringify({ entries })}\n\n`;
    return new NextResponse(body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
  }
  return NextResponse.json({ success: true, entries });
}
