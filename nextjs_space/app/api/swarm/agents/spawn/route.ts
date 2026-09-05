import { NextRequest, NextResponse } from 'next/server';
import { swarmMemory, AgentRole } from '@/lib/swarm/revenue/memory';
import { ModelTierKey } from '@/lib/intelligence/openrouter/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.role || 'DISCOVERER') as AgentRole;
    const modelTier = (body.modelTier || 'discovery') as ModelTierKey;
    const config = body.config || {};

    const agent = await swarmMemory.spawnAgent(role, modelTier, config);

    return NextResponse.json({
      success: true,
      message: `Agent ${agent.id} spawned successfully`,
      agent,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
