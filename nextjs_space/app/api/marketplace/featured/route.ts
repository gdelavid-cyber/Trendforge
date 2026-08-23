export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateAgentRank } from '@/lib/marketplace/ranking';

export async function GET() {
  try {
    // Fetch top 5 curated featured listings
    const featured = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        agent: true,
        cosmetic: true,
        seller: { select: { name: true, email: true } },
      },
      take: 5,
      orderBy: { price: 'desc' },
    });

    return NextResponse.json({ success: true, featured });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch featured listings' }, { status: 500 });
  }
}
