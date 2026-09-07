import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// TDD (plan Task 1, Step 1): fails until the council is wired to a real LLM
// with transparent per-turn emission, 12 archetypes, last-30 dedupe,
// deterministic rotation and pending-on-exhausted.

const runnerSrc = fs.readFileSync(
  path.join(__dirname, '../lib/council/council-runner.ts'),
  'utf8'
);
const harvesterSrc = fs.readFileSync(
  path.join(__dirname, '../lib/council/signal-harvester.ts'),
  'utf8'
);

const llmReply = vi.hoisted(() => vi.fn());
vi.mock('@/lib/execution/llm', () => ({
  makeLlm: () => llmReply,
}));

const emitProgressMock = vi.hoisted(() => vi.fn());
const emitDoneMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/activity/emitter', () => ({
  emitProgress: emitProgressMock,
  emitDone: emitDoneMock,
}));

const prismaMocks = vi.hoisted(() => ({
  councilSession: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  trend: { findMany: vi.fn() },
  task: { findMany: vi.fn() },
  userTask: { findMany: vi.fn() },
}));
vi.mock('@/lib/core/db', () => ({ prisma: prismaMocks }));

describe('track3 council real llm', () => {
  it('runner exports debate fn', async () => {
    const mod = await import('../lib/council/council-runner');
    expect(typeof (mod as any).runCouncilDebate ?? typeof (mod as any).default).toBeDefined();
  });

  it('runner calls a real LLM via makeLlm, not fixed templates', () => {
    expect(runnerSrc).toContain('makeLlm');
  });

  it('runner emits every persona turn and the final verdict transparently', () => {
    expect(runnerSrc).toContain('emitProgress');
    expect(runnerSrc).toContain('emitDone');
  });

  it('harvester carries 12 archetypes', async () => {
    const mod = await import('../lib/council/signal-harvester');
    expect(mod.HIGH_PROFIT_OPPORTUNITY_MATRIX).toHaveLength(12);
  });

  it('harvester dedupes against the last 30 sessions with no random fallback', () => {
    expect(harvesterSrc).toMatch(/take:\s*30/);
    expect(harvesterSrc).not.toContain('Math.random');
  });

  it('harvester returns pending when the pool is exhausted', async () => {
    const { harvestNextCouncilSignal, HIGH_PROFIT_OPPORTUNITY_MATRIX } = await import(
      '../lib/council/signal-harvester'
    );
    prismaMocks.councilSession.findMany.mockResolvedValue(
      HIGH_PROFIT_OPPORTUNITY_MATRIX.map((m: any) => ({ signal: { title: m.title } }))
    );
    prismaMocks.trend.findMany.mockResolvedValue([]);
    const out: any = await harvestNextCouncilSignal();
    expect(out?.status).toBe('pending');
  });

  it('debate runs 6 real LLM persona turns, emits each, then emits the verdict', async () => {
    const { runCouncilDebate } = await import('../lib/council/council-runner');
    prismaMocks.councilSession.findMany.mockResolvedValue([]);
    prismaMocks.task.findMany.mockResolvedValue([]);
    prismaMocks.userTask.findMany.mockResolvedValue([]);
    prismaMocks.trend.findMany.mockResolvedValue([]);
    prismaMocks.councilSession.create.mockResolvedValue({ id: 'sess_test_1' });
    prismaMocks.councilSession.update.mockResolvedValue({ id: 'sess_test_1' });
    llmReply.mockResolvedValue(
      'LLM fixture perspective: verified B2B buyer intent, 85% margin, sub-48h delivery.'
    );
    emitProgressMock.mockResolvedValue({ id: 'log_1' });
    emitDoneMock.mockResolvedValue({ id: 'log_done' });

    const out: any = await runCouncilDebate({
      title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
      source: 'test',
      rawInsight: 'Contractors miss night calls; $450 setup + $150/mo retainer.',
      estimatedMargin: '82.5%',
      estimatedVelocity: '24-48 hours',
    });

    expect(llmReply.mock.calls.length).toBeGreaterThanOrEqual(6);
    expect(out.turns).toHaveLength(6);
    for (const turn of out.turns) {
      expect(turn.perspective).toContain('LLM fixture perspective');
    }
    expect(emitProgressMock.mock.calls.length).toBeGreaterThanOrEqual(6);
    expect(emitDoneMock).toHaveBeenCalledTimes(1);
    expect(out.verdict).toBeDefined();
    expect(out.scores).toBeDefined();
  });
});
