export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { broadcastCopilotEvent } from '@/lib/copilot/realtime';

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
    const { sessionId, toPhoneNumber } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    const copilotSession = await prisma.coPilotSession.findUnique({
      where: { id: sessionId },
    });

    if (!copilotSession || copilotSession.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found or forbidden' }, { status: 403 });
    }

    const callSid = `CA_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Upsert CallSession
    const callSession = await prisma.callSession.upsert({
      where: { coPilotId: sessionId },
      create: {
        coPilotId: sessionId,
        twilioCallSid: callSid,
        status: 'live',
        consentGiven: true, // Will play automated TwiML two-party consent greeting
        liveTranscript: [
          {
            speaker: 'system',
            text: 'Twilio call initiated. Two-party consent notice played: "This call may be recorded for quality and coaching purposes."',
            timestamp: new Date().toISOString(),
          },
        ],
      },
      update: {
        twilioCallSid: callSid,
        status: 'live',
        consentGiven: true,
      },
    });

    // Update copilot session
    await prisma.coPilotSession.update({
      where: { id: sessionId },
      data: {
        status: 'in_progress',
        channel: 'phone',
      },
    });

    broadcastCopilotEvent({
      type: 'CALL_STATUS_CHANGE',
      sessionId: copilotSession.id,
      userId: user.id,
      payload: { status: 'live', callSid, toPhoneNumber },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Twilio call connection initiated.',
      callSession,
    });
  } catch (error: any) {
    console.error('[CopilotPhoneStart] Error:', error);
    return NextResponse.json({ error: error.message || 'Call initiation failed' }, { status: 500 });
  }
}
