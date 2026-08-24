'use client';

import React, { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import type { FighterLoadout } from '@/lib/cosmetics/stats';

// The walking companion rig. Cosmetics attach at anchors when their catalog
// entry has a published model3d GLB; everything degrades gracefully.

interface CompanionAvatarProps {
  loadout?: FighterLoadout;
  /** true while the character is moving — drives bob/tilt */
  movingRef: React.MutableRefObject<boolean>;
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

function AuraLight({ colorRef }: { colorRef: React.MutableRefObject<string> }) {
  const light = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    if (!light.current) return;
    light.current.intensity = 1.6 + Math.sin(clock.elapsedTime * 3) * 0.4;
    light.current.color.set(colorRef.current);
  });
  return <pointLight ref={light} position={[0, 1.05, 0]} distance={5} />;
}

function modelGlb(item?: { render?: { kind: string } } | null): string | null {
  const r = item?.render as any;
  return r?.kind === 'model3d' && typeof r.glbUrl === 'string' ? r.glbUrl : null;
}

export function CompanionAvatar({ loadout, movingRef }: CompanionAvatarProps) {
  const group = useRef<THREE.Group>(null!);

  const headGlb = modelGlb(COSMETICS_CATALOG.find((c) => c.id === loadout?.HEAD));
  const wingsGlb = modelGlb(COSMETICS_CATALOG.find((c) => c.id === loadout?.TRAIL));
  const auraItem = COSMETICS_CATALOG.find((c) => c.id === loadout?.AURA);

  const auraColor = auraItem ? '#00F0FF' : '#00F0FF';
  const colorRef = useRef(auraColor);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const moving = movingRef.current;

    // Idle hover vs walk bob
    group.current.position.y = moving
      ? Math.abs(Math.sin(t * 9)) * 0.06
      : Math.sin(t * 1.8) * 0.04 + 0.02;
    // Slight forward lean while sprinting along
    group.current.rotation.x = moving ? 0.08 : 0;
  });

  return (
    <group ref={group} dispose={null}>
      {/* Torso */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 16, 32]} />
        <meshStandardMaterial color="#151722" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.24, 0]} castShadow>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial color="#10121C" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Chest core */}
      <mesh position={[0, 0.78, 0.2]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.32, 0.75, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.07, 0.4, 12, 16]} />
        <meshStandardMaterial color="#1E2232" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.32, 0.75, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.07, 0.4, 12, 16]} />
        <meshStandardMaterial color="#1E2232" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.12, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 12, 16]} />
        <meshStandardMaterial color="#11131D" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 12, 16]} />
        <meshStandardMaterial color="#11131D" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Cosmetic attachments (only render when a real GLB exists) */}
      <Suspense fallback={null}>
        {headGlb && <GLBAttachment url={headGlb} position={[0, 1.42, 0]} />}
        {wingsGlb && <GLBAttachment url={wingsGlb} position={[0, 0.85, -0.28]} scale={0.5} />}
      </Suspense>

      {/* Aura presence */}
      <AuraLight colorRef={colorRef} />
      {auraItem && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 48]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
