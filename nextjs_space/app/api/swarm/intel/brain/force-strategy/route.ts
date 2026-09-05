import { NextResponse } from 'next/server';
import { masterBrain } from '@/lib/swarm/revenue/masterBrain';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const reviewResult = await masterBrain.conductStrategyReview();
    return NextResponse.json({
      success: true,
      message: 'Master Brain completed strategy review and updated strategy state',
      review: reviewResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
