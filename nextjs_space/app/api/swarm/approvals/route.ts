import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { swarmMemory } from '@/lib/swarm/revenue/memory';

export async function GET() {
  try {
    const pendingOutreach = await swarmMemory.getPendingOutreachApprovals();
    const highTicketTasks = await prisma.swarmTask.findMany({
      where: {
        salePrice: { gte: 200 },
        state: 'CLOSING',
      },
    });

    return NextResponse.json({
      pendingOutreach,
      highTicketTasks,
      totalPending: pendingOutreach.length + highTicketTasks.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, approved } = body;

    if (action === 'APPROVE_OUTREACH' && id) {
      if (approved) {
        await swarmMemory.approveOutreach(id);
      } else {
        await prisma.outreachRecord.update({
          where: { id },
          data: { status: 'IGNORED' },
        });
      }
      return NextResponse.json({ success: true, message: `Outreach record ${approved ? 'approved & sent' : 'rejected'}` });
    }

    if (action === 'APPROVE_HIGH_TICKET_SALE' && id) {
      await prisma.swarmTask.update({
        where: { id },
        data: { state: 'DELIVERY', phase: 'DELIVERY' },
      });
      return NextResponse.json({ success: true, message: 'High-ticket sale closing approved' });
    }

    return NextResponse.json({ error: 'Unknown approval action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
