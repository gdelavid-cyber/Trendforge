import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const execution = await db.trendExecution.findUnique({
      where: { id: params.id },
      include: {
        trend: { select: { id: true, name: true, category: true } },
      },
    });
    if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 });

    const leads = await db.buyerLead.findMany({
      where: { executionId: params.id },
      orderBy: [{ intentScore: 'desc' }, { discoveredAt: 'desc' }],
    });

    const queries = await db.discoveryQuery.findMany({
      where: { executionId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      leads,
      queries,
      trend: execution.trend,
      revenueKit: execution.revenueKit,
    });
  } catch (error: any) {
    console.error('[Buyers GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch buyers' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { leadId, status, savedToShortlist, userNotes, outcome } = body;

    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

    const updated = await db.buyerLead.update({
      where: { id: leadId },
      data: {
        ...(status ? { status } : {}),
        ...(typeof savedToShortlist === 'boolean' ? { savedToShortlist } : {}),
        ...(userNotes !== undefined ? { userNotes } : {}),
        ...(outcome !== undefined ? { outcome } : {}),
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('[Buyers PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}
