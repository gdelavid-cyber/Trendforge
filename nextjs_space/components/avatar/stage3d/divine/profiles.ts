import * as THREE from 'three';

/**
 * Authored revolution profiles for the divine chassis.
 *
 * This file is the reason the form does not read as "stacked primitives". Each
 * body segment is a hand-placed 2D silhouette (radius, height) pushed through a
 * SplineCurve and revolved with LatheGeometry — so the surface carries authored
 * curvature (shoulder shelf, calf swell, chin taper) that a sphere or capsule
 * physically cannot express. Control points are coarse on purpose; the spline
 * supplies the continuous second derivative that makes a clearcoat highlight
 * travel smoothly instead of kinking at a facet boundary.
 *
 * Convention: every profile is authored bottom-to-top starting at radius 0, so
 * both poles seal and no backfaces are ever visible through the shell.
 */

type ControlPoint = [radius: number, height: number];

/**
 * Densifies a coarse control profile. SplineCurve can overshoot into negative
 * radius on tight curvature reversals, which would fold the lathe inside-out —
 * clamped rather than rejected so authoring stays forgiving.
 */
function densify(points: ControlPoint[], samples: number): THREE.Vector2[] {
  const curve = new THREE.SplineCurve(points.map(([r, h]) => new THREE.Vector2(r, h)));
  const out = curve.getPoints(samples);
  for (const p of out) if (p.x < 0) p.x = 0;
  return out;
}

const CONTROLS = {
  /** chest: waist -> ribs -> shoulder shelf -> sealed neck stump */
  torso: [
    [0, 0], [0.09, 0.006], [0.148, 0.028], [0.185, 0.105],
    [0.224, 0.220], [0.250, 0.340], [0.262, 0.436], [0.238, 0.505],
    [0.168, 0.562], [0.086, 0.602], [0, 0.628],
  ],
  /** hips: widest near the top, tapering to a sealed underside */
  pelvis: [
    [0, 0], [0.085, 0.015], [0.118, 0.062], [0.142, 0.140],
    [0.152, 0.210], [0.140, 0.262], [0.090, 0.290], [0, 0.302],
  ],
  /** faceless ovoid — chin at the base, crown sealed */
  skull: [
    [0, 0], [0.055, 0.012], [0.098, 0.055], [0.130, 0.130],
    [0.142, 0.205], [0.132, 0.275], [0.098, 0.325], [0.050, 0.355], [0, 0.365],
  ],
  /** detached shoulder lens — no strap, no bolt, it simply hovers */
  pauldron: [
    [0, 0], [0.070, 0.012], [0.125, 0.040], [0.152, 0.080],
    [0.146, 0.118], [0.110, 0.145], [0.058, 0.158], [0, 0.163],
  ],
  upperArm: [
    [0, 0], [0.040, 0.008], [0.062, 0.030], [0.072, 0.075],
    [0.070, 0.150], [0.062, 0.230], [0.054, 0.272], [0.036, 0.292], [0, 0.300],
  ],
  forearm: [
    [0, 0], [0.034, 0.007], [0.054, 0.028], [0.062, 0.072],
    [0.058, 0.150], [0.049, 0.225], [0.040, 0.268], [0.026, 0.290], [0, 0.298],
  ],
  /** no fingers: the divine form ends in a smooth manipulator pod */
  hand: [
    [0, 0], [0.030, 0.008], [0.048, 0.030], [0.056, 0.070],
    [0.052, 0.112], [0.038, 0.145], [0.020, 0.163], [0, 0.170],
  ],
  thigh: [
    [0, 0], [0.055, 0.010], [0.086, 0.040], [0.104, 0.100],
    [0.101, 0.200], [0.090, 0.300], [0.078, 0.360], [0.050, 0.388], [0, 0.400],
  ],
  /** authored ankle-up so the swell lands below the knee gap, as anatomy does */
  calf: [
    [0, 0], [0.030, 0.008], [0.046, 0.030], [0.052, 0.070],
    [0.058, 0.130], [0.072, 0.210], [0.086, 0.300], [0.090, 0.360],
    [0.070, 0.400], [0, 0.418],
  ],
  /** revolved round, then squashed and stretched by the rig into a foot */
  foot: [
    [0, 0], [0.050, 0.010], [0.078, 0.032], [0.090, 0.062],
    [0.082, 0.088], [0.052, 0.104], [0, 0.112],
  ],
  /** single floating vertebra bridging the neck gap */
  vertebra: [
    [0, 0], [0.042, 0.014], [0.052, 0.040], [0.042, 0.066], [0, 0.080],
  ],
  /** spine shards trailing the back */
  shard: [
    [0, 0], [0.030, 0.010], [0.038, 0.032], [0.026, 0.058], [0, 0.070],
  ],
} satisfies Record<string, ControlPoint[]>;

export type FormKey = keyof typeof CONTROLS;

/** Profile sample count and revolution segments per form — spent where silhouette shows. */
const TESSELLATION: Record<FormKey, { samples: number; radial: number }> = {
  torso: { samples: 96, radial: 72 },
  pelvis: { samples: 64, radial: 64 },
  skull: { samples: 80, radial: 72 },
  pauldron: { samples: 56, radial: 56 },
  upperArm: { samples: 56, radial: 40 },
  forearm: { samples: 56, radial: 40 },
  hand: { samples: 40, radial: 32 },
  thigh: { samples: 64, radial: 44 },
  calf: { samples: 64, radial: 44 },
  foot: { samples: 40, radial: 40 },
  vertebra: { samples: 32, radial: 28 },
  shard: { samples: 28, radial: 20 },
};

const cache = new Map<FormKey, THREE.LatheGeometry>();

/**
 * Shared per-form geometry. Every stage on the page revolves the same buffers —
 * the launch feed, the battle cards and the widget orb together cost one upload
 * per form, not one per mounted companion.
 */
export function form(key: FormKey): THREE.LatheGeometry {
  const hit = cache.get(key);
  if (hit) return hit;
  const { samples, radial } = TESSELLATION[key];
  const geo = new THREE.LatheGeometry(densify(CONTROLS[key], samples), radial);
  geo.computeVertexNormals();
  geo.name = `divine_${key}`;
  cache.set(key, geo);
  return geo;
}

/** Height of a form in local units — the rig stacks segments off these, not magic numbers. */
export function formHeight(key: FormKey): number {
  const pts = CONTROLS[key];
  return pts[pts.length - 1][1];
}

/** Widest radius of a form — used to size gap rings and orbital radii. */
export function formRadius(key: FormKey): number {
  return CONTROLS[key].reduce((m, p) => Math.max(m, p[0]), 0);
}

/** Only meaningful if the module is ever hot-swapped; kept so the cache is not a leak by design. */
export function disposeForms(): void {
  cache.forEach((g) => g.dispose());
  cache.clear();
}
