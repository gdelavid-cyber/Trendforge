import { NextResponse } from 'next/server';
import { swarmMemory } from '@/lib/swarm/revenue/memory';
import { SWARM_TEMPLATES } from '@/lib/swarm/revenue/templates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const templateIds = Object.keys(SWARM_TEMPLATES);
    const performances = await Promise.all(
      templateIds.map(id => swarmMemory.getTemplatePerformance(id))
    );

    return NextResponse.json({
      success: true,
      templates: performances.map(p => ({
        ...p,
        name: SWARM_TEMPLATES[p.templateId]?.name || p.templateId,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
