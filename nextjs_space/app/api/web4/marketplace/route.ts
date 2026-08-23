export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import { loadMergedCatalog } from '@/lib/cosmetics/server-catalog';

export async function GET() {
  const [listings, catalog] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        agent: true,
        cosmetic: true,
        seller: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    loadMergedCatalog(),
  ]);

  return NextResponse.json({ success: true, listings, catalog });
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
    const { action, listingId, agentId, cosmeticId, price, itemType } = body;

    // A. Action: Buy or Hire an Item
    if (action === 'BUY') {
      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        include: { agent: true, cosmetic: true },
      });

      if (!listing || listing.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Listing is no longer active.' }, { status: 400 });
      }

      if (listing.sellerId === user.id) {
        return NextResponse.json({ error: 'Cannot buy your own listing.' }, { status: 400 });
      }

      const commission = +(listing.price * 0.10).toFixed(2); // 10% platform fee
      const sellerPayout = +(listing.price - commission).toFixed(2);

      // If buying an agent, transfer ownership
      if (listing.agentId) {
        await prisma.web4Agent.update({
          where: { id: listing.agentId },
          data: { userId: user.id },
        });
      }

      // Mark listing as SOLD
      const updatedListing = await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: { status: 'SOLD' },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully acquired ${listing.agent?.name || listing.cosmetic?.name}!`,
        commissionPaid: commission,
        sellerPayout,
        listing: updatedListing,
      });
    }

    // B. Action: Create New Listing
    const newListing = await prisma.marketplaceListing.create({
      data: {
        sellerId: user.id,
        agentId: agentId || null,
        cosmeticId: cosmeticId || null,
        price: Number(price) || 25.0,
        currency: 'USDC',
        itemType: itemType || 'AGENT',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, listing: newListing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Marketplace action failed' }, { status: 500 });
  }
}
