import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('track1 team activity wraps', () => {
  it('emitter exposes start and done', async () => {
    const { emitStart, emitDone } = await import('../lib/activity/emitter');
    expect(typeof emitStart).toBe('function');
    expect(typeof emitDone).toBe('function');
  });

  it('exports useTeamActivity hook', async () => {
    const mod = await import('../hooks/useTeamActivity');
    expect(typeof mod.useTeamActivity).toBe('function');
  });

  it('run wraps executes with emitStart/emitDone + toast success/error', () => {
    const src = fs.readFileSync('hooks/useTeamActivity.ts', 'utf8');
    expect(src).toContain('emitStart');
    expect(src).toContain('emitDone');
    expect(src).toContain('toast.loading');
    expect(src).toContain('toast.success');
    expect(src).toContain('toast.error');
  });
});
