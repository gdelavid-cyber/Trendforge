import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { getNovaBriefing, renderBriefingText, type NovaBriefing } from '../lib/growth/nova/reads';

// N1 Nova OS — reads: live state in, honest gaps out. Sections fail
// independently; the renderer names what's missing instead of guessing.

const RUN = `nova-brief-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@nova-test.local`, name: 'Nova Briefing Test', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.agentQuota.deleteMany({ where: { userId } });
  const account = await prisma.userCredit.findUnique({ where: { userId } });
  if (account) {
    await prisma.creditTransaction.deleteMany({ where: { userCreditId: account.id } });
    await prisma.userCredit.deleteMany({ where: { userId } });
  }
  await prisma.novaConversation.deleteMany({ where: { userId } });
  await prisma.novaCustomTask.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe('renderBriefingText', () => {
  it('renders numbers and names unreachable sections instead of guessing', () => {
    const b: NovaBriefing = {
      generatedAt: new Date().toISOString(),
      wallet: { available: true, realIncomeUsdc: 12.5, agents: 2, fundedAgents: 1 },
      credits: { available: false },
      quota: { available: true, workers: [{ key: 'k', name: 'Worker', used: 3, limit: 3 }] },
      swarm: { available: true, status: 'ACTIVE', survivalMode: false, activeTasks: 1, todayNet: 0, killSwitch: false },
      trends: { available: true, featured: 4, top: [{ title: 'T', score: 90 }] },
      insights: [{ level: 'info', text: 'half funded' }],
    };
    const text = renderBriefingText(b);
    expect(text).toContain('$12.50');
    expect(text).toContain("couldn't reach: credits");
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
  });
});

describe('getNovaBriefing', () => {
  it('returns a complete, zero-valued briefing for a fresh user', async () => {
    const b = await getNovaBriefing(userId, 'FREE');
    expect(b.wallet.available).toBe(true);
    expect(b.wallet.realIncomeUsdc).toBe(0);
    expect(b.credits.available).toBe(true);
    expect(b.quota.available).toBe(true);
    expect(b.quota.workers?.length).toBeGreaterThan(0);
    expect(b.swarm.available).toBe(true);
    expect(b.trends.available).toBe(true);
    expect(Array.isArray(b.insights)).toBe(true);
    const text = renderBriefingText(b);
    expect(text.length).toBeGreaterThan(20);
  });
});
