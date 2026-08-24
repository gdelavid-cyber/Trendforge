// Pure kinematic movement math for The World. No three.js imports here so it
// stays unit-testable and engine-agnostic.

export interface MoveState {
  x: number;
  z: number;
  /** vertical position (jump arc) */
  y: number;
  /** vertical velocity */
  vy: number;
  /** yaw in radians, normalized to [-PI, PI] */
  facing: number;
}

export interface MoveInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
}

export interface MoveConfig {
  speed?: number;
  sprintMultiplier?: number;
  jumpVelocity?: number;
  gravity?: number;
  /** world is a square: coordinates clamped to ±bound */
  bound?: number;
}

const DEFAULTS = {
  speed: 4.4,
  sprintMultiplier: 1.75,
  jumpVelocity: 5.6,
  gravity: -14,
  bound: 36,
};

function normalizeAngle(a: number): number {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

export function createMoveState(): MoveState {
  return { x: 0, z: 0, y: 0, vy: 0, facing: 0 };
}

/**
 * Advances one frame of kinematic movement. dt is seconds (clamped internally
 * against tab-switch spikes).
 */
export function computeNextPosition(
  state: MoveState,
  input: MoveInput,
  dtRaw: number,
  cfg: MoveConfig = {}
): MoveState {
  const { speed, sprintMultiplier, jumpVelocity, gravity, bound } = { ...DEFAULTS, ...cfg };
  const dt = Math.min(Math.max(dtRaw, 0), 0.05);

  // Input direction in local space (z = forward)
  let ix = 0;
  let iz = 0;
  if (input.forward) iz -= 1;
  if (input.back) iz += 1;
  if (input.left) ix -= 1;
  if (input.right) ix += 1;

  const len = Math.hypot(ix, iz);
  const moving = len > 0;
  if (moving) {
    ix /= len;
    iz /= len;
  }

  const v = speed * (input.sprint ? sprintMultiplier : 1);

  // Facing follows movement direction smoothly-ish (snap-free but immediate)
  let facing = state.facing;
  if (moving) {
    const target = Math.atan2(ix, iz);
    facing = normalizeAngle(facing + normalizeAngle(target - facing));
  }

  // Horizontal displacement (camera-relative: world axes align with input)
  const nx = clamp(state.x + ix * v * dt, -bound, bound);
  const nz = clamp(state.z + iz * v * dt, -bound, bound);

  // Vertical: jump + gravity
  let { y, vy } = state;
  const grounded = y <= 0 && vy <= 0;
  if (grounded && input.jump) {
    vy = jumpVelocity;
    y = 0.001;
  }
  vy += gravity * dt;
  y += vy * dt;
  if (y <= 0) {
    y = 0;
    vy = 0;
  }

  return { x: nx, z: nz, y, vy, facing };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
