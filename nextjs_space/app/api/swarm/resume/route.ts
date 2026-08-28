import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await prisma.swarmBrainState.update({
      where: { id: 'global' },
      data: { isPaused: false, isRunning: true },
    });
    return NextResponse.json({
      success: true,
      message: 'Autonomous Revenue Swarm resumed',
      isPaused: false,
      isRunning: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
