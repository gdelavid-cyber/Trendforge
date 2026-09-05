import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { recordTrace, recentTraces, renderTraceText } from '../lib/growth/nova/traces';

// N3 Nova OS — traces: decisions write why-records; tracing never throws,
// never blocks, and the renderer never invents content.

const RUN = `nova-traces-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@nova-test.local`, name: 'Nova Traces Test', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.novaTrace.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe('recordTrace', () => {
  it('never rejects, even on degenerate input', async () => {
    await expect(
      recordTrace({ userId, kind: 'STEP', subject: '', summary: '', reasons: [] })
    ).resolves.toBeUndefined();
  });

  it('round-trips user and global traces in recency order with kind filter', async () => {
    await recordTrace({ userId, kind: 'RUN_REJECTED', subject: 'reddit_scraper', summary: 'Quota out.', reasons: ['3/3 used'] });
    await recordTrace({ userId: null, kind: 'TREND', subject: 'Task', summary: 'Scored 0.9.', reasons: ['c1'] });

    const mine = await recentTraces(userId, { includeGlobal: false });
    expect(mine.length).toBeGreaterThanOrEqual(1);
    expect(mine.every((t) => t.userId === userId)).toBe(true);

    const filtered = await recentTraces(userId, { kinds: ['TREND'] });
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.every((t) => t.kind === 'TREND')).toBe(true);

    const all = await recentTraces(userId, {});
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(new Date(all[0].createdAt) >= new Date(all[1].createdAt)).toBe(true);
  });
});

describe('renderTraceText', () => {
  it('formats with reasons and omits the clause without them', () => {
    const withReasons = renderTraceText({
      kind: 'BATTLE', subject: 'Pro Tier', summary: 'Settled.', reasons: ['pot $10'], createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    expect(withReasons).toContain('BATTLE');
    expect(withReasons).toContain('Because: pot $10');

    const bare = renderTraceText({
      kind: 'GATE', subject: 's', summary: 'Denied.', reasons: [], createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    expect(bare).not.toContain('Because');
    expect(bare).not.toContain('undefined');
  });
});
