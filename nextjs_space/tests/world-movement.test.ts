import { describe, expect, it } from 'vitest';
import { computeNextPosition, createMoveState } from '../components/world/movement';

const BASE_INPUT = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
};

describe('world movement math', () => {
  it('stands still with no input', () => {
    const s = createMoveState();
    const next = computeNextPosition(s, { ...BASE_INPUT }, 0.016);
    expect(next.x).toBe(0);
    expect(next.z).toBe(0);
    expect(next.y).toBe(0);
  });

  it('moves forward along -z and turns to face travel direction', () => {
    let s = createMoveState();
    s = computeNextPosition(s, { ...BASE_INPUT, forward: true }, 0.25);
    expect(s.z).toBeLessThan(0);
    expect(s.x).toBe(0);
    // forward maps to facing atan2(ix=0, iz=-1) = PI
    expect(s.facing).toBeCloseTo(Math.PI, 5);
  });

  it('strafing right moves +x', () => {
    let s = createMoveState();
    s = computeNextPosition(s, { ...BASE_INPUT, right: true }, 0.5);
    expect(s.x).toBeGreaterThan(0);
    expect(s.z).toBe(0);
  });

  it('sprint covers more ground than walk at equal dt', () => {
    const walk = computeNextPosition(createMoveState(), { ...BASE_INPUT, forward: true }, 1);
    const sprint = computeNextPosition(createMoveState(), { ...BASE_INPUT, forward: true, sprint: true }, 1);
    expect(Math.abs(sprint.z)).toBeGreaterThan(Math.abs(walk.z));
  });

  it('jump leaves ground, gravity returns to rest', () => {
    let s = createMoveState();
    s = computeNextPosition(s, { ...BASE_INPUT, jump: true }, 0.016);
    expect(s.y).toBeGreaterThan(0);
    expect(s.vy).not.toBe(0);

    // simulate ~2s of falling
    for (let i = 0; i < 120; i++) {
      s = computeNextPosition(s, { ...BASE_INPUT }, 1 / 60);
    }
    expect(s.y).toBe(0);
    expect(s.vy).toBe(0);
  });

  it('clamps position to world bounds', () => {
    let s = createMoveState();
    s = { ...s, x: 35.9, z: -35.9 };
    s = computeNextPosition(s, { ...BASE_INPUT, right: true, forward: false, back: true }, 10);
    expect(s.x).toBeLessThanOrEqual(36);
    expect(s.z).toBeGreaterThanOrEqual(-36);
  });

  it('large dt spikes are clamped so tab-switches do not teleport the player', () => {
    const s = createMoveState();
    const next = computeNextPosition(s, { ...BASE_INPUT, forward: true }, 30);
    // max displacement = speed * sprint * dt-clamp(0.05) ≈ 7.7 * 0.05
    expect(Math.abs(next.z)).toBeLessThan(0.5);
  });
});
