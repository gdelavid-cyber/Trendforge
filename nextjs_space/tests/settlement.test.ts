import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/db';
import { generateConwayWallet } from '../lib/web4/wallet';
import { postEntry, ledgerBalance, realEarningsUsdc } from '../lib/web4/ledger';
import { transferFunds, executeSettlement, SettlementError } from '../lib/web4/settlement';
import { getTreasuryAgent } from '../lib/web4/treasury';

const RUN = `settle-${Date.now()}`;

let buyerUserId: string;
let sellerUserId: string;
let buyerAgentId: string;
let sellerAgentId: string;
let treasuryAgentId: string;

beforeAll(async () => {
  // 1. Create buyer user and agent
  const buyerUser = await prisma.user.create({
    data: {
      email: `${RUN}-buyer@settlement.local`,
      name: 'Settlement Buyer',
      passwordHash: 'x',
    },
  });
  buyerUserId = buyerUser.id;

  const buyerWallet = generateConwayWallet(`${RUN}-buyer`);
  const buyerAgent = await prisma.web4Agent.create({
    data: {
      userId: buyerUserId,
      name: 'Buyer Unit',
      archetype: 'GENERALIST',
      walletAddress: buyerWallet.address,
      walletBalance: 0,
      skills: [],
    },
  });
  buyerAgentId = buyerAgent.id;

  // 2. Create seller user and agent
  const sellerUser = await prisma.user.create({
    data: {
      email: `${RUN}-seller@settlement.local`,
      name: 'Settlement Seller',
      passwordHash: 'x',
    },
  });
  sellerUserId = sellerUser.id;

  const sellerWallet = generateConwayWallet(`${RUN}-seller`);
  const sellerAgent = await prisma.web4Agent.create({
    data: {
      userId: sellerUserId,
      name: 'Seller Unit',
      archetype: 'GENERALIST',
      walletAddress: sellerWallet.address,
      walletBalance: 0,
      skills: [],
    },
  });
  sellerAgentId = sellerAgent.id;

  // 3. Resolve treasury agent
  const treasury = await getTreasuryAgent();
  treasuryAgentId = treasury.id;
});

afterAll(async () => {
  // Clean up all test fixtures
  await prisma.ledgerEntry.deleteMany({
    where: {
      agentId: { in: [buyerAgentId, sellerAgentId, treasuryAgentId] },
      ref: { startsWith: RUN },
    },
  });
  await prisma.marketplaceListing.deleteMany({
    where: { sellerId: { in: [buyerUserId, sellerUserId] } },
  });
  await prisma.web4Agent.deleteMany({
    where: { id: { in: [buyerAgentId, sellerAgentId] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [buyerUserId, sellerUserId] } },
  });
  await prisma.$disconnect();
});

