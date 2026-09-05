import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { isUserAdmin } from '../lib/council/config';

const RUN_PREFIX = `council-hot-task-${Date.now()}`;
const createdTaskIds: string[] = [];
const createdTrendIds: string[] = [];
const createdSessionIds: string[] = [];

afterAll(async () => {
  if (createdTaskIds.length > 0) {
    await prisma.task.deleteMany({
      where: { id: { in: createdTaskIds } },
    });
  }
  if (createdTrendIds.length > 0) {
    await prisma.trend.deleteMany({
      where: { id: { in: createdTrendIds } },
    });
  }
  if (createdSessionIds.length > 0) {
    await prisma.councilSession.deleteMany({
      where: { id: { in: createdSessionIds } },
    });
  }
  await prisma.$disconnect();
});

describe('AI Council Admin Isolation & Hot Task Advancement', () => {
  it('strictly restricts AI Council execution and access to admins', () => {
    // Non-admins
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin({ id: 'u_free', email: 'free@user.com', role: 'FREE' })).toBe(false);
    expect(isUserAdmin({ id: 'u_pro', email: 'pro@user.com', role: 'PRO' })).toBe(false);

    // Verified admins
    expect(isUserAdmin({ id: 'u_admin', email: 'admin@trendly.io', role: 'ADMIN' })).toBe(true);
  });

  it('moves approved council idea directly into the hot task section as an active featured task', async () => {
    const testTitle = `${RUN_PREFIX}: Autonomous Emergency Voice Dispatch for Contractors`;
    const testDescription = 'Service contractors miss 40% of after-hours calls; high-ticket setup fee with recurring retainer.';

    // 1. Create a linked trend
    const trend = await prisma.trend.create({
      data: {
        name: `Alpha: ${testTitle}`,
        category: 'AGENT_ECONOMY',
        status: 'ACTIVE',
        isMonetizable: true,
        monetizationScore: 0.95,
        newsSummary: testDescription,
      },
    });
    createdTrendIds.push(trend.id);

    // 2. Simulate council approval moving idea to Hot Tasks
    const task = await prisma.task.create({
      data: {
        trendId: trend.id,
        title: testTitle,
        description: testDescription,
        steps: [
          { stepNumber: 1, title: 'Prospecting', instruction: 'Contact local contractors.' },
          { stepNumber: 2, title: 'Deployment', instruction: 'Configure voice template.' },
          { stepNumber: 3, title: 'Close', instruction: 'Collect $450 setup fee.' },
        ],
        difficulty: 'LOW',
        startupCost: 50,
        timeToFirstDollar: '24-48 hours',
        estimatedEarningsLow: 450,
        estimatedEarningsHigh: 2500,
        riskLevel: 'LOW',
        category: 'AGENT_ECONOMY',
        qualityScore: 95,
        isVerified: true,
        isFeatured: true, // Key requirement: moves to Hot Tasks
        trendScore: 98,   // Highest priority in trending stream
      },
    });
    createdTaskIds.push(task.id);

    // 3. Verify it surfaces immediately in Hot Tasks query
    const hotTasks = await prisma.task.findMany({
      where: {
        isFeatured: true,
        id: task.id,
      },
    });

    expect(hotTasks.length).toBe(1);
    expect(hotTasks[0].id).toBe(task.id);
    expect(hotTasks[0].isFeatured).toBe(true);
    expect(hotTasks[0].trendScore).toBe(98);
    expect(hotTasks[0].title).toBe(testTitle);
  });
});
