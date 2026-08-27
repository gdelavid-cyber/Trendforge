'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FighterLoadout } from '@/lib/cosmetics/stats';
import type { AvatarEmotion } from '@/hooks/useAvatar';
import { form, formHeight, formRadius, type FormKey } from './profiles';
import { createMaterials, lightMaterial, filmMaterial, type DivineMaterials, type Quality } from './materials';
import { composePalette } from './palette';
import { GLSL_NOISE, GLSL_VERTEX } from './shaders/noise';

export interface DivineCompanionProps {
  avatarId?: string;
  loadout?: FighterLoadout;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  /** shows the holographic work station + typing arms + progress halo */
  isWorking?: boolean;
  workLabel?: string;
  /** 0..1 — omit to auto-loop */
  workProgress?: number;
  /** baseline yaw so face-off views can turn characters toward each other */
  faceAngle?: number;
  /** cinematic uses transmission glass + heavier tessellation; lite trades both for perf */
  quality?: Quality;
}

interface MotionProfile {
  bobSpeed: number;
  bobAmp: number;
  headPitch: number;
  headRoll: number;
  armPose: 'relaxed' | 'guard' | 'chin' | 'cheer' | 'out';
}

function motionProfile(e: AvatarEmotion): MotionProfile {
  switch (e) {
    case 'battle':
      return { bobSpeed: 5.4, bobAmp: 0.045, headPitch: -0.1, headRoll: 0, armPose: 'guard' };
    case 'thinking':
      return { bobSpeed: 1.5, bobAmp: 0.018, headPitch: 0.1, headRoll: 0.14, armPose: 'chin' };
    case 'happy':
      return { bobSpeed: 4.4, bobAmp: 0.06, headPitch: -0.05, headRoll: 0, armPose: 'cheer' };
    case 'surprised':
      return { bobSpeed: 5.8, bobAmp: 0.03, headPitch: -0.12, headRoll: -0.06, armPose: 'out' };
    case 'neutral':
      return { bobSpeed: 2.0, bobAmp: 0.026, headPitch: 0, headRoll: 0, armPose: 'relaxed' };
    default:
      return { bobSpeed: 2.6, bobAmp: 0.03, headPitch: -0.02, headRoll: 0, armPose: 'relaxed' };
  }
}

/* ---- shared shader sources (build on the divine noise chunk) ---- */

const AURA_FRAG =
  GLSL_NOISE +
  `
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec2 vUvD;
void main() {
  float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 2.4);
  float n = dFbm(vLocal * 2.2 + vec3(0.0, uTime * 0.25, uTime * 0.1), 4);
  float a = fres * (0.30 + n * 0.70) * uIntensity;
  vec3 col = uColor * (0.5 + n * 0.9);
  gl_FragColor = vec4(col, a);
}`;

const HALO_FRAG = `
uniform vec3 uColor;
uniform float uProgress;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec2 vUvD;
void main() {
  float ang = atan(vLocal.y, vLocal.x);
  float p = ang / 6.2831853 + 0.5;
  float on = step(p, uProgress);
  float head = smoothstep(uProgress, uProgress - 0.04, p);
  vec3 col = uColor * (0.4 + on * 0.9 + head * 1.6);
  float a = 0.12 + on * 0.8;
  gl_FragColor = vec4(col, a);
}`;

const DECK_FRAG =
  GLSL_NOISE +
  `
uniform vec3 uColor;
uniform float uTime;
uniform float uProgress;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;
varying vec2 vUvD;
void main() {
  vec2 uv = vUvD;
  float scan = sin(uv.y * 38.0 - uTime * 6.0) * 0.5 + 0.5;
  float grid = step(0.93, fract(uv.x * 7.0));
  float prog = step(uv.y, uProgress) * step(abs(uv.x - 0.5), 0.42);
  float n = dFbm(vec3(uv * 6.0, uTime * 0.5), 3);
  vec3 col = uColor * (0.2 + scan * 0.25 + prog * 0.7 + grid * 0.3 + n * 0.2);
  float a = 0.12 + scan * 0.1 + prog * 0.45 + grid * 0.15;
  gl_FragColor = vec4(col, a);
}`;

