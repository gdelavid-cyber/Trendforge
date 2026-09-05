import { prisma } from '@/lib/db';
import { analyzeBuyerEngagement } from './analyzer';
import { isOptOutMessage, enforcePriceFloor, logComplianceEvent, prependAiDisclosure } from './compliance';
import { broadcastCopilotEvent } from './realtime';
import type { TranscriptMessage } from './types';

export interface AutoCloseResult {
  actionTaken: 'OPT_OUT' | 'ESCALATED' | 'PAYMENT_LINK_SENT' | 'AUTO_REPLIED';
  replyContent?: string;
  paymentLink?: string;
}

const AGREEMENT_REGEX = /\b(send invoice|send link|let's do it|sounds good|deal|ready to buy|sign me up|how do i pay|where do i pay)\b/i;
const ESCALATION_REGEX = /\b(custom contract|nda|master services agreement|msa|legal review|sla|refund policy|indemnification)\b/i;

export async function processAutoCloseTurn(sessionId: string, buyerMessage: string): Promise<AutoCloseResult> {
  const session = await prisma.coPilotSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { lead: true, user: true },
  });

  const existingTranscript = ((session.transcript as any) || []) as TranscriptMessage[];

  // 1. Opt-out enforcement
  if (isOptOutMessage(buyerMessage)) {
    const updated = await prisma.coPilotSession.update({
      where: { id: sessionId },
      data: {
        status: 'opted_out',
        transcript: [
          ...existingTranscript,
          {
            id: `msg-${Date.now()}-buyer`,
            role: 'buyer',
            content: buyerMessage,
            channel: session.channel,
            timestamp: new Date().toISOString(),
          },
        ] as any,
      },
    });

    logComplianceEvent(session.userId, session.id, 'OPT_OUT', { buyerMessage });

    broadcastCopilotEvent({
      type: 'SESSION_UPDATED',
      sessionId: session.id,
      userId: session.userId,
      payload: { status: 'opted_out', reason: 'Prospect requested opt-out' },
      timestamp: new Date().toISOString(),
    });

    return { actionTaken: 'OPT_OUT' };
  }

  // 2. Escalation enforcement
  if (ESCALATION_REGEX.test(buyerMessage)) {
    const escalationReply = "Thank you for the inquiry. Because this involves specific legal or custom terms, I've flagged this directly for our senior specialist to review and follow up with you shortly.";
    
    await prisma.coPilotSession.update({
      where: { id: sessionId },
      data: {
        status: 'escalated',
        transcript: [
          ...existingTranscript,
          {
            id: `msg-${Date.now()}-buyer`,
            role: 'buyer',
            content: buyerMessage,
            channel: session.channel,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-${Date.now()}-ai`,
            role: 'ai',
            content: escalationReply,
            channel: session.channel,
            timestamp: new Date().toISOString(),
          },
        ] as any,
      },
    });

    logComplianceEvent(session.userId, session.id, 'ESCALATION', { buyerMessage });

    broadcastCopilotEvent({
      type: 'COPILOT_ALERT',
      sessionId: session.id,
      userId: session.userId,
      payload: {
        status: 'escalated',
        alert: 'Prospect requested custom contract / legal terms. Human takeover required.',
        buyerMessage,
      },
      timestamp: new Date().toISOString(),
    });

    return { actionTaken: 'ESCALATED', replyContent: escalationReply };
  }

  // 3. Agreement reached -> Generate & send Stripe link
  if (AGREEMENT_REGEX.test(buyerMessage)) {
    const targetPrice = Math.max(session.priceFloor, session.priceOffer || session.priceFloor || 450);
    const paymentUrl = `https://buy.stripe.com/test_trendly_${session.id}_${Math.round(targetPrice)}`;

    // Create payment link record
    await prisma.paymentLinkSale.create({
      data: {
        sessionId: session.id,
        stripeLinkId: `link_${session.id}`,
        url: paymentUrl,
        amount: targetPrice,
        status: 'pending',
      },
    });

    const closeReply = `Outstanding! You can secure the package and launch immediate setup using the direct Stripe payment link below:\n\n${paymentUrl}\n\nOnce completed, our technical deployment team will begin setup immediately.`;

    await prisma.coPilotSession.update({
      where: { id: sessionId },
      data: {
        status: 'in_progress',
        transcript: [
          ...existingTranscript,
          {
            id: `msg-${Date.now()}-buyer`,
            role: 'buyer',
            content: buyerMessage,
            channel: session.channel,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-${Date.now()}-ai`,
            role: 'ai',
            content: closeReply,
            channel: session.channel,
            timestamp: new Date().toISOString(),
          },
        ] as any,
      },
    });

    broadcastCopilotEvent({
      type: 'SESSION_UPDATED',
      sessionId: session.id,
      userId: session.userId,
      payload: { status: 'in_progress', paymentUrl, targetPrice },
      timestamp: new Date().toISOString(),
    });

    return { actionTaken: 'PAYMENT_LINK_SENT', replyContent: closeReply, paymentLink: paymentUrl };
  }

  // 4. Autonomous negotiation turn
  const analysis = await analyzeBuyerEngagement({
    buyerMessage,
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

  const isFirstAiMessage = !existingTranscript.some((m) => m.role === 'ai');
  let finalReply = analysis.suggestedReply;
  if (isFirstAiMessage) {
    finalReply = prependAiDisclosure(finalReply);
  }

  const { safeContent } = enforcePriceFloor(finalReply, session.priceFloor);

  await prisma.coPilotSession.update({
    where: { id: sessionId },
    data: {
      status: 'engaged',
      transcript: [
        ...existingTranscript,
        {
          id: `msg-${Date.now()}-buyer`,
          role: 'buyer',
          content: buyerMessage,
          channel: session.channel,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-${Date.now()}-ai`,
          role: 'ai',
          content: safeContent,
          channel: session.channel,
          timestamp: new Date().toISOString(),
        },
      ] as any,
    },
  });

  broadcastCopilotEvent({
    type: 'SESSION_UPDATED',
    sessionId: session.id,
    userId: session.userId,
    payload: { status: 'engaged', replySent: safeContent, analysis },
    timestamp: new Date().toISOString(),
  });

  return { actionTaken: 'AUTO_REPLIED', replyContent: safeContent };
}
