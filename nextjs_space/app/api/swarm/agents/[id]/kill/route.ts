import { NextRequest, NextResponse } from 'next/server';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let reason = 'Manually terminated by Admin via Swarm Command Center';
    try {
      const body = await req.json();
      if (body.reason) reason = body.reason;
    } catch {
      // Body may be empty
    }

    await swarmMemory.killAgent(params.id, reason);

    return NextResponse.json({
      success: true,
      message: `Agent ${params.id} has been terminated`,
      agentId: params.id,
      reason,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
