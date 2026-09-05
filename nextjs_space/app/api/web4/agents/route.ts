export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { generateConwayWallet } from '@/lib/money/wallet';
import { generateEIP8004Identity } from '@/lib/core/eip8004';

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

    const existingCount = await prisma.web4Agent.count({ where: { userId: user.id } });
    const isGenesis = existingCount === 0;
    const tokenSerial = Math.floor(1000 + Math.random() * 9000);
    const nftTokenId = isGenesis ? '#0001-GENESIS' : `#${tokenSerial}-NFT`;

    const newAgent = await prisma.web4Agent.create({
      data: {
        userId: user.id,
        name: agentName,
        description: description || 'Autonomous Web4 AI NFT Economic Agent',
        archetype: archetype || 'DATA_MINER',
        walletAddress: wallet.address,
        walletBalance: 0.0, // Dormant until funded
        status: 'DORMANT',
        skills: Array.isArray(skills) && skills.length > 0 ? skills : [
          { skillId: 'scrape_reddit_painpoints', params: { subreddit: 'SaaS' } },
          { skillId: 'nextjs_microsaas_builder', params: { niche: 'SaaS' } },
        ],
        avatarConfig: avatarConfig || {
          baseModel: archetype === 'DEFI_ARBITRAGEUR' ? 'QUANTUM_ANDROID' : archetype === 'SAAS_ARCHITECT' ? 'WALL_STREET_TITAN' : archetype === 'VIRAL_CREATOR' ? 'COSMIC_ENTITY' : 'CYBER_HUMANOID',
          skin: 'NEON_CYAN',
          accessory: 'HOLOGRAPHIC_VISOR',
          aura: 'PLASMA_FIRE',
          animation: 'HOVER_IDLE',
          nftTokenId,
          isGenesis,
        },
        eip8004Hash: identity.identityHash,
        survivalScore: 90,
      },
    });

    return NextResponse.json({
      success: true,
      agent: newAgent,
      nft: {
        tokenId: nftTokenId,
        isGenesis,
        standard: 'EIP-8004 Autonomous NFT',
        mintTx: `tx_mint_${tokenSerial}_${Date.now().toString(36)}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create Web4 agent' }, { status: 500 });
  }
}
