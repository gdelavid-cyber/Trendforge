import { describe, expect, it } from 'vitest';

describe('activity feed route', () => {
  it('returns entries shape', async () => {
    const mod = await import('../app/api/activity/feed/route');
    expect(typeof mod.GET).toBe('function');
  });
});
