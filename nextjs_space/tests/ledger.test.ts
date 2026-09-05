import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { generateConwayWallet } from '../lib/money/wallet';
import { ledgerBalance, postEntry, realEarningsUsdc } from '../lib/money/ledger';
import { runSurvivalCycle } from '../lib/swarm/survival-engine';
import { claimUserGrant } from '../lib/money/grants/micro-grant';

// Honest-money foundation: every wallet movement must be a ledger entry,
// balances must equal the entry sum, replays must be no-ops, and agents
// without real funding stay dormant instead of dying.

const RUN = `ledger-${Date.now()}`;
let userId: string;
let agentId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@ledger-test.local`, name: 'Ledger Test User', passwordHash: 'x' },
  });
  userId = user.id;
  const wallet = generateConwayWallet(`${RUN}-agent`);
  const agent = await prisma.web4Agent.create({
    data: {
      userId,
      name: 'Ledger Test Agent',
      archetype: 'GENERALIST',
      walletAddress: wallet.address,
      skills: [],
    },
  });
  agentId = agent.id;
});

afterAll(async () => {
  await prisma.ledgerEntry.deleteMany({ where: { agentId } });
  await prisma.agentSurvivalLog.deleteMany({ where: { agentId } });
  await prisma.web4Agent.deleteMany({ where: { userId } });
  await prisma.grant.deleteMany({ where: { userId } });
  await prisma.onboardingProgress.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('conway wallet generation', () => {
  it('starts every new wallet at zero — no simulated liquidity', () => {
    const wallet = generateConwayWallet('fresh-agent');
    expect(wallet.balance).toBe(0);
  });
});

describe('ledger entries', () => {
  it('credits and debits move the balance and sum exactly to it', async () => {
    const dep = await postEntry({
      agentId, userId, type: 'DEPOSIT', amountUsdc: 100, ref: `${RUN}-dep-1`, note: 'test deposit',
    });
    expect(dep.ok).toBe(true);
    expect(dep.balance).toBeCloseTo(100);

    const burn = await postEntry({
      agentId, userId, type: 'MISSION_BURN', amountUsdc: -12.5, ref: `${RUN}-burn-1`,
    });
    expect(burn.ok).toBe(true);
    expect(burn.balance).toBeCloseTo(87.5);

    expect(await ledgerBalance(agentId)).toBeCloseTo(87.5);
    const dbAgent = await prisma.web4Agent.findUniqueOrThrow({ where: { id: agentId } });
    expect(dbAgent.walletBalance).toBeCloseTo(87.5);
  });

  it('replaying the same ref is a no-op (idempotent double-credit guard)', async () => {
    const first = await postEntry({
      agentId, userId, type: 'DEPOSIT', amountUsdc: 50, ref: `${RUN}-dup`,
    });
    expect(first.ok).toBe(true);

    const replay = await postEntry({
      agentId, userId, type: 'DEPOSIT', amountUsdc: 50, ref: `${RUN}-dup`,
    });
    expect(replay.ok).toBe(false);
    expect(replay.reason).toBe('duplicate');
    expect(replay.balance).toBeCloseTo(first.balance);
    expect(await ledgerBalance(agentId)).toBeCloseTo(first.balance);
  });

  it('real earnings count deposits/trade proceeds/battle pots — not adjustments or burns', async () => {
    await postEntry({ agentId, userId, type: 'ADJUSTMENT', amountUsdc: 25, ref: `${RUN}-adj` });
    await postEntry({ agentId, userId, type: 'TRADE_PROCEEDS', amountUsdc: 40, ref: `${RUN}-tp` });
    const real = await realEarningsUsdc(agentId);
    // deposits so far: 100 + 50 (dup replay not double-counted) = 150, + 40 proceeds;
    // the 25 adjustment and -12.5 burn are excluded
    expect(real).toBeCloseTo(190);
  });
});

describe('darwinism dormant gate', () => {
  it('never-funded agents go DORMANT instead of DYING', async () => {
    const freshWallet = generateConwayWallet(`${RUN}-fresh`);
    const fresh = await prisma.web4Agent.create({
      data: {
        userId,
        name: 'Dormant Fixture',
        archetype: 'GENERALIST',
        walletAddress: freshWallet.address,
        walletBalance: 0,
        skills: [],
      },
    });
    try {
      await runSurvivalCycle([fresh.id]);
      const after = await prisma.web4Agent.findUniqueOrThrow({ where: { id: fresh.id } });
      expect(after.status).toBe('DORMANT');
      expect(after.gracePeriodEnds).toBeNull();
    } finally {
      await prisma.agentSurvivalLog.deleteMany({ where: { agentId: fresh.id } });
      await prisma.web4Agent.delete({ where: { id: fresh.id } });
    }
  });

  it('a funded agent reactivates from DORMANT on the next cycle', async () => {
    await postEntry({
      agentId, userId, type: 'DEPOSIT', amountUsdc: 10, ref: `${RUN}-activate`,
    });
    await prisma.web4Agent.update({ where: { id: agentId }, data: { status: 'DORMANT' } });

    await runSurvivalCycle([agentId]);
    const after = await prisma.web4Agent.findUniqueOrThrow({ where: { id: agentId } });
    expect(['ACTIVE', 'DYING']).toContain(after.status);
  });
});

describe('bootstrap micro-grant', () => {
  it('funds the agent via a labeled adjustment without counting as earnings', async () => {
    const result = await claimUserGrant(userId, agentId);
    expect(result.success).toBe(true);

    const agent = await prisma.web4Agent.findUniqueOrThrow({ where: { id: agentId } });
    expect(agent.totalEarnings).toBe(0);

    const entries = await prisma.ledgerEntry.findMany({
      where: { agentId, type: 'ADJUSTMENT', ref: { startsWith: 'platform-grant-' } },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].amountUsdc).toBeCloseTo(25);
    expect(agent.walletBalance).toBeCloseTo(await ledgerBalance(agentId));

    // The grant is platform credit — real earnings must not move.
    // (150 deposits + 10 activation deposit + 40 proceeds = 200)
    expect(await realEarningsUsdc(agentId)).toBeCloseTo(200);
  });
});
