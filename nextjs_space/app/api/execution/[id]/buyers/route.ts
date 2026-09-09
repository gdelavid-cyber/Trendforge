import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [leads, execution] = await Promise.all([
      db.buyerLead.findMany({
        where: { executionId: params.id },
        orderBy: [{ intentScore: 'desc' }, { postedAt: 'desc' }],
        take: 100,
      }),
      db.trendExecution.findUnique({ where: { id: params.id }, select: { revenueKit: true } }),
    ]);

    // Extract pitch template from the kit's outreach stage
    const kit = execution?.revenueKit as any;
    const pitchTemplate =
      kit?.outreach?.sequences?.[0]?.steps?.[0]?.body ||
      kit?.sell_fork?.outreach_kit?.first_dm_template ||
      kit?.outreach?.cold_dm_template ||
      kit?.sell_fork?.outreach_kit?.follow_up_dm ||
      '';

    return NextResponse.json({
      leads: leads.map(l => ({
        ...l,
        postedAt: l.postedAt.toISOString(),
        discoveredAt: l.discoveredAt.toISOString(),
      })),
      pitchTemplate,
    });
  } catch (error: any) {
    console.error('[API /api/execution/[id]/buyers] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch buyers' }, { status: 500 });
  }
}
