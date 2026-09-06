import { describe, expect, it } from 'vitest';

describe('useTeamActivity hook', () => {
  it('exports hook', async () => {
    const mod = await import('../hooks/useTeamActivity');
    expect(typeof mod.useTeamActivity).toBe('function');
  });
});
