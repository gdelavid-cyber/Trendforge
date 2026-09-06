import { describe, expect, it } from 'vitest';
import * as fs from 'fs';

describe('engine transparency', () => {
  it('recordOutcome path uses emitter', () => {
    const src = fs.readFileSync('lib/execution/engine.ts', 'utf8');
    expect(src.includes('emitDone') || src.includes('emitBlocked')).toBe(true);
  });
});
