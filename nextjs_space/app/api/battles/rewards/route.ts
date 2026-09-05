export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { BATTLE_TIERS } from '@/lib/money/battles/rewards';

export async function GET() {
  return NextResponse.json({
    success: true,
    tiers: BATTLE_TIERS,
    payoutStructure: {
      winnerPercentage: 70,
      runnerUpPercentage: 20,
      platformPercentage: 10,
    },
  });
}
