import { NextResponse } from 'next/server';
import { swarmCoordinator } from '@/lib/swarm/revenue/coordinator';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await swarmCoordinator.executePulse();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Pulse execution failed:', err);
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: err?.message || 'Pulse execution failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
