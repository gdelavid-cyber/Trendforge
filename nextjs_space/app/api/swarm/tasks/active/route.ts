import { NextResponse } from 'next/server';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await swarmMemory.getActiveTasks();
    return NextResponse.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
