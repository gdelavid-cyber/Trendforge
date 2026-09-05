import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    let agent = null;
    if (agentId) {
      agent = await prisma.web4Agent.findUnique({
        where: { id: agentId },
      });
    }

    const cosmetics = await prisma.cosmetic.findMany({
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    return NextResponse.json({
      success: true,
      agent,
      cosmetics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch avatar config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { agentId, avatarConfig, personality, voiceId, emotionsEnabled, ttsEnabled, sttEnabled } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const updated = await prisma.web4Agent.update({
      where: { id: agentId },
      data: {
        ...(avatarConfig !== undefined && { avatarConfig }),
        ...(personality !== undefined && { personality }),
        ...(voiceId !== undefined && { voiceId }),
        ...(emotionsEnabled !== undefined && { emotionsEnabled }),
        ...(ttsEnabled !== undefined && { ttsEnabled }),
        ...(sttEnabled !== undefined && { sttEnabled }),
      },
    });

    return NextResponse.json({
      success: true,
      agent: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save avatar configuration' }, { status: 500 });
  }
}
