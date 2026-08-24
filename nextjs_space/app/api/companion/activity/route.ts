export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getOrCreatePrimary } from '@/lib/companion/service';

const LIMIT = 8;

// Activity feed: flattens the companion's recent work across all task runs
// into human-readable lines. Derived data — no new write path needed.

function verbFor(action?: string): string {
  switch (action) {
    case 'research': return 'researched for';
    case 'scrape': return 'scraped leads for';
    case 'draft': return 'drafted';
    case 'generate': return 'generated deliverables for';
    case 'analyze': return 'analyzed';
    case 'send': return 'prepared a send for';
    case 'deploy': return 'prepared a deploy for';
    case 'trade': return 'prepared a trade for';
    default: return 'worked on';
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const companion = await getOrCreatePrimary(user.id);

    const runs = await prisma.userTask.findMany({
      where: { userId: user.id },
      include: { task: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    type Event = { at: string; text: string; taskId: string };
    const events: Event[] = [];

    for (const run of runs) {
      const log = Array.isArray(run.stepResults) ? (run.stepResults as any[]) : [];
      for (let i = log.length - 1; i >= 0 && events.length < LIMIT * 2; i--) {
        const e = log[i];
        if (e.status === 'done') {
          events.push({
            at: e.at ?? new Date().toISOString(),
            text: `${verbFor(e.action)} "${run.task.title}" — ${String(e.title ?? '').slice(0, 80)}`,
            taskId: run.taskId,
          });
        } else if (e.status === 'approved_by_user') {
          events.push({
            at: e.at ?? new Date().toISOString(),
            text: `sent an approved action for "${run.task.title}"`,
            taskId: run.taskId,
          });
        }
      }
    }

    events.sort((a, b) => (a.at < b.at ? 1 : -1));

    return NextResponse.json({
      success: true,
      companionName: companion.name,
      activity: events.slice(0, LIMIT),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Activity lookup failed' }, { status: 500 });
  }
}
