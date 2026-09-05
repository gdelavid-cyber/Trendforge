'use client';

import React, { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { COSMETICS_CATALOG } from '@/lib/experience/cosmetics/catalog';
import type { FighterLoadout } from '@/lib/experience/cosmetics/stats';
import { resolveRig, type CompanionAppearanceConfig } from '@/lib/intelligence/companion/appearance';

// The walking companion rig. Config-driven variants (humanoid/animal/abstract),
// body proportions and skin materials. Cosmetics attach at anchors when their
// catalog entry has a published model3d GLB; everything degrades gracefully.

interface CompanionAvatarProps {
  loadout?: FighterLoadout;
  config?: CompanionAppearanceConfig;
  /** true while the character is moving — drives bob/tilt */
  movingRef: React.MutableRefObject<boolean>;
}

function modelGlb(item?: { render?: { kind: string } } | null): string | null {
  const r = item?.render as any;
  return r?.kind === 'model3d' && typeof r.glbUrl === 'string' ? r.glbUrl : null;
}

function GLBAttachment({ url, position, scale }: { url: string; position: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return (
    <primitive
      object={cloned}
      position={position}
      scale={scale ?? 0.45}
    />
  );
}

function AuraLight() {
  const light = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    if (!light.current) return;
    light.current.intensity = 1.6 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return <pointLight ref={light} position={[0, 1.05, 0]} distance={5} color="#00F0FF" />;
}

function HumanoidRig({ mat, w, h }: { mat: RigMat; w: number; h: number }) {
  return (
    <>
      <mesh position={[0, 0.72 * h, 0]} scale={[w, h, w]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 16, 32]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 1.24 * h, 0]} castShadow>
        <sphereGeometry args={[0.16 * w, 32, 32]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0.78, 0.2]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[-0.32 * w, 0.75 * h, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.07, 0.4 * h, 12, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0.32 * w, 0.75 * h, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.07, 0.4 * h, 12, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[-0.12 * w, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4 * h, 12, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0.12 * w, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4 * h, 12, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </>
  );
}

function AnimalRig({ mat }: { mat: RigMat }) {
  return (
    <>
      {/* Low quad body */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.6, 12, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Head forward */}
      <mesh position={[0, 0.72, -0.52]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Ears */}
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.9, -0.5]}>
          <coneGeometry args={[0.05, 0.16, 8]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
      {/* Four legs */}
      {[
        [-0.14, -0.34],
        [0.14, -0.34],
        [-0.14, 0.3],
        [0.14, 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}>
          <capsuleGeometry args={[0.055, 0.36, 8, 16]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
      {/* Core light */}
      <mesh position={[0, 0.62, -0.15]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>
    </>
  );
}

function AbstractRig({ mat }: { mat: RigMat }) {
  const core = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (core.current) {
      core.current.rotation.y = clock.elapsedTime * 0.8;
      core.current.position.y = 1.05 + Math.sin(clock.elapsedTime * 1.6) * 0.06;
    }
    if (ring.current) ring.current.rotation.z = clock.elapsedTime * 0.9;
  });
  return (
    <>
      <mesh ref={core} position={[0, 1.05, 0]} castShadow>
        <octahedronGeometry args={[0.42]} />
        <meshStandardMaterial {...mat} emissive={mat.color} emissiveIntensity={Math.max(mat.emissiveIntensity ?? 0, 0.7)} />
      </mesh>
      <mesh ref={ring} position={[0, 1.05, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.72, 0.02, 8, 64]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      <pointLight position={[0, 1.05, 0]} intensity={1.4} distance={4} color="#00F0FF" />
    </>
  );
}

type RigMat = {
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
};

export function CompanionAvatar({
  loadout,
  config,
  movingRef,
}: CompanionAvatarProps) {
  const group = useRef<THREE.Group>(null!);

  const rig = useMemo(() => resolveRig(config), [config]);
  const mat: RigMat = useMemo(() => {
    const m: RigMat = { ...rig.materials };
    if (m.emissiveIntensity && m.emissiveIntensity > 0) m.emissive = m.color;
    return m;
  }, [rig.materials]);

  const headItem = COSMETICS_CATALOG.find((c) => c.id === loadout?.HEAD);
  const eyesItem = COSMETICS_CATALOG.find((c) => c.id === loadout?.EYEWEAR);
  const wingsItem = COSMETICS_CATALOG.find((c) => c.id === loadout?.TRAIL);
  const headGlb = modelGlb(headItem);
  const eyesGlb = modelGlb(eyesItem);
  const wingsGlb = modelGlb(wingsItem);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const moving = movingRef.current;

    group.current.position.y = moving
      ? Math.abs(Math.sin(t * 9)) * 0.06
      : Math.sin(t * 1.8) * 0.04 + 0.02;
    group.current.rotation.x = moving ? 0.08 : 0;
  });

  // Anchor heights shift with proportion height for humanoids.
  const h = rig.variant === 'humanoid' ? rig.scale.height : 1;

  return (
    <group ref={group} dispose={null}>
      {rig.variant === 'humanoid' && <HumanoidRig mat={mat} w={rig.scale.width} h={h} />}
      {rig.variant === 'animal' && <AnimalRig mat={mat} />}
      {rig.variant === 'abstract' && <AbstractRig mat={mat} />}

      {/* Cosmetic attachments (only render when a real GLB exists) */}
      <Suspense fallback={null}>
        {headGlb && <GLBAttachment url={headGlb} position={[0, (1.24 * h) + 0.18, 0]} />}
        {eyesGlb && rig.variant === 'humanoid' && (
          <GLBAttachment url={eyesGlb} position={[0, 1.24 * h, 0.12]} scale={0.35} />
        )}
        {wingsGlb && <GLBAttachment url={wingsGlb} position={[0, 0.85, -0.28]} scale={0.5} />}
      </Suspense>

      {/* Aura presence */}
      <AuraLight />
      {auraRingVisible(loadout) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 48]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function auraRingVisible(loadout?: FighterLoadout): boolean {
  return Boolean(loadout?.AURA && COSMETICS_CATALOG.find((c) => c.id === loadout.AURA));
}