/** Segment stacking. Forms are bottom-anchored (radius 0 at y=0), so each
 *  mesh's local position.y is simply the running base height. */
const L = {
  foot: formHeight('foot'),
  calf: formHeight('calf'),
  thigh: formHeight('thigh'),
  pelvis: formHeight('pelvis'),
  torso: formHeight('torso'),
  vertebra: formHeight('vertebra'),
  skull: formHeight('skull'),
  upperArm: formHeight('upperArm'),
  forearm: formHeight('forearm'),
  hand: formHeight('hand'),
  pauldron: formHeight('pauldron'),
};

const Y = {
  foot: 0,
  calf: L.foot * 0.4,
  thigh: L.foot * 0.4 + L.calf * 0.92,
  pelvis: L.foot * 0.4 + L.calf * 0.92 + L.thigh * 0.95,
  torso: L.foot * 0.4 + L.calf * 0.92 + L.thigh * 0.95 + L.pelvis * 0.96,
  vertebra: L.foot * 0.4 + L.calf * 0.92 + L.thigh * 0.95 + L.pelvis * 0.96 + L.torso * 0.99,
  skull: L.foot * 0.4 + L.calf * 0.92 + L.thigh * 0.95 + L.pelvis * 0.96 + L.torso * 0.99 + L.vertebra * 0.9,
};

const SHOULDER_Y = Y.torso + L.torso * 0.86;
const HIP_Y = Y.pelvis + L.pelvis * 0.1;
const HEAD_CENTER_Y = Y.skull + L.skull * 0.55;
const CHEST_Y = Y.torso + L.torso * 0.45;

function Lathe({
  k,
  material,
  position,
  rotation,
  scale,
}: {
  k: FormKey;
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <mesh geometry={form(k)} material={material} position={position} rotation={rotation} scale={scale} castShadow receiveShadow />
  );
}

