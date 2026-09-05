import { NextRequest, NextResponse } from 'next/server';
import { verifyAndDeductCredits } from '@/lib/growth/credits/credit-manager';

interface CustomTask {
  id: string;
  userId: string;
  title: string;
  schedule: string;
  type: 'PRICE_MONITOR' | 'RESEARCH_SUMMARY' | 'REMINDER';
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
}

const customTasksStore: CustomTask[] = [
  {
    id: 'task-1',
    userId: 'default-user',
    title: 'Daily HVAC Contractor Trends Digest',
    schedule: 'Daily at 9:00 AM UTC',
    type: 'RESEARCH_SUMMARY',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, tasks: customTasksStore });
}

export async function POST(req: NextRequest) {
  try {
    const { title, schedule, type, userId = 'default-user' } = await req.json();

    if (!title) {
      return NextResponse.json({ ok: false, error: 'Task title required' }, { status: 400 });
    }

    // Deduct 5 credits for setting up background research/monitor task
    const creditResult = verifyAndDeductCredits(userId, 'TREND_SCOUT_QUERY', `Created background task: ${title}`);
    if (!creditResult.success) {
      return NextResponse.json({ ok: false, error: creditResult.error }, { status: 402 });
    }

    const newTask: CustomTask = {
      id: `task-${Date.now()}`,
      userId,
      title,
      schedule: schedule || 'Daily at 8:00 AM',
      type: type || 'RESEARCH_SUMMARY',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    customTasksStore.unshift(newTask);

    return NextResponse.json({
      ok: true,
      task: newTask,
      remainingBalance: creditResult.remainingBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}