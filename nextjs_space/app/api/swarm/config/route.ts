import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configs = await prisma.botConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    return NextResponse.json({ success: true, config: configMap });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await swarmMemory.updateBotConfig(key, value);
    }
    return NextResponse.json({
      success: true,
      message: 'Swarm configurations updated',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
