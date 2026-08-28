import { NextResponse } from 'next/server';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = await swarmMemory.getAllAgents();
    return NextResponse.json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
