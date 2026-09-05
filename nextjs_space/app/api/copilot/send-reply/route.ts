export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastCopilotEvent } from '@/lib/copilot/realtime';
import type { TranscriptMessage } from '@/lib/copilot/types';

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
    const { sessionId, suggestionId, replyContent, edited = false } = body;

    if (!sessionId || !replyContent) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const copilotSession = await prisma.coPilotSession.findUnique({
      where: { id: sessionId },
    });

    if (!copilotSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (copilotSession.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (copilotSession.status === 'opted_out') {
      return NextResponse.json(
        { error: 'Cannot send message: Prospect has opted out.' },
        { status: 400 }
      );
    }

    const existingTranscript = ((copilotSession.transcript as any) || []) as TranscriptMessage[];

    const newMessage: TranscriptMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: replyContent,
      channel: copilotSession.channel,
      timestamp: new Date().toISOString(),
      metadata: { edited, suggestionId },
    };

    // Update session transcript & mark in_progress
    const updated = await prisma.coPilotSession.update({
      where: { id: sessionId },
      data: {
        status: 'in_progress',
        transcript: [...existingTranscript, newMessage] as any,
      },
    });

    // Mark suggestion as used if linked
    if (suggestionId) {
      await prisma.copilotSuggestion.update({
        where: { id: suggestionId },
        data: {
          used: true,
          editedVersion: edited ? replyContent : null,
        },
      });
    }

    // Broadcast session update
    broadcastCopilotEvent({
      type: 'SESSION_UPDATED',
      sessionId: copilotSession.id,
      userId: user.id,
      payload: {
        status: 'in_progress',
        sentMessage: newMessage,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Reply authorized and dispatched successfully.',
      session: updated,
    });
  } catch (error: any) {
    console.error('[CopilotSendReply] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reply' }, { status: 500 });
  }
}
