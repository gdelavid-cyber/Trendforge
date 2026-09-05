import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { swarmCoordinator } from '@/lib/swarm/revenue/coordinator';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await prisma.swarmBrainState.upsert({
      where: { id: 'global' },
      create: { id: 'global', isRunning: true, isPaused: false },
      update: { isRunning: true, isPaused: false },
    });
    await swarmCoordinator.ensureAgentWorkforce();

    return NextResponse.json({
      success: true,
      message: 'Autonomous Revenue Swarm started successfully',
      isRunning: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
