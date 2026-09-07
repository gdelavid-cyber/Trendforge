import { describe, expect, it } from 'vitest';
import { calculateSimilarity, isDuplicate, fingerprint } from '../lib/pipeline/index';

describe('track2 dedup', () => {
  it('flags near-duplicate titles', () => {
    expect(isDuplicate('AI voice agents for HVAC', ['ai voice agents for hvac!!'], 0.45)).toBe(true);
    expect(calculateSimilarity('a b c', 'a b c')).toBeGreaterThan(0.9);
  });

  it('normalizes fingerprint globally (lower.trim strip punctuation slice 120)', () => {
    expect(fingerprint('  AI Voice Agents for HVAC!! ')).toBe('ai voice agents for hvac');
    expect(fingerprint('Hello,  WORLD!!!')).toBe('hello  world');
    expect(fingerprint('x'.repeat(200)).length).toBeLessThanOrEqual(120);
  });

  it('isDuplicate respects 0.45 threshold (distinct titles are not dupes)', () => {
    expect(
      isDuplicate(
        'Deploy voice agents for dental clinics',
        ['Launch micro-saas directory for rust developers'],
        0.45,
      ),
    ).toBe(false);
  });
});
