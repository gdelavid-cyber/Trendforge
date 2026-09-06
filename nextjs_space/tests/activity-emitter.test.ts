import { describe, expect, it } from 'vitest';

describe('activity emitter', () => {
  it('exports five emit functions', async () => {
    const mod = await import('../lib/activity/emitter');
    expect(typeof mod.emitStart).toBe('function');
    expect(typeof mod.emitProgress).toBe('function');
    expect(typeof mod.emitDone).toBe('function');
    expect(typeof mod.emitBlocked).toBe('function');
    expect(typeof mod.requestAck).toBe('function');
  });
});
