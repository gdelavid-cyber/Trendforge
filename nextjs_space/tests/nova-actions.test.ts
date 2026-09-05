import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { executeTool, getTool, listTools } from '../lib/growth/nova/tools';

// N2 Nova OS — actions: validated proposals, approval-gated writes,
// at-most-once execution, receipts for everything.

const RUN = `nova-actions-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@nova-test.local`, name: 'Nova Actions Test', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.novaAction.deleteMany({ where: { userId } });
  const account = await prisma.userCredit.findUnique({ where: { userId } });
  if (account) {
    await prisma.creditTransaction.deleteMany({ where: { userCreditId: account.id } });
    await prisma.userCredit.deleteMany({ where: { userId } });
  }
  await prisma.novaConversation.deleteMany({ where: { userId } });
  await prisma.novaCustomTask.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe('tool registry', () => {
  it('lists five tools with approval flags', () => {
    const tools = listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['grant.claim', 'monitor.create', 'outreach.draft', 'swarm.status', 'worker.run'].sort()
    );
    expect(getTool('worker.run')?.requiresApproval).toBe(true);
    expect(getTool('swarm.status')?.requiresApproval).toBe(false);
    expect(getTool('nope')).toBeNull();
  });

  it('rejects bad params without side effects', () => {
    expect(getTool('worker.run')!.validate({ agentType: 'bogus' })).toMatch(/must be one of/);
    expect(getTool('outreach.draft')!.validate({})).toMatch(/business/);
    expect(getTool('monitor.create')!.validate({ title: '  ' })).toMatch(/title/);
    expect(getTool('worker.run')!.validate({ agentType: 'reddit_scraper' })).toBeNull();
  });
});

describe('executeTool', () => {
  it('executes immediate tools with billing + receipt', async () => {
    const tool = getTool('outreach.draft')!;
    const { receipt, remainingBalance } = await executeTool(userId, 'FREE', tool, {
      business: 'Acme Dental',
      offer: '20 short videos a month',
    });
    expect(receipt.draft).toContain('Acme Dental');
    expect(remainingBalance).toBe(98);

    const rows = await prisma.creditTransaction.findMany({
      where: { userCredit: { userId }, actionType: 'OUTREACH_DRAFT' },
    });
    expect(rows.length).toBe(1);
  });

  it('bills before executing, so failures still leave an audit trail', async () => {
    const tool = getTool('worker.run')!;
    await expect(executeTool(userId, 'FREE', tool, { agentType: 'bogus' })).rejects.toThrow();
    const account = await prisma.userCredit.findUnique({ where: { userId } });
    // 98 - 5 (failed run still billed; launch attempt is recorded in history)
    expect(account?.creditBalance).toBe(93);
  });
});

describe('approval claim', () => {
  it('exactly one concurrent approver wins a proposal', async () => {
    const action = await prisma.novaAction.create({
      data: { userId, tool: 'grant.claim', params: {}, status: 'PROPOSED' },
    });
    const results = await Promise.all([
      prisma.novaAction.updateMany({ where: { id: action.id, userId, status: 'PROPOSED' }, data: { status: 'APPROVED' } }),
      prisma.novaAction.updateMany({ where: { id: action.id, userId, status: 'PROPOSED' }, data: { status: 'APPROVED' } }),
    ]);
    expect(results.map((r) => r.count).sort()).toEqual([0, 1]);
  });
});
