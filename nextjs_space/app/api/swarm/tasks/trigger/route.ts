import { NextRequest, NextResponse } from 'next/server';
import { swarmMemory } from '@/lib/swarm/revenue/memory';
import { SWARM_TEMPLATES } from '@/lib/swarm/revenue/templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let templateId = 'faceless_video';
    let trendId: string | undefined;

    try {
      const body = await req.json();
      if (body.templateId && SWARM_TEMPLATES[body.templateId]) {
        templateId = body.templateId;
      }
      if (body.trendId) trendId = body.trendId;
    } catch {
      // Body may be empty
    }

    const template = SWARM_TEMPLATES[templateId];
    const task = await swarmMemory.createTask({
      templateId,
      trendId,
      costEstimate: template.estimatedCost.target,
    });

    return NextResponse.json({
      success: true,
      message: `Autonomous task ${task.id} created for template ${template.name}`,
      task,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
