import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { executeDealClosureAndSale } from '../lib/money/sales/sales-engine';
import { releaseEscrowPayout } from '../lib/money/escrow';
import { userRealIncomeUsdc } from '../lib/money/ledger';

// Phase 2 — make money real: sales create claims, not income; income posts
// to the ledger only on escrow release, exactly once.

const RUN = `phase2-${Date.now()}`;
let userId: string;
let taskId: string;
let leadId: string;
let agentId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@money-test.local`, name: 'Phase2 Money Test', passwordHash: 'x' },
  });
  userId = user.id;
  const trend = await prisma.trend.create({ data: { name: `${RUN} trend` } });
  const task = await prisma.task.create({ data: { trendId: trend.id, title: `${RUN} task`, description: 'd' } });
  taskId = task.id;
  const lead = await prisma.lead.create({
    data: { taskId, source: 'reddit', sourceUrl: 'http://x', requestText: 'need help', buyerName: 'Buyer', buyerEmail: 'b@x.io' },
  });
  leadId = lead.id;
  const agent = await prisma.web4Agent.create({
    data: { userId, name: 'Seller Agent', archetype: 'GENERALIST', walletAddress: `${RUN}-w`, skills: [] },
  });
  agentId = agent.id;
});

afterAll(async () => {
  await prisma.sale.deleteMany({ where: { userId } });
  await prisma.ledgerEntry.deleteMany({ where: { userId } });
  await prisma.lead.deleteMany({ where: { taskId } });
  await prisma.task.deleteMany({ where: { id: taskId } });
  await prisma.trend.deleteMany({ where: { name: `${RUN} trend` } });
  await prisma.web4Agent.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe('honest sales', () => {
  it('engine sale creates an unverified HELD claim: no mock PI, no income', async () => {
    const sale = await executeDealClosureAndSale(taskId, userId, leadId, 10000, 'user');
    expect(sale.escrowStatus).toBe('HELD');
    expect(sale.stripePaymentIntentId).toBeNull();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.totalEarnings ?? 0).toBe(0);
    expect(await userRealIncomeUsdc(userId)).toBe(0);
  });

  it('release posts TRADE_PROCEEDS exactly once; re-release is idempotent', async () => {
    const sale = await prisma.sale.findFirst({ where: { userId, taskId } });
    const first = await releaseEscrowPayout(sale!.id, { userId, isAdmin: false });
    expect(first.ok).toBe(true);
    expect(await userRealIncomeUsdc(userId)).toBeCloseTo(90);

    const second = await releaseEscrowPayout(sale!.id, { userId, isAdmin: false });
    expect(second.ok).toBe(true);
    expect(await userRealIncomeUsdc(userId)).toBeCloseTo(90);

    const rows = await prisma.ledgerEntry.findMany({ where: { userId, type: 'TRADE_PROCEEDS' } });
    expect(rows.length).toBe(1);
  });

  it('strangers cannot release', async () => {
    const sale = await prisma.sale.findFirst({ where: { userId, taskId } });
    const res = await releaseEscrowPayout(sale!.id, { userId: 'stranger', isAdmin: false });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Not your sale.');
  });
});
