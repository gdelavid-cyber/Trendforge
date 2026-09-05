import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/core/db';

// The user's own brain must outrank the platform default whenever one is
// connected, and an explicitly injected LLM (tests/platform ops) outranks
// both.

const state = vi.hoisted(() => ({ byokUserId: 'never-matches' }));

vi.mock('@/lib/intelligence/user-llm', () => ({
  getUserLlm: vi.fn(async (uid: string) =>
    uid === state.byokUserId ? async () => 'USER_BRAIN_OUTPUT' : null
  ),
}));

vi.mock('@/lib/execution/llm', () => ({
  makeLlm: () => async () => 'PLATFORM_OUTPUT',
}));

const { startExecution } = await import('../lib/execution/engine');

const RUN = `brain-prio-${Date.now()}`;
let userId: string;
let trendId: string;

async function makeTask(stepsJson: unknown): Promise<string> {
  const t = await prisma.task.create({
    data: {
      id: `${RUN}-task-${Math.random().toString(36).slice(2, 8)}`,
      title: `Brain priority task ${RUN}`,
      description: 'fixture',
      category: 'AI_TOOLS',
      steps: stepsJson as any,
      trendId,
    },
  });
  return t.id;
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@prio-test.local`, name: 'Priority User', passwordHash: 'x' },
  });
  userId = user.id;
  state.byokUserId = userId;
  const trend = await prisma.trend.create({ data: { name: `Prio fixture ${RUN}` } });
  trendId = trend.id;
});

afterAll(async () => {
  await prisma.userTask.deleteMany({ where: { userId } });
  await prisma.companion.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { trendId } });
  await prisma.trend.deleteMany({ where: { id: trendId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('brain resolution priority', () => {
  it('a connected user brain drives execution when no explicit LLM is injected', async () => {
    const taskId = await makeTask([{ id: 's1', title: 'Do the thing', action: 'draft' }]);
    const res = await startExecution(userId, taskId, 'CO_PILOT', {}, { awaitLoops: true });

    expect(res.ok).toBe(true);
    expect(res.stepResult?.output).toBe('USER_BRAIN_OUTPUT');
  });

  it('an explicitly provided LLM still wins over the user brain', async () => {
    const taskId = await makeTask([{ id: 's1', title: 'Do the thing', action: 'draft' }]);
    const res = await startExecution(userId, taskId, 'CO_PILOT', {}, {
      llm: async () => 'EXPLICIT_OUTPUT',
      awaitLoops: true,
    });

    expect(res.ok).toBe(true);
    expect(res.stepResult?.output).toBe('EXPLICIT_OUTPUT');
  });

  it('users without a brain fall through to the platform default chain', async () => {
    const stranger = await prisma.user.create({
      data: { email: `${RUN}-stranger@prio-test.local`, name: 'No Brain', passwordHash: 'x' },
    });
    try {
      const t = await prisma.task.create({
        data: {
          id: `${RUN}-t2`,
          title: 'Platform default task',
          description: 'fixture',
          category: 'AI_TOOLS',
          steps: [{ id: 's1', title: 'Step', action: 'draft' }] as any,
          trendId,
        },
      });
      // No llm injected and no user brain → runner falls back to makeLlm().
      const res = await startExecution(stranger.id, t.id, 'CO_PILOT', {}, { awaitLoops: true });
      expect(res.ok).toBe(true);
      expect(res.stepResult?.output).toBe('PLATFORM_OUTPUT');
    } finally {
      await prisma.userTask.deleteMany({ where: { userId: stranger.id } });
      await prisma.companion.deleteMany({ where: { userId: stranger.id } });
      await prisma.user.deleteMany({ where: { id: stranger.id } });
    }
  });
});
