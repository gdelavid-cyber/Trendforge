import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logExecutionEvent } from '@/lib/execution/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const messages = await prisma.leadMessage.findMany({
      where: { leadId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'user';
    const leadId = params.id;

    const body = await req.json();
    const { content, direction = 'OUTBOUND', channel = 'email' } = body;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const message = await prisma.leadMessage.create({
      data: {
        leadId,
        direction: direction as any,
        channel,
        content,
        sentBy: direction === 'OUTBOUND' ? userId : (lead.buyerName || 'Buyer'),
      },
    });

    // Update lead's last response timestamp if inbound
    if (direction === 'INBOUND') {
      await prisma.lead.update({
        where: { id: leadId },
        data: { lastResponseAt: new Date(), status: 'RESPONDED' },
      });
    }

    await logExecutionEvent({
      taskId: lead.taskId,
      logType: direction === 'OUTBOUND' ? 'outreach_sent' : 'buyer_response',
      actor: direction === 'OUTBOUND' ? 'user' : 'buyer',
      actorId: userId,
      actionDescription: `${direction === 'OUTBOUND' ? 'Sent' : 'Received'} conversation message with ${lead.buyerName}.`,
      inputs: { leadId, direction },
      outputs: { messageId: message.id },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
