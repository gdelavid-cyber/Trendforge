import { NextResponse } from 'next/server';
import { harvestLiveSignalsAndTasks } from '@/lib/pipeline/live-scrapling';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await harvestLiveSignalsAndTasks();
    return NextResponse.json({
      success: true,
      message: `Harvested ${result.signalsHarvested} signals, generated ${result.tasksCreated} fresh tasks.`,
      ...result,
    });
  } catch (error: any) {
    console.error('[API /api/tasks/scrape-fresh] Error:', error);
    return NextResponse.json({ error: error.message || 'Scrape failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
