export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const DEFAULT_COSMETICS = [
  // SKINS
  { name: 'Neon Cyberpunk Operative', category: 'SKIN', rarity: 'RARE', previewUrl: '🥷', price: 15, unlockMethod: 'QUEST' },
  { name: 'Quantum Void Android', category: 'SKIN', rarity: 'EPIC', previewUrl: '🤖', price: 30, unlockMethod: 'BATTLEPASS' },
  { name: 'Gold-Plated Wall Street Titan', category: 'SKIN', rarity: 'LEGENDARY', previewUrl: '👑', price: 75, unlockMethod: 'MARKETPLACE' },
  { name: 'Cosmic Nebula Entity', category: 'SKIN', rarity: 'MYTHIC', previewUrl: '🌌', price: 150, unlockMethod: 'SEASONAL_DROP' },
  { name: 'Matte Stealth Hacker', category: 'SKIN', rarity: 'COMMON', previewUrl: '🕶️', price: 0, unlockMethod: 'INVENTORY_GENESIS' },

  // ACCESSORIES
  { name: 'Holographic Tactical Visor', category: 'ACCESSORY', rarity: 'RARE', previewUrl: '🥽', price: 10, unlockMethod: 'FREE_QUEST' },
  { name: 'Quantum Overclock Wings', category: 'ACCESSORY', rarity: 'EPIC', previewUrl: '🪽', price: 25, unlockMethod: 'BATTLEPASS' },
  { name: 'Solana Diamond Crown', category: 'ACCESSORY', rarity: 'LEGENDARY', previewUrl: '💎', price: 50, unlockMethod: 'MARKETPLACE' },
  { name: 'Cyber Katana Blade', category: 'ACCESSORY', rarity: 'RARE', previewUrl: '⚔️', price: 20, unlockMethod: 'QUEST' },

  // PARTICLE EFFECTS
  { name: 'Plasma Fire Aura', category: 'EFFECT', rarity: 'EPIC', previewUrl: '🔥', price: 35, unlockMethod: 'BATTLEPASS' },
  { name: 'Matrix Digital Rain Glitch', category: 'EFFECT', rarity: 'LEGENDARY', previewUrl: '⚡', price: 60, unlockMethod: 'MARKETPLACE' },
  { name: 'Golden Wealth Sparkles', category: 'EFFECT', rarity: 'RARE', previewUrl: '✨', price: 15, unlockMethod: 'QUEST' },
  { name: 'Hologram Scan Beam', category: 'EFFECT', rarity: 'COMMON', previewUrl: '💫', price: 0, unlockMethod: 'INVENTORY_GENESIS' },

  // ANIMATIONS
  { name: 'Hover Levitation Idle', category: 'ANIMATION', rarity: 'RARE', previewUrl: '🧘', price: 12, unlockMethod: 'FREE_QUEST' },
  { name: 'Profit Rain Celebration', category: 'ANIMATION', rarity: 'EPIC', previewUrl: '🤑', price: 28, unlockMethod: 'BATTLEPASS' },
  { name: 'Cyber Combat Stance', category: 'ANIMATION', rarity: 'COMMON', previewUrl: '🥋', price: 0, unlockMethod: 'INVENTORY_GENESIS' },
];

export async function GET() {
  // Ensure default cosmetics are in database
  const count = await prisma.cosmetic.count();
  if (count === 0) {
    for (const item of DEFAULT_COSMETICS) {
      await prisma.cosmetic.create({
        data: {
          name: item.name,
          category: item.category as any,
          rarity: item.rarity as any,
          previewUrl: item.previewUrl,
          thumbnailUrl: item.previewUrl,
          price: item.price,
          unlockMethod: item.unlockMethod,
        },
      });
    }
  }

  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: { price: 'asc' },
  });

  return NextResponse.json({ success: true, cosmetics });
}

// Equip Avatar Configuration to an Agent
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, avatarConfig } = body;

    if (!agentId || !avatarConfig) {
      return NextResponse.json({ error: 'Missing agentId or avatarConfig' }, { status: 400 });
    }

    const updated = await prisma.web4Agent.update({
      where: { id: agentId },
      data: { avatarConfig },
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to equip avatar' }, { status: 500 });
  }
}
