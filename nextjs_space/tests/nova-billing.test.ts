import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { deductCreditsDb } from '../lib/growth/credits/credit-manager';

// N0 Nova OS foundation: Nova billing must be server-authoritative —
// atomic guarded decrements, an audit row per deduction, no overdrafts
// under concurrency, and monthly allocation resets.

const RUN = `nova-billing-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@nova-test.local`, name: 'Nova Billing Test', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  const account = await prisma.userCredit.findUnique({ where: { userId } });
  if (account) {
    await prisma.creditTransaction.deleteMany({ where: { userCreditId: account.id } });
    await prisma.userCredit.deleteMany({ where: { userId } });
  }
  await prisma.novaConversation.deleteMany({ where: { userId } });
  await prisma.novaCustomTask.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe('deductCreditsDb', () => {
  it('auto-provisions a FREE/100 account and deducts with an audit row', async () => {
    const r = await deductCreditsDb(userId, 'NOVA_MESSAGE', 'test message');
    expect(r.success).toBe(true);
    expect(r.cost).toBe(2);
    expect(r.remainingBalance).toBe(98);

    const rows = await prisma.creditTransaction.findMany({
      where: { userCredit: { userId }, actionType: 'NOVA_MESSAGE' },
    });
    expect(rows.length).toBe(1);
    expect(rows[0].creditsDeducted).toBe(2);
    expect(rows[0].balanceAfter).toBe(98);
  });

  it('refuses overdrafts without writing audit rows', async () => {
    await prisma.userCredit.update({ where: { userId }, data: { creditBalance: 1 } });
    const before = await prisma.creditTransaction.count({ where: { userCredit: { userId } } });

    const r = await deductCreditsDb(userId, 'NOVA_MESSAGE', 'overdraft attempt');
    expect(r.success).toBe(false);
    expect(r.remainingBalance).toBe(1);

    const after = await prisma.creditTransaction.count({ where: { userCredit: { userId } } });
    expect(after).toBe(before);

    const account = await prisma.userCredit.findUnique({ where: { userId } });
    expect(account?.creditBalance).toBe(1);
  });

  it('never overdraws under concurrent deductions', async () => {
    await prisma.userCredit.update({ where: { userId }, data: { creditBalance: 5 } });
    const results = await Promise.all([
      deductCreditsDb(userId, 'NOVA_MESSAGE', 'race 1'),
      deductCreditsDb(userId, 'NOVA_MESSAGE', 'race 2'),
      deductCreditsDb(userId, 'NOVA_MESSAGE', 'race 3'),
    ]);
    const ok = results.filter((r) => r.success).length;
    expect(ok).toBe(2);

    const account = await prisma.userCredit.findUnique({ where: { userId } });
    expect(account?.creditBalance).toBe(1);
  });

  it('resets to the monthly allocation when the window has elapsed', async () => {
    await prisma.userCredit.update({
      where: { userId },
      data: { creditBalance: 7, resetAt: new Date(Date.now() - 1000) },
    });
    const r = await deductCreditsDb(userId, 'NOVA_MESSAGE', 'post-reset message');
    expect(r.success).toBe(true);
    expect(r.remainingBalance).toBe(98); // reset to 100, then deduct 2
  });
});
