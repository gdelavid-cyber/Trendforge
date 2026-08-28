import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        task: true,
        messages: { orderBy: { timestamp: 'asc' } },
        sales: true,
      },
    });

    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const body = await req.json();
    const { status, notes, statedBudgetCents } = body;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        statedBudgetCents: statedBudgetCents !== undefined ? statedBudgetCents : undefined,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
