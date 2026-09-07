import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const src = (p: string) => readFileSync(join(root, p), 'utf8');

describe('track2 freshness', () => {
  it('stream returns createdAt for age display', async () => {
    const mod = await import('../app/api/tasks/stream/route');
    expect(typeof mod.GET).toBe('function');
    const s = src('app/api/tasks/stream/route.ts');
    // select carries the freshness fields
    expect(s).toContain('createdAt');
    expect(s).toContain('fingerprint');
    expect(s).toContain('trendScore');
    // stable order: live-new first (featured pin, then newest)
    expect(s).toContain('isFeatured');
    expect(s).not.toContain('generatedAt: t.generatedAt.toISOString(),\n          expiresAt');
  });

  it('freshness helpers: NEW <24h, LIVE trendScore>=80, age + dedupe', async () => {
    const m = await import('../lib/tasks/freshness');
    const now = new Date('2026-09-07T12:00:00Z');
    expect(m.isNewTask(new Date('2026-09-07T00:00:00Z').toISOString(), now)).toBe(true);
    expect(m.isNewTask(new Date('2026-09-05T00:00:00Z').toISOString(), now)).toBe(false);
    expect(m.isLiveTask(80)).toBe(true);
    expect(m.isLiveTask(95)).toBe(true);
    expect(m.isLiveTask(79)).toBe(false);
    expect(m.formatTaskAge(new Date('2026-09-07T10:00:00Z').toISOString(), now)).toContain('2h');
    expect(
      m.dedupeTasksById([{ id: 'a' }, { id: 'a' }, { id: 'b' }] as any).map((t: any) => t.id),
    ).toEqual(['a', 'b']);
  });

  it('list dedupes by id and supports NEW/LIVE badges', () => {
    const s = src('app/tasks/_components/infinite-task-list.tsx');
    expect(s).toContain('dedupeTasksById');
    expect(s).toContain('NEW');
    expect(s).toContain('LIVE');
  });

  it('card shows Issued date + age + badge, no optimistic vote inflation', () => {
    const s = src('components/tasks/task-card.tsx');
    expect(s).toContain('Issued');
    expect(s).toContain('NEW');
    expect(s).toContain('LIVE');
    expect(s).not.toMatch(/setVote|optimistic|upvotes\s*\+\s*1/);
  });

  it('no phantom $150 fallbacks in scope (0 + pending instead)', () => {
    for (const f of [
      'app/api/tasks/[id]/sales/route.ts',
      'lib/money/sales/sales-engine.ts',
      'components/execution/SalesPipelineCard.tsx',
    ]) {
      expect(src(f)).not.toContain('|| 15000');
    }
  });

  it('earn pages show pending, never fake default buyers', () => {
    for (const f of ['app/earn/start/page.tsx', 'app/earn/quick-wins/page.tsx']) {
      const s = src(f);
      expect(s).not.toContain('Marcus Vance');
      expect(s).not.toContain('Elena Rostova');
      expect(s).toMatch(/pending fresh intel/i);
    }
  });
});
