export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { transferFunds, SettlementError } from '@/lib/money/settlement';
import { loadMergedCatalog } from '@/lib/experience/cosmetics/server-catalog';

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
    const { action, listingId, agentId, cosmeticId, price, itemType, payFromAgentId } = body;

    // A. Action: Buy an Item (Agent or Cosmetic) with real LedgerEntry settlement
    if (action === 'BUY') {
      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        include: { agent: true, cosmetic: true, seller: true },
      });

      if (!listing || listing.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Listing is no longer active.', code: 'LISTING_NOT_ACTIVE' },
          { status: 409 }
        );
      }

      if (listing.sellerId === user.id) {
        return NextResponse.json(
          { error: 'Cannot buy your own listing.', code: 'SELF_PURCHASE' },
          { status: 400 }
        );
      }

      // Resolve buyer settlement agent
      const buyerAgents = await prisma.web4Agent.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        orderBy: [{ walletBalance: 'desc' }, { createdAt: 'asc' }],
      });

      if (buyerAgents.length === 0) {
        return NextResponse.json(
          {
            error: 'No active agent found to fund this purchase. Deploy or fund an agent first.',
            code: 'NO_BUYER_AGENT',
          },
          { status: 400 }
        );
      }

      const buyerAgent = payFromAgentId
        ? buyerAgents.find((a) => a.id === payFromAgentId)
        : buyerAgents.find((a) => a.walletBalance >= listing.price) || buyerAgents[0];

      if (!buyerAgent) {
        return NextResponse.json(
          { error: `Specified payment agent ${payFromAgentId} not found.`, code: 'INVALID_BUYER_AGENT' },
          { status: 400 }
        );
      }

      if (buyerAgent.walletBalance < listing.price) {
        return NextResponse.json(
          {
            error: `Insufficient funds in agent "${buyerAgent.name}" ($${buyerAgent.walletBalance.toFixed(2)} available, $${listing.price.toFixed(2)} required).`,
            code: 'INSUFFICIENT_FUNDS',
            available: buyerAgent.walletBalance,
            required: listing.price,
            buyerAgentId: buyerAgent.id,
          },
          { status: 400 }
        );
      }

      // Resolve seller receiving agent
      let sellerAgent = await prisma.web4Agent.findFirst({
        where: {
          userId: listing.sellerId,
          status: 'ACTIVE',
          ...(listing.agentId ? { id: { not: listing.agentId } } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      // If seller has no other active agent (e.g. selling their only agent), create a recipient wallet
      if (!sellerAgent) {
        const sellerUser = listing.seller;
        sellerAgent = await prisma.web4Agent.create({
          data: {
            userId: listing.sellerId,
            name: `${sellerUser?.name || 'Seller'} Reserve Vault`,
            archetype: 'GENERALIST',
            walletAddress: `SELLER_${listing.sellerId.slice(-6)}_${Date.now()}`,
            walletBalance: 0,
            skills: [],
            status: 'ACTIVE',
          },
        });
      }

      // Execute atomic purchase transaction
      const settlement = await prisma.$transaction(async (tx) => {
        // Confirm listing is still ACTIVE inside transaction
        const currentListing = await tx.marketplaceListing.findUnique({
          where: { id: listing.id },
        });

        if (!currentListing || currentListing.status !== 'ACTIVE') {
          throw new SettlementError('LISTING_NOT_ACTIVE' as any, 'Listing is no longer active.');
        }

        // 1. Settle funds atomically between buyer, seller, and platform treasury
        const result = await transferFunds(tx, {
          fromAgentId: buyerAgent.id,
          toAgentId: sellerAgent!.id,
          amountUsdc: listing.price,
          type: 'MARKETPLACE',
          ref: listing.id,
          note: `Marketplace purchase of ${listing.itemType} "${listing.agent?.name || listing.cosmetic?.name || listing.id}"`,
          rakePercent: 0.10, // 10% platform commission
        });

        // 2. Transfer agent ownership if listing is an agent
        if (listing.agentId) {
          await tx.web4Agent.update({
            where: { id: listing.agentId },
            data: { userId: user.id },
          });
        }

        // 3. Grant cosmetic and record cosmetic transaction if cosmetic listing
        if (listing.cosmeticId) {
          await tx.userCosmetic.upsert({
            where: {
              userId_cosmeticId: {
                userId: user.id,
                cosmeticId: listing.cosmeticId,
              },
            },
            create: {
              userId: user.id,
              cosmeticId: listing.cosmeticId,
              unlockedVia: 'MARKETPLACE_BUY',
            },
            update: {},
          });

          await tx.cosmeticTransaction.create({
            data: {
              buyerId: user.id,
              sellerId: listing.sellerId,
              cosmeticId: listing.cosmeticId,
              amount: listing.price,
              currency: 'USDC',
              status: 'COMPLETED',
            },
          });
        }

        // 4. Mark listing as SOLD
        const updatedListing = await tx.marketplaceListing.update({
          where: { id: listing.id },
          data: { status: 'SOLD' },
        });

        return { result, updatedListing };
      });

      return NextResponse.json({
        success: true,
        message: `Successfully acquired ${listing.agent?.name || listing.cosmetic?.name || 'item'}!`,
        commissionPaid: settlement.result.rakeAmount,
        sellerPayout: settlement.result.sellerPayout,
        buyerAgentId: buyerAgent.id,
        buyerNewBalance: settlement.result.fromAgentBalance,
        listing: settlement.updatedListing,
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
    if (error instanceof SettlementError) {
      const statusCode = error.code === 'INSUFFICIENT_FUNDS' ? 400 : error.code === 'LISTING_NOT_ACTIVE' ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
    }
    return NextResponse.json({ error: error.message || 'Marketplace action failed' }, { status: 500 });
  }
}
