import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await prisma.swarmBrainState.update({
      where: { id: 'global' },
      data: { isPaused: true },
    });
    return NextResponse.json({
      success: true,
      message: 'Autonomous Revenue Swarm paused (in-flight tasks will complete, new tasks paused)',
      isPaused: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
