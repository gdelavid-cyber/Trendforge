export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import { getTreasuryAgent } from '@/lib/web4/treasury';
import { SettlementError } from '@/lib/web4/settlement';

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
    const { itemId, payFromAgentId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId parameter' }, { status: 400 });
    }

    // 1. Locate catalog item
    const item = COSMETICS_CATALOG.find((c) => c.id === itemId);
    if (!item) {
      return NextResponse.json({ error: `Cosmetic item "${itemId}" not found in catalog` }, { status: 404 });
    }

    // 2. Check if already owned
    // Check if the cosmetic exists in DB to associate with UserCosmetic
    let dbCosmetic = await prisma.cosmetic.findUnique({
      where: { id: item.id },
    });

    if (!dbCosmetic) {
      // Lazily mirror catalog entry into DB Cosmetic table if missing
      dbCosmetic = await prisma.cosmetic.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.desc,
          category: (item.category as any) || 'SKIN',
          rarity: item.rarity as any,
          previewUrl: item.image,
          thumbnailUrl: item.image,
          price: item.price,
          unlockMethod: item.unlockMethod,
        },
      });
    }

    const existingOwnership = await prisma.userCosmetic.findUnique({
      where: {
        userId_cosmeticId: {
          userId: user.id,
          cosmeticId: dbCosmetic.id,
        },
      },
    });

    if (existingOwnership) {
      return NextResponse.json({
        success: true,
        message: `${item.name} is already unlocked!`,
        alreadyOwned: true,
      });
    }

    // 3. Free or zero-price items unlock without ledger debit
    if (item.price <= 0) {
      await prisma.userCosmetic.create({
        data: {
          userId: user.id,
          cosmeticId: dbCosmetic.id,
          unlockedVia: item.unlockMethod || 'FREE_QUEST',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully unlocked ${item.name}!`,
        pricePaid: 0,
      });
    }

    // 4. Real money ledger settlement for paid cosmetics
    const buyerAgents = await prisma.web4Agent.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: [{ walletBalance: 'desc' }, { createdAt: 'asc' }],
    });

    if (buyerAgents.length === 0) {
      return NextResponse.json(
        {
          error: 'No active agent found to fund this cosmetic purchase. Fund a Web4 agent with USDC first.',
          code: 'NO_BUYER_AGENT',
        },
        { status: 400 }
      );
    }

    const buyerAgent = payFromAgentId
      ? buyerAgents.find((a) => a.id === payFromAgentId)
      : buyerAgents.find((a) => a.walletBalance >= item.price) || buyerAgents[0];

    if (!buyerAgent) {
      return NextResponse.json(
        { error: `Payment agent ${payFromAgentId} not found`, code: 'INVALID_BUYER_AGENT' },
        { status: 400 }
      );
    }

    if (buyerAgent.walletBalance < item.price) {
      return NextResponse.json(
        {
          error: `Insufficient funds in agent "${buyerAgent.name}" ($${buyerAgent.walletBalance.toFixed(2)} available, $${item.price.toFixed(2)} required).`,
          code: 'INSUFFICIENT_FUNDS',
          available: buyerAgent.walletBalance,
          required: item.price,
          buyerAgentId: buyerAgent.id,
        },
        { status: 400 }
      );
    }

    const ref = `cosmetic_${item.id}_${Date.now()}`;

    // Execute atomic purchase and balance debit inside interactive transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-read buyer balance
      const currentBuyer = await tx.web4Agent.findUniqueOrThrow({
        where: { id: buyerAgent.id },
        select: { id: true, userId: true, walletBalance: true },
      });

      if (currentBuyer.walletBalance < item.price) {
        throw new SettlementError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds in agent ($${currentBuyer.walletBalance.toFixed(2)} available, $${item.price.toFixed(2)} required)`
        );
      }

      // Debit buyer agent
      const updatedBuyer = await tx.web4Agent.update({
        where: { id: buyerAgent.id },
        data: { walletBalance: { decrement: item.price } },
        select: { walletBalance: true },
      });

      await tx.ledgerEntry.create({
        data: {
          agentId: buyerAgent.id,
          userId: user.id,
          type: 'MARKETPLACE_BUY',
          amountUsdc: -item.price,
          ref,
          note: `Store cosmetic unlock: ${item.name}`,
        },
      });

      // Platform store purchases credit 100% of proceeds to platform treasury
      const treasury = await getTreasuryAgent(tx);
      await tx.web4Agent.update({
        where: { id: treasury.id },
        data: { walletBalance: { increment: item.price } },
      });

      await tx.ledgerEntry.create({
        data: {
          agentId: treasury.id,
          userId: treasury.userId,
          type: 'MARKETPLACE_RAKE',
          amountUsdc: item.price,
          ref,
          note: `Cosmetic store revenue: ${item.name}`,
        },
      });

      // Grant cosmetic ownership
      const userCosmetic = await tx.userCosmetic.create({
        data: {
          userId: user.id,
          cosmeticId: dbCosmetic!.id,
          unlockedVia: 'STORE_PURCHASE',
        },
      });

      // Log transaction record
      await tx.cosmeticTransaction.create({
        data: {
          buyerId: user.id,
          cosmeticId: dbCosmetic!.id,
          amount: item.price,
          currency: 'USDC',
          status: 'COMPLETED',
        },
      });

      return {
        userCosmetic,
        buyerNewBalance: updatedBuyer.walletBalance,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unlocked ${item.name}! Equipped in combat loadout.`,
      itemId: item.id,
      pricePaid: item.price,
      buyerAgentId: buyerAgent.id,
      buyerNewBalance: result.buyerNewBalance,
    });
  } catch (error: any) {
    if (error instanceof SettlementError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Cosmetic purchase failed' }, { status: 500 });
  }
}
