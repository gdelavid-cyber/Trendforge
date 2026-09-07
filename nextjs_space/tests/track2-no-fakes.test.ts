import { describe, expect, it } from 'vitest';
describe('track2 no fakes', () => {
  it('buyer hunter returns live or pending, never mike chen', async () => {
    const mod = await import('../lib/earn/agents/buyer-hunter');
    const out: any = await mod.huntQualifiedBuyers({} as any);
    const s = JSON.stringify(out);
    expect(s).not.toContain('mike@mikeshvacdallas.com');
    expect(s).not.toContain('Marcus Vance');
  });
});
