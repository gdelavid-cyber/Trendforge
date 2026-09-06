import { describe, expect, it } from 'vitest';

describe('council approve feedback', () => {
  it('maps 403 to admin-only message', async () => {
    const mod = await import('../lib/council/approve-feedback');
    expect(mod.approveErrorMessage(403, 'Admin authorization required')).toContain('Admin');
  });

  it('passes through server errors otherwise', async () => {
    const mod = await import('../lib/council/approve-feedback');
    expect(mod.approveErrorMessage(500, 'DB blew up')).toBe('DB blew up');
  });

  it('falls back to generic message', async () => {
    const mod = await import('../lib/council/approve-feedback');
    expect(mod.approveErrorMessage(500, undefined)).toContain('Approve failed');
  });
});
