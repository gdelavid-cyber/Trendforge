import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('track1 sse order', () => {
  it('exports stream GET with taskId filter', async () => {
    const mod = await import('../app/api/activity/stream/route');
    expect(typeof mod.GET).toBe('function');
  });

  it('stream orders timestamp asc with cursor + taskId filter', () => {
    const src = fs.readFileSync('app/api/activity/stream/route.ts', 'utf8');
    expect(src).toContain('taskId');
    expect(src).toContain('cursor');
    expect(src).toContain('orderBy');
    expect(src).toContain("'asc'");
    expect(src).not.toContain("'desc'");
  });

  it('feed orders timestamp asc with cursor + taskId filter', () => {
    const src = fs.readFileSync('app/api/activity/feed/route.ts', 'utf8');
    expect(src).toContain('taskId');
    expect(src).toContain('cursor');
    expect(src).toContain('orderBy');
    expect(src).toContain("'asc'");
    expect(src).not.toContain("'desc'");
  });

  it('both routes stay force-dynamic', async () => {
    const stream = await import('../app/api/activity/stream/route');
    const feed = await import('../app/api/activity/feed/route');
    expect(stream.dynamic).toBe('force-dynamic');
    expect(feed.dynamic).toBe('force-dynamic');
  });
});