export function DivineCompanion({
  avatarId,
  loadout,
  emotion = 'confident',
  isSpeaking = false,
  isWorking = false,
  workLabel,
  workProgress,
  faceAngle = 0,
  quality = 'cinematic',
}: DivineCompanionProps) {
  const arch = (avatarId ?? 'cyber_humanoid') as string;
  const palette = useMemo(() => composePalette(arch, { BODY: loadout?.BODY, AURA: loadout?.AURA }), [arch, loadout?.BODY, loadout?.AURA]);
  const profile = motionProfile(emotion);

  const mats = useMemo<DivineMaterials>(() => createMaterials(palette, quality), [palette, quality]);
  const coreHot = useMemo(() => lightMaterial(palette.coreHot, 4.5), [palette.coreHot]);
  const coreGlow = useMemo(() => lightMaterial(palette.core, 3), [palette.core]);
  const ringMat = useMemo(() => lightMaterial(palette.halo, 3.2), [palette.halo]);
  const visorMat = useMemo(() => lightMaterial(palette.halo, 2.6), [palette.halo]);
  const shardMat = useMemo(() => filmMaterial(palette.aura, 0.32), [palette.aura]);

  const auraUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(palette.aura) },
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    }),
    [palette.aura]
  );
  const haloUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(palette.halo) }, uProgress: { value: 0 } }),
    [palette.halo]
  );
  const deckUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(palette.core) }, uTime: { value: 0 }, uProgress: { value: 0 } }),
    [palette.core]
  );

  useEffect(() => {
    return () => {
      mats.dispose();
      coreHot.dispose();
      coreGlow.dispose();
      ringMat.dispose();
      visorMat.dispose();
      shardMat.dispose();
    };
  }, [mats, coreHot, coreGlow, ringMat, visorMat, shardMat]);

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const headGrp = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const auraMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);
  const deckMatRef = useRef<THREE.ShaderMaterial>(null);
  const workGrp = useRef<THREE.Group>(null);
  const workHalo = useRef<THREE.Mesh>(null);
  const bars = useRef<THREE.Mesh[]>([]);

  const hopRef = useRef({ start: -10, pending: false });
  const gestureRef = useRef({ next: 0, raised: false });
  const yawVelRef = useRef(0);
  const prevYawRef = useRef(0);

  useEffect(() => {
    hopRef.current.pending = true;
  }, [emotion]);

  const headRadius = formRadius('skull');
  const auraScale: [number, number, number] = [0.62, Y.skull + L.skull + 0.25, 0.62];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const lerpK = 1 - Math.exp(-delta * 12);

    // emotion-change hop: parabolic jump + squash-stretch
    const hop = hopRef.current;
    if (hop.pending) {
      hop.start = t;
      hop.pending = false;
    }
    let hopY = 0;
    let squash = 1;
    if (hop.start >= 0) {
      const ht = t - hop.start;
      if (ht < 0.5) {
        const k = ht / 0.5;
        hopY = Math.sin(k * Math.PI) * 0.085;
        squash = 1 + Math.sin(k * Math.PI * 2) * 0.055;
      } else {
        hop.start = -10;
      }
    }

    const g = gestureRef.current;
    if (isSpeaking && t > g.next) {
      g.next = t + 0.85;
      g.raised = !g.raised;
    }

    if (root.current) {
      root.current.position.y = -0.42 + hopY + Math.sin(t * profile.bobSpeed) * profile.bobAmp;
      root.current.position.x = Math.sin(t * 0.5) * 0.012;
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, faceAngle + state.pointer.x * 0.3, 3, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, Math.sin(t * 0.65) * 0.022, 2, delta);

      const yaw = root.current.rotation.y;
      yawVelRef.current = THREE.MathUtils.lerp(yawVelRef.current, (yaw - prevYawRef.current) / Math.max(delta, 1e-4), 0.12);
      prevYawRef.current = yaw;
    }
    if (body.current) {
      const breathe = 1 + Math.sin(t * 2.1 + (isSpeaking ? t * 6 : 0)) * 0.015;
      body.current.scale.set(breathe / squash, breathe * squash, breathe / squash);
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, isSpeaking ? 0.05 : 0, 4, delta);
    }
    if (headGrp.current) {
      const nod = isSpeaking ? Math.sin(t * 10) * 0.05 : 0;
      const workPitch = isWorking ? 0.22 : 0;
      headGrp.current.rotation.y = THREE.MathUtils.damp(headGrp.current.rotation.y, state.pointer.x * 0.6, 4, delta);
      headGrp.current.rotation.x = THREE.MathUtils.damp(
        headGrp.current.rotation.x,
        profile.headPitch + workPitch - state.pointer.y * 0.28 + nod,
        4,
        delta
      );
      headGrp.current.rotation.z = THREE.MathUtils.damp(headGrp.current.rotation.z, profile.headRoll, 4, delta);
    }
    if (armL.current && armR.current) {
      const pose = profile.armPose;
      const swingL = pose === 'relaxed' ? Math.sin(t * profile.bobSpeed) * 0.08 : 0;
      const swingR = pose === 'relaxed' ? Math.cos(t * profile.bobSpeed) * 0.08 : 0;
      let txL = pose === 'guard' ? -1.5 : pose === 'chin' ? -2.35 : pose === 'cheer' ? -2.7 : pose === 'out' ? -1.1 : swingL - 0.12;
      let txR = pose === 'guard' ? -1.2 : pose === 'chin' ? -0.25 : pose === 'cheer' ? -2.7 : pose === 'out' ? -1.1 : swingR - 0.12;
      let tz = pose === 'guard' ? 0.45 : pose === 'out' ? 0.7 : 0.14;

      if (isSpeaking && pose !== 'chin') {
        txR = g.raised ? -2.25 : -0.7;
        tz += Math.sin(t * 8) * 0.22;
        txL += Math.sin(t * 5.3) * 0.06;
      }
      if (isWorking) {
        txL = -1.04 + Math.sin(t * 11) * 0.1;
        txR = -1.04 + Math.cos(t * 9.3) * 0.1;
        tz = 0.3;
      }
      armL.current.rotation.x += (txL - armL.current.rotation.x) * lerpK;
      armR.current.rotation.x += (txR - armR.current.rotation.x) * lerpK;
      armL.current.rotation.z += (tz - armL.current.rotation.z) * lerpK;
      armR.current.rotation.z += (-tz - armR.current.rotation.z) * lerpK;
    }

    // star-core plasma pulse
    if (core.current) {
      const pulse = 1 + Math.sin(t * 3.2) * 0.06 + (isSpeaking ? Math.sin(t * 12) * 0.04 : 0);
      core.current.scale.setScalar(pulse);
    }

    // aura shimmer
    if (auraMatRef.current) {
      auraMatRef.current.uniforms.uTime.value = t;
      const target = isWorking ? 1.5 : isSpeaking ? 1.25 : 1;
      auraMatRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        auraMatRef.current.uniforms.uIntensity.value,
        target,
        lerpK
      );
    }

    // work station visibility + progress
    const wp = workProgress ?? (isWorking ? (t * 0.18) % 1 : 0);
    if (workGrp.current) workGrp.current.visible = isWorking;
    if (deckMatRef.current) {
      deckMatRef.current.uniforms.uTime.value = t;
      deckMatRef.current.uniforms.uProgress.value = wp;
    }
    if (haloMatRef.current) {
      const target = isWorking ? wp : 0;
      haloMatRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        haloMatRef.current.uniforms.uProgress.value,
        target,
        lerpK
      );
    }
    bars.current.forEach((b, i) => {
      if (!b) return;
      const amp = isWorking ? 0.4 + Math.abs(Math.sin(t * (4 + i) + i)) * 0.9 : 0.05;
      b.scale.y = THREE.MathUtils.lerp(b.scale.y, amp, lerpK);
    });
  });

  return (
    <group ref={root} position={[0, -0.42, 0]} scale={0.6}>
      {/* ---------- aura field (fresnel + fbm energy shell) ---------- */}
      <mesh position={[0, CHEST_Y, 0]} scale={auraScale}>
        <sphereGeometry args={[1, 40, 40]} />
        <shaderMaterial
          ref={auraMatRef}
          vertexShader={GLSL_VERTEX}
          fragmentShader={AURA_FRAG}
          uniforms={auraUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* ---------- body ---------- */}
      <group ref={body}>
        <Lathe k="pelvis" material={mats.shellDeep} position={[0, Y.pelvis, 0]} />
        <Lathe k="torso" material={mats.shell} position={[0, Y.torso, 0]} />

        {/* translucent chest window + star-core plasma */}
        <mesh position={[0, CHEST_Y, 0.06]} material={mats.glass}>
          <sphereGeometry args={[0.12, 24, 24]} />
        </mesh>
        <mesh ref={core} position={[0, CHEST_Y, 0.04]} material={coreGlow}>
          <icosahedronGeometry args={[0.07, 1]} />
        </mesh>
        <mesh position={[0, CHEST_Y, 0.04]} material={coreHot}>
          <icosahedronGeometry args={[0.035, 0]} />
        </mesh>

        {/* hip joint gap rings */}
        {[-1, 1].map((s) => (
          <mesh key={`hipr${s}`} position={[s * 0.07, HIP_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
            <torusGeometry args={[0.05, 0.008, 8, 24]} />
          </mesh>
        ))}

        {/* legs — pivot at hip so they can be animated later */}
        {[-1, 1].map((s) => (
          <group key={`leg${s}`} position={[s * 0.09, HIP_Y, 0]}>
            <Lathe k="thigh" material={mats.shell} position={[0, 0, 0]} />
            <Lathe k="calf" material={mats.shellDeep} position={[0, -L.thigh, 0]} />
            <Lathe k="foot" material={mats.shellDeep} position={[0, -L.thigh - L.calf, 0]} scale={[1.1, 0.7, 1.5]} />
            {/* knee gap ring */}
            <mesh position={[0, -L.thigh * 0.92, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
              <torusGeometry args={[0.04, 0.007, 8, 20]} />
            </mesh>
          </group>
        ))}

        {/* spine shards trailing the back */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`shard${i}`}
            geometry={form('shard')}
            material={shardMat}
            position={[0, Y.torso + L.torso * 0.7 - i * 0.16, -0.12 - i * 0.03]}
            rotation={[0.5 + i * 0.12, 0, 0]}
            scale={[1 - i * 0.12, 1 - i * 0.12, 1 - i * 0.12]}
          />
        ))}

        {/* neck vertebra bridging torso -> skull */}
        <Lathe k="vertebra" material={mats.shellDeep} position={[0, Y.vertebra, 0]} />

        {/* arms — pivot at shoulder */}
        {[-1, 1].map((s) => (
          <group key={`armg${s}`} position={[s * 0.255, SHOULDER_Y, 0]}>
            <group ref={s === -1 ? armL : armR}>
              {/* detached hovering pauldron lens */}
              <Lathe k="pauldron" material={mats.haloMetal} position={[0, 0.04, 0]} scale={[1, 1, 0.6]} />
              {/* shoulder joint glow */}
              <mesh position={[0, -0.02, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
                <torusGeometry args={[0.045, 0.007, 8, 20]} />
              </mesh>
              <Lathe k="upperArm" material={mats.shell} position={[0, 0, 0]} />
              <Lathe k="forearm" material={mats.shell} position={[0, -L.upperArm, 0]} />
              <Lathe k="hand" material={mats.shellDeep} position={[0, -L.upperArm - L.forearm, 0]} />
            </group>
          </group>
        ))}
      </group>

      {/* ---------- head ---------- */}
      <group ref={headGrp} position={[0, Y.skull, 0]}>
        <Lathe k="skull" material={mats.shell} position={[0, 0, 0]} />
        {/* halo visor — the faceless face: emissive brow band + orbital ring */}
        <mesh position={[0, L.skull * 0.18, headRadius * 0.78]} rotation={[0.1, 0, 0]} material={visorMat}>
          <torusGeometry args={[headRadius * 0.9, 0.012, 8, 32]} />
        </mesh>
        <mesh position={[0, L.skull * 0.55, headRadius * 0.2]} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
          <torusGeometry args={[headRadius * 1.04, 0.01, 8, 32]} />
        </mesh>
      </group>

      {/* ---------- work station ---------- */}
      <group ref={workGrp} visible={false}>
        {/* holographic deck in front of chest */}
        <group position={[0, CHEST_Y, 0.32]} rotation={[-0.35, 0, 0]}>
          <mesh>
            <planeGeometry args={[0.5, 0.36]} />
            <shaderMaterial
              ref={deckMatRef}
              vertexShader={GLSL_VERTEX}
              fragmentShader={DECK_FRAG}
              uniforms={deckUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              ref={(m: THREE.Mesh | null) => {
                if (m) bars.current[i] = m;
              }}
              position={[-0.18 + i * 0.09, -0.1, 0.001]}
              material={ringMat}
            >
              <boxGeometry args={[0.04, 0.2, 0.01]} />
            </mesh>
          ))}
        </group>
        {/* progress comet halo above the head */}
        <mesh ref={workHalo} position={[0, Y.skull + L.skull + 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.016, 10, 48]} />
          <shaderMaterial
            ref={haloMatRef}
            vertexShader={GLSL_VERTEX}
            fragmentShader={HALO_FRAG}
            uniforms={haloUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export default DivineCompanion;
