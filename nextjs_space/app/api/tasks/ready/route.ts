import { NextResponse } from 'next/server';
import { getReadyTasks } from '@/lib/tasks/ready';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await getReadyTasks(40);
    return NextResponse.json({ success: true, count: tasks.length, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
