import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { processAgentConversation } from '@/lib/intelligence/voice/brain';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { message, agentId, history } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Missing or empty message' }, { status: 400 });
    }

    const userId = session?.user?.id;
    const userContext = {
      name: session?.user?.name || undefined,
      role: (session?.user as any)?.role || 'FREE',
      email: session?.user?.email || undefined,
    };

    const result = await processAgentConversation({
      message: message.trim(),
      agentId,
      history,
      userId,
      userContext,
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      cleanText: result.cleanText,
      audioBase64: result.audioBase64,
      audioProvider: result.audioProvider,
      emotion: result.emotion,
      lipSync: result.lipSync,
      toolExecution: result.toolExecution,
      durationEstimate: result.durationEstimate,
    });
  } catch (error: any) {
    console.error('[API /api/agent/chat] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process conversation with agent brain' },
      { status: 500 }
    );
  }
}
