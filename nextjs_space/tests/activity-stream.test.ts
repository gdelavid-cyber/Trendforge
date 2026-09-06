import { describe, expect, it } from 'vitest';

describe('activity stream route', () => {
  it('exports GET', async () => {
    const mod = await import('../app/api/activity/stream/route');
    expect(typeof mod.GET).toBe('function');
  });
});
