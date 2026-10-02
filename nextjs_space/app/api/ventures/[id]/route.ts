export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getVentureDetails, transitionVentureState } from '@/lib/venture/engine';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const venture = await getVentureDetails(id);

    if (!venture) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, venture });
  } catch (error: any) {
    console.error('[API_VENTURE_ID_GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if this is a lifecycle transition request
    if (body.action === 'transition') {
      const { toState, actor = 'USER', reason = 'Manual transition via API', evidence } = body;
      if (!toState) {
        return NextResponse.json({ error: 'Missing toState for transition action' }, { status: 400 });
      }

      const updated = await transitionVentureState({
        ventureId: id,
        toState,
        actor,
        reason,
        evidence,
      });

      return NextResponse.json({ success: true, venture: updated });
    }

    // Otherwise, generic update
    const allowedFields = ['name', 'description', 'pricingModel', 'hypothesis', 'riskLevel', 'autonomyLevel'];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await prisma.venture.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, venture: updated });
  } catch (error: any) {
    console.error('[API_VENTURE_ID_PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update venture' }, { status: 500 });
  }
}
