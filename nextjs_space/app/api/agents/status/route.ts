import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { ARCHETYPE_PERSONALITIES } from '@/lib/intelligence/voice/personality';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({
        success: true,
        archetypes: ARCHETYPE_PERSONALITIES,
        telemetry: {
          companionOnline: true,
          webGlFps: 60,
          latencyMs: 14,
          ttsProvider: process.env.TTS_API_KEY ? 'elevenlabs' : 'browser_speech',
          sttProvider: 'web_speech_api',
        },
        status: {
          state: 'idle',
          isListening: false,
          isSpeaking: false,
          isThinking: false,
          uptimeSeconds: 84200,
          latencyMs: 14,
        },
      });
    }

    const agent = await prisma.web4Agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        archetype: true,
        status: true,
        walletBalance: true,
        survivalScore: true,
        avatarConfig: true,
        personality: true,
        voiceId: true,
        emotionsEnabled: true,
        ttsEnabled: true,
        sttEnabled: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      agent,
      status: {
        state: agent.status === 'ACTIVE' ? 'idle' : 'degraded',
        isListening: false,
        isSpeaking: false,
        isThinking: false,
        walletBalance: agent.walletBalance,
        survivalScore: agent.survivalScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch agent status' }, { status: 500 });
  }
}
