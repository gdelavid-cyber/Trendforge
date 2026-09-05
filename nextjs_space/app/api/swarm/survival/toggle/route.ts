import { NextRequest, NextResponse } from 'next/server';
import { masterBrain } from '@/lib/swarm/revenue/masterBrain';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let mode: boolean | undefined;
    try {
      const body = await req.json();
      if (typeof body.survivalMode === 'boolean') {
        mode = body.survivalMode;
      }
    } catch {
      // Body may be empty
    }

    const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
    const currentMode = brainState?.survivalMode ?? false;
    const targetMode = mode !== undefined ? mode : !currentMode;

    if (targetMode) {
      await masterBrain.enterSurvivalMode();
    } else {
      await masterBrain.exitSurvivalMode();
    }

    return NextResponse.json({
      success: true,
      survivalMode: targetMode,
      message: targetMode
        ? 'Swarm ENTERED Survival Mode: non-essential agents culled, 50% budget cap applied.'
        : 'Swarm EXITED Survival Mode: normal budget cap restored, multi-agent scaling enabled.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