describe('S7 Marketplace Settlement Layer', () => {
  it('fails closed when buyer agent has insufficient balance', async () => {
    // Buyer has 0 balance currently
    await expect(
      executeSettlement({
        fromAgentId: buyerAgentId,
        toAgentId: sellerAgentId,
        amountUsdc: 50.0,
        type: 'MARKETPLACE',
        ref: `${RUN}-insufficient-1`,
        rakePercent: 0.10,
      })
    ).rejects.toThrowError(SettlementError);

    const buyer = await prisma.web4Agent.findUniqueOrThrow({ where: { id: buyerAgentId } });
    const seller = await prisma.web4Agent.findUniqueOrThrow({ where: { id: sellerAgentId } });

    expect(buyer.walletBalance).toBe(0);
    expect(seller.walletBalance).toBe(0);

    // Assert zero ledger entries were written
    const entries = await prisma.ledgerEntry.findMany({
      where: { ref: `${RUN}-insufficient-1` },
    });
    expect(entries.length).toBe(0);
  });

  it('settles funds atomically with exact 10% rake floor and seller remainder', async () => {
    // 1. Fund buyer with $100 via verified deposit
    const fund = await postEntry({
      agentId: buyerAgentId,
      userId: buyerUserId,
      type: 'DEPOSIT',
      amountUsdc: 100.0,
      ref: `${RUN}-fund-buyer`,
    });
    expect(fund.ok).toBe(true);
    expect(fund.balance).toBeCloseTo(100.0);

    // Initial treasury balance
    const treasuryBefore = await prisma.web4Agent.findUniqueOrThrow({
      where: { id: treasuryAgentId },
    });

    // 2. Transfer $25.55 with 10% platform rake
    // 25.55 * 0.10 = 2.555 -> floor to 2.55 rake. Seller gets remainder 23.00
    const settle = await executeSettlement({
      fromAgentId: buyerAgentId,
      toAgentId: sellerAgentId,
      amountUsdc: 25.55,
      type: 'MARKETPLACE',
      ref: `${RUN}-tx-1`,
      rakePercent: 0.10,
    });

    expect(settle.ok).toBe(true);
    expect(settle.totalAmount).toBe(25.55);
    expect(settle.rakeAmount).toBe(2.55);
    expect(settle.sellerPayout).toBe(23.00);

    // Verify buyer debited exactly 25.55
    const buyer = await prisma.web4Agent.findUniqueOrThrow({ where: { id: buyerAgentId } });
    expect(buyer.walletBalance).toBeCloseTo(74.45);
    expect(await ledgerBalance(buyerAgentId)).toBeCloseTo(74.45);

    // Verify seller credited remainder 23.00
    const seller = await prisma.web4Agent.findUniqueOrThrow({ where: { id: sellerAgentId } });
    expect(seller.walletBalance).toBeCloseTo(23.00);
    expect(await ledgerBalance(sellerAgentId)).toBeCloseTo(23.00);

    // Verify seller payout is recognized as real earnings
    const sellerEarnings = await realEarningsUsdc(sellerAgentId);
    expect(sellerEarnings).toBeCloseTo(23.00);

    // Verify treasury received exactly 2.55 rake
    const treasuryAfter = await prisma.web4Agent.findUniqueOrThrow({
      where: { id: treasuryAgentId },
    });
    expect(treasuryAfter.walletBalance - treasuryBefore.walletBalance).toBeCloseTo(2.55);

    // Verify exactly 3 ledger entries exist for this settlement ref
    const entries = await prisma.ledgerEntry.findMany({
      where: { ref: `${RUN}-tx-1` },
    });
    expect(entries.length).toBe(3);

    const debit = entries.find((e) => e.type === 'MARKETPLACE_BUY');
    const credit = entries.find((e) => e.type === 'MARKETPLACE_SALE');
    const rake = entries.find((e) => e.type === 'MARKETPLACE_RAKE');

    expect(debit?.amountUsdc).toBe(-25.55);
    expect(credit?.amountUsdc).toBe(23.00);
    expect(rake?.amountUsdc).toBe(2.55);

    // Conservation of money: debit + credit + rake === 0
    expect(debit!.amountUsdc + credit!.amountUsdc + rake!.amountUsdc).toBeCloseTo(0);
  });

  it('guarantees idempotency on duplicate settlement ref', async () => {
    // Replay the exact same settlement ref
    const replay = await executeSettlement({
      fromAgentId: buyerAgentId,
      toAgentId: sellerAgentId,
      amountUsdc: 25.55,
      type: 'MARKETPLACE',
      ref: `${RUN}-tx-1`,
      rakePercent: 0.10,
    });

    expect(replay.ok).toBe(true);

    // Balances must remain unchanged
    const buyer = await prisma.web4Agent.findUniqueOrThrow({ where: { id: buyerAgentId } });
    const seller = await prisma.web4Agent.findUniqueOrThrow({ where: { id: sellerAgentId } });

    expect(buyer.walletBalance).toBeCloseTo(74.45);
    expect(seller.walletBalance).toBeCloseTo(23.00);

    // Still only 3 entries exist
    const entries = await prisma.ledgerEntry.findMany({
      where: { ref: `${RUN}-tx-1` },
    });
    expect(entries.length).toBe(3);
  });

  it('rejects self-settlement to prevent artificial volume loops', async () => {
    await expect(
      executeSettlement({
        fromAgentId: buyerAgentId,
        toAgentId: buyerAgentId,
        amountUsdc: 10.0,
        ref: `${RUN}-self`,
      })
    ).rejects.toThrowError('Cannot transfer funds to the same agent');
  });

  it('settles marketplace listing sale atomically and transfers ownership', async () => {
    // Create an asset agent to sell
    const forSaleWallet = generateConwayWallet(`${RUN}-for-sale`);
    const forSaleAgent = await prisma.web4Agent.create({
      data: {
        userId: sellerUserId,
        name: 'Agent For Sale',
        archetype: 'DATA_MINER',
        walletAddress: forSaleWallet.address,
        walletBalance: 0,
        skills: [],
      },
    });

    // Create listing
    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: sellerUserId,
        agentId: forSaleAgent.id,
        price: 30.0,
        currency: 'USDC',
        itemType: 'AGENT',
        status: 'ACTIVE',
      },
    });

    // Settle purchase inside interactive transaction (matching route logic)
    await prisma.$transaction(async (tx) => {
      const currentListing = await tx.marketplaceListing.findUniqueOrThrow({
        where: { id: listing.id },
      });
      expect(currentListing.status).toBe('ACTIVE');

      await transferFunds(tx, {
        fromAgentId: buyerAgentId,
        toAgentId: sellerAgentId,
        amountUsdc: listing.price,
        type: 'MARKETPLACE',
        ref: listing.id,
        rakePercent: 0.10,
      });

      // Transfer ownership
      await tx.web4Agent.update({
        where: { id: forSaleAgent.id },
        data: { userId: buyerUserId },
      });

      // Mark SOLD
      await tx.marketplaceListing.update({
        where: { id: listing.id },
        data: { status: 'SOLD' },
      });
    });

    // 1. Verify listing is marked SOLD
    const soldListing = await prisma.marketplaceListing.findUniqueOrThrow({
      where: { id: listing.id },
    });
    expect(soldListing.status).toBe('SOLD');

    // 2. Verify agent ownership was transferred to buyer
    const transferredAgent = await prisma.web4Agent.findUniqueOrThrow({
      where: { id: forSaleAgent.id },
    });
    expect(transferredAgent.userId).toBe(buyerUserId);

    // 3. Verify buyer was debited $30 (74.45 - 30 = 44.45)
    const buyerAfter = await prisma.web4Agent.findUniqueOrThrow({ where: { id: buyerAgentId } });
    expect(buyerAfter.walletBalance).toBeCloseTo(44.45);

    // 4. Verify seller was credited 90% ($27) (23 + 27 = 50.00)
    const sellerAfter = await prisma.web4Agent.findUniqueOrThrow({ where: { id: sellerAgentId } });
    expect(sellerAfter.walletBalance).toBeCloseTo(50.00);

    // Cleanup forSaleAgent
    await prisma.ledgerEntry.deleteMany({ where: { ref: listing.id } });
    await prisma.web4Agent.delete({ where: { id: forSaleAgent.id } });
  });
});
