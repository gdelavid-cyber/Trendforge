export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { getOrCreatePrimary } from '@/lib/intelligence/companion/service';

// .trendly bundle v1 — an open, documented JSON manifest of everything the
// user owns. Binary ZIP packaging (GLB files inline) is planned; the schema
// is stable so early exports remain valid.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
    const companion = await getOrCreatePrimary(user.id);

    const owned = await prisma.userCosmetic.findMany({
      where: { userId: user.id },
      include: { cosmetic: { select: { id: true, name: true, category: true, rarity: true, modelUrl: true } } },
    });

    const bundle = {
      format: 'trendly',
      version: '1.0',
      companion: {
        id: companion.id,
        name: companion.name,
        baseModel: (companion.config as any)?.baseModel ?? 'cyber-humanoid',
        config: companion.config,
        personality: companion.personality,
        memory: companion.memory ?? { conversations: [], learnedPatterns: [] },
        skills: companion.skills,
      },
      cosmetics: owned.map((uc) => ({
        ...uc.cosmetic,
        equipped: uc.equipped,
        unlockedAt: uc.unlockedAt?.toISOString(),
        unlockedVia: uc.unlockedVia,
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        createdAt: companion.createdAt.toISOString(),
        level: companion.level,
        totalEarnings: companion.totalEarnings,
        tasksCompleted: companion.tasksCompleted,
        rarity: companion.rarity,
      },
      license: 'User retains full ownership of this data. The .trendly format is open and free.',
    };

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${companion.name.replace(/[^a-z0-9_-]/gi, '_')}.trendly.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
