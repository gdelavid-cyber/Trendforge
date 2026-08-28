import { NextResponse } from 'next/server';
import { masterBrain } from '@/lib/swarm/revenue/masterBrain';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const decisions = await masterBrain.runStrategicCycle();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      decisions,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
