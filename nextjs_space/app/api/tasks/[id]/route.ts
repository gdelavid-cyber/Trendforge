export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { trend: true },
    });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}
