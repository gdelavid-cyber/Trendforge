export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { validateChannelMode, prependAiDisclosure } from '@/lib/copilot/compliance';
import type { CopilotChannel, CopilotMode } from '@/lib/copilot/types';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      executionId = 'default_exec',
      leadIds = [],
      leadId,
      channel = 'email',
      mode = 'co_pilot',
      offerPrice = 450,
      priceFloor = 250,
      productDescription = 'Turnkey AI Service / Automated Asset Package',
    } = body;

    const chosenMode = mode as CopilotMode;
    const chosenChannel = (channel || 'email') as CopilotChannel;

    // 1. Legal compliance check (Channel Legal Map)
    const validation = validateChannelMode(chosenChannel, chosenMode);
    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.error,
          code: validation.code,
        },
        { status: 400 }
      );
    }

    const targetLeadIds = Array.isArray(leadIds) && leadIds.length > 0 ? leadIds : leadId ? [leadId] : [];

    if (targetLeadIds.length === 0) {
      // Find or create a default lead for this execution if none specified
      let existingLead = await prisma.lead.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!existingLead) {
        // Find first task or fallback
        const task = await prisma.task.findFirst();
        if (!task) {
          return NextResponse.json({ error: 'No baseline task found' }, { status: 400 });
        }

        existingLead = await prisma.lead.create({
          data: {
            taskId: task.id,
            userId: user.id,
            source: chosenChannel,
            sourceUrl: 'https://trendly.io/leads',
            buyerName: 'Qualified Prospect',
            buyerEmail: 'prospect@target-domain.com',
            requestText: `Interested in ${productDescription}`,
            status: 'NEW',
          },
        });
      }
      targetLeadIds.push(existingLead.id);
    }

    const createdSessions = [];

    for (const lid of targetLeadIds) {
      const lead = await prisma.lead.findUnique({
        where: { id: lid },
      });

      if (!lead) continue;

      // Verify ownership if lead has userId assigned
      if (lead.userId && lead.userId !== user.id) {
        continue;
      }

      // Initial outreach message with mandatory AI disclosure for auto_close
      const initialContent = `Hello ${lead.buyerName || 'there'}, I noticed your team may need assistance with ${productDescription}. We prepare turnkey deployments that launch within 48 hours. Let me know if you would like to test our interactive demo line.`;

      const formattedContent = chosenMode === 'auto_close' ? prependAiDisclosure(initialContent) : initialContent;

      const newSession = await prisma.coPilotSession.create({
        data: {
          userId: user.id,
          executionId: String(executionId),
          leadId: lead.id,
          channel: chosenChannel,
          mode: chosenMode,
          status: chosenMode === 'manual' ? 'in_progress' : 'waiting',
          priceOffer: Number(offerPrice) || 450,
          priceFloor: Number(priceFloor) || 250,
          transcript: [
            {
              id: `msg-initial-${Date.now()}`,
              role: 'ai',
              content: formattedContent,
              channel: chosenChannel,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        include: {
          lead: true,
        },
      });

      createdSessions.push(newSession);
    }

    return NextResponse.json({
      success: true,
      message: `Sales Mode (${chosenMode.toUpperCase()}) activated across ${createdSessions.length} prospect session(s).`,
      sessions: createdSessions,
      activeSessionId: createdSessions[0]?.id,
    });
  } catch (error: any) {
    console.error('[ActivateSellMode] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to activate sell mode' }, { status: 500 });
  }
}
