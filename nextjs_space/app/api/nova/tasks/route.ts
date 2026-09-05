import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { deductCreditsDb } from '@/lib/growth/credits/credit-manager';

const VALID_TYPES = ['PRICE_MONITOR', 'RESEARCH_SUMMARY', 'REMINDER'] as const;

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign in to view tasks.' }, { status: 401 });
  }
  const tasks = await prisma.novaCustomTask.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, tasks });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Sign in to create tasks.' }, { status: 401 });
    }

    const { title, schedule, type } = await req.json();
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ ok: false, error: 'Task title required' }, { status: 400 });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ ok: false, error: 'Unknown task type' }, { status: 400 });
    }

    const creditResult = await deductCreditsDb(user.id, 'TREND_SCOUT_QUERY', `Created background task: ${title.slice(0, 60)}`);
    if (!creditResult.success) {
      return NextResponse.json({ ok: false, error: creditResult.error }, { status: 402 });
    }

    const task = await prisma.novaCustomTask.create({
      data: {
        userId: user.id,
        title: title.slice(0, 200),
        schedule: typeof schedule === 'string' ? schedule.slice(0, 120) : 'Daily at 8:00 AM',
        taskType: type ?? 'RESEARCH_SUMMARY',
      },
    });

    return NextResponse.json({
      ok: true,
      task,
      remainingBalance: creditResult.remainingBalance,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the task.' }, { status: 500 });
  }
}
