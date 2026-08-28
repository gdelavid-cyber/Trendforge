import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { persistScrapedLeads } from '@/lib/sales/leads-scraper';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    let leads = await prisma.lead.findMany({
      where: { taskId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
      orderBy: { compositeScore: 'desc' },
    });

    if (leads.length === 0) {
      leads = (await persistScrapedLeads(taskId)) as any;
    }

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
