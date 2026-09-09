import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await db.buyerLead.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json({ ok: true, lead: updated });
  } catch (error: any) {
    console.error('[API /api/leads/[id]] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}
