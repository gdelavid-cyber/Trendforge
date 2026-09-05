export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { analyzeBuyerEngagement } from '@/lib/copilot/analyzer';
import { processAutoCloseTurn } from '@/lib/copilot/auto-closer';
import { isOptOutMessage, logComplianceEvent } from '@/lib/copilot/compliance';
import { broadcastCopilotEvent } from '@/lib/copilot/realtime';
import type { TranscriptMessage } from '@/lib/copilot/types';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, fromEmail, text, body: emailBody, message } = body;

    const incomingText = text || emailBody || message || '';
    if (!incomingText.trim()) {
      return NextResponse.json({ error: 'Missing email content' }, { status: 400 });
    }

    // Locate matching session: by ID or by lead buyerEmail
    let session = null;
    if (sessionId) {
      session = await prisma.coPilotSession.findUnique({
        where: { id: sessionId },
        include: { lead: true },
      });
    } else if (fromEmail) {
      session = await prisma.coPilotSession.findFirst({
        where: {
          status: { in: ['waiting', 'engaged', 'in_progress'] },
          lead: { buyerEmail: fromEmail },
        },
        include: { lead: true },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session found for email' }, { status: 404 });
    }

    const existingTranscript = ((session.transcript as any) || []) as TranscriptMessage[];

    // 1. Check for opt-out immediately
    if (isOptOutMessage(incomingText)) {
      await prisma.coPilotSession.update({
        where: { id: session.id },
        data: {
          status: 'opted_out',
          transcript: [
            ...existingTranscript,
            {
              id: `msg-${Date.now()}-buyer`,
              role: 'buyer',
              content: incomingText,
              channel: 'email',
              timestamp: new Date().toISOString(),
            },
          ] as any,
        },
      });

      logComplianceEvent(session.userId, session.id, 'OPT_OUT', { incomingText, fromEmail });

      broadcastCopilotEvent({
        type: 'SESSION_UPDATED',
        sessionId: session.id,
        userId: session.userId,
        payload: { status: 'opted_out', alert: 'Prospect unsubscribed / opted out.' },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, status: 'opted_out' });
    }

    // 2. Mode Routing
    if (session.mode === 'auto_close') {
      const result = await processAutoCloseTurn(session.id, incomingText);
      return NextResponse.json({ success: true, mode: 'auto_close', result });
    }

    // 3. AI Co-Pilot Mode: Sub-3s analysis + alert broadcast (AI does NOT send automatically)
    const analysis = await analyzeBuyerEngagement({
      buyerMessage: incomingText,
      leadContext: {
        buyerName: session.lead.buyerName,
        requestText: session.lead.requestText,
        source: session.lead.source,
      },
      productContext: {
        priceOffer: session.priceOffer,
        priceFloor: session.priceFloor,
      },
      transcriptHistory: existingTranscript,
    });

    // Update transcript with buyer message
    await prisma.coPilotSession.update({
      where: { id: session.id },
      data: {
        status: 'engaged',
        alertCount: { increment: 1 },
        lastAlertAt: new Date(),
        transcript: [
          ...existingTranscript,
          {
            id: `msg-${Date.now()}-buyer`,
            role: 'buyer',
            content: incomingText,
            channel: 'email',
            timestamp: new Date().toISOString(),
          },
        ] as any,
      },
    });

    // Save suggested reply card
    const suggestion = await prisma.copilotSuggestion.create({
      data: {
        sessionId: session.id,
        triggerEvent: 'buyer_email_reply',
        buyerMessage: incomingText,
        aiAnalysis: analysis as any,
        suggestedReply: analysis.suggestedReply,
        used: false,
      },
    });

    // Broadcast live alert to user's dashboard
    broadcastCopilotEvent({
      type: 'SUGGESTION_READY',
      sessionId: session.id,
      userId: session.userId,
      payload: {
        suggestionId: suggestion.id,
        buyerMessage: incomingText,
        analysis,
        suggestedReply: analysis.suggestedReply,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      mode: 'co_pilot',
      suggestionId: suggestion.id,
      analysis,
    });
  } catch (error: any) {
    console.error('[CopilotEmailReply] Error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
