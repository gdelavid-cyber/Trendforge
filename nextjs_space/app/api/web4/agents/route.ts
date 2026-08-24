export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateConwayWallet } from '@/lib/web4/wallet';
import { generateEIP8004Identity } from '@/lib/web4/eip8004';

export async function GET() {
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

  const agents = await prisma.web4Agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, agents });
}

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
    const { name, description, archetype, skills, avatarConfig } = body;

    const agentName = name || `Agent-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempId = `web4-${Date.now()}`;
    const wallet = generateConwayWallet(tempId);
    const identity = generateEIP8004Identity({
      agentId: tempId,
      creatorAddress: user.email,
      archetype: archetype || 'DATA_MINER',
      skillsDigest: JSON.stringify(skills || []),
      creationTimestamp: Date.now(),
    });

    const newAgent = await prisma.web4Agent.create({
      data: {
        userId: user.id,
        name: agentName,
        description: description || 'Autonomous Web4 Economic Agent',
        archetype: archetype || 'DATA_MINER',
        walletAddress: wallet.address,
        walletBalance: 0.0, // Dormant until funded — see LedgerEntry / deposit flow
        status: 'DORMANT',
        skills: Array.isArray(skills) && skills.length > 0 ? skills : [
          { skillId: 'scrape_reddit_painpoints', params: { subreddit: 'SaaS' } },
          { skillId: 'nextjs_microsaas_builder', params: { niche: 'SaaS' } },
        ],
        avatarConfig: avatarConfig || {
          baseModel: 'CYBER_HUMANOID',
          skin: 'NEON_CYAN',
          accessory: 'HOLOGRAPHIC_VISOR',
          aura: 'PLASMA_FIRE',
          animation: 'HOVER_IDLE',
        },
        eip8004Hash: identity.identityHash,
        survivalScore: 85,
      },
    });

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create Web4 agent' }, { status: 500 });
  }
}
