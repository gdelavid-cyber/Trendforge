import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/db';
import { generateConwayWallet } from '../lib/web4/wallet';
import { postEntry, userRealIncomeUsdc } from '../lib/web4/ledger';
import { getBadges, getLevelInfo, getWealthPoints } from '../app/gamification';

// Income-honesty invariants: the only "$ earned" number the platform may show
// is the ledger sum of real credits (deposits / trade proceeds / battle pots)
// across a user's agents. Gamification XP comes from completed work only.

const RUN = `income-${Date.now()}`;
let userId: string;
let agentA: string;
let agentB: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@income-test.local`, name: 'Income Test User', passwordHash: 'x' },
  });
  userId = user.id;

  const a = await prisma.web4Agent.create({
    data: { userId, name: 'Income A', archetype: 'GENERALIST', walletAddress: generateConwayWallet(`${RUN}-a`).address, skills: [] },
  });
  agentA = a.id;
  const b = await prisma.web4Agent.create({
    data: { userId, name: 'Income B', archetype: 'GENERALIST', walletAddress: generateConwayWallet(`${RUN}-b`).address, skills: [] },
  });
  agentB = b.id;
});

afterAll(async () => {
  for (const agentId of [agentA, agentB]) {
    await prisma.ledgerEntry.deleteMany({ where: { agentId } });
    await prisma.deposit.deleteMany({ where: { agentId } });
  }
  await prisma.web4Agent.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('userRealIncomeUsdc (the only income figure)', () => {
  it('sums real credit types across all of a user\'s agents', async () => {
    // Real money in.
    await postEntry({ agentId: agentA, userId, type: 'DEPOSIT', amountUsdc: 100, ref: `${RUN}-d1` });
    await postEntry({ agentId: agentB, userId, type: 'BATTLE_PAYOUT', amountUsdc: 40, ref: `${RUN}-bp` });

    expect(await userRealIncomeUsdc(userId)).toBeCloseTo(140);
  });

  it('excludes debits, platform adjustments, burns and other users', async () => {
    await postEntry({ agentId: agentA, userId, type: 'ADJUSTMENT', amountUsdc: 25, ref: `${RUN}-adj` });
    await postEntry({ agentId: agentA, userId, type: 'MISSION_BURN', amountUsdc: -10, ref: `${RUN}-burn` });
    await postEntry({ agentId: agentA, userId, type: 'WITHDRAWAL', amountUsdc: -20, ref: `${RUN}-wd` });
    await postEntry({ agentId: agentB, userId, type: 'TRADE_ALLOCATION', amountUsdc: -15, ref: `${RUN}-alloc` });

    // Still just the 100 deposit + 40 battle pot.
    expect(await userRealIncomeUsdc(userId)).toBeCloseTo(140);

    const stranger = await prisma.user.create({
      data: { email: `${RUN}-s@income-test.local`, name: 'Stranger', passwordHash: 'x' },
    });
    try {
      expect(await userRealIncomeUsdc(stranger.id)).toBe(0);
    } finally {
      await prisma.user.delete({ where: { id: stranger.id } });
    }
  });
});

describe('gamification is decoupled from money', () => {
  it('XP derives from completed move count only', () => {
    expect(getWealthPoints(0)).toBe(0);
    expect(getWealthPoints(10)).toBe(1000);
    expect(getWealthPoints(-5)).toBe(0);
  });

  it('levels progress on completions with no dollar input anywhere', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(9).level).toBe(1);
    expect(getLevelInfo(10).level).toBe(2); // 1000 XP
    expect(getLevelInfo(50).level).toBe(3);
    expect(getLevelInfo(200).level).toBe(4);
    expect(getLevelInfo(1000).level).toBe(5);
  });

  it('badges no longer reference earnings thresholds', () => {
    const badges = getBadges(50);
    expect(badges).toContain('first_move');
    expect(badges).toContain('ten_completed');
    expect(getBadges(24)).not.toContain('hundred_club');
    expect(getBadges(25)).toContain('hundred_club');
  });
});
