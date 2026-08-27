/**
 * Shared GLSL noise chunk.
 *
 * Hash-based value noise rather than a texture lookup: the companion mounts in
 * several stages at once (launch feed, battle cards, widget orb) and a shared
 * 3D noise texture would be another upload plus a sampler per material. This
 * costs ALU instead, which the fragment budget on a 320px stage can absorb.
 */
export const GLSL_NOISE = /* glsl */ `
float dHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float dNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(dHash(i + vec3(0.0, 0.0, 0.0)), dHash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(dHash(i + vec3(0.0, 1.0, 0.0)), dHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(dHash(i + vec3(0.0, 0.0, 1.0)), dHash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(dHash(i + vec3(0.0, 1.0, 1.0)), dHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z
  );
}

float dFbm(vec3 p, int octaves) {
  float amp = 0.5;
  float sum = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amp * dNoise(p);
    // 2.02 rather than 2.0 breaks lattice alignment between octaves, which
    // otherwise stacks the value-noise grid into visible axis-aligned banding
    p *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

/** 1D hash for per-column vocoder amplitudes. */
float dHash1(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}
`;

/** Standard varyings + world-space view vector, shared by every divine shader. */
export const GLSL_VERTEX = /* glsl */ `
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec2 vUvD;

void main() {
  vUvD = uv;
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  // mat3(modelMatrix) skews normals under non-uniform scale; acceptable here
  // because every consumer is an additive glow where a few degrees of normal
  // error is invisible, and it avoids a second uniform upload per frame.
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewW = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
