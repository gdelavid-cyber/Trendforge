'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import type { FighterLoadout } from '@/lib/cosmetics/stats';
import { computeNextPosition, createMoveState, type MoveState } from './movement';
import type { CompanionAppearanceConfig } from '@/lib/companion/appearance';
import { useWorldControls } from './useWorldControls';
import { CompanionAvatar } from './CompanionAvatar';

const WORLD_BOUND = 36;

// ---------------------------------------------------------------------------
// City scenery
// ---------------------------------------------------------------------------

interface BuildingSpec {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

function makeBuildings(): BuildingSpec[] {
  const specs: BuildingSpec[] = [];
  const ring = WORLD_BOUND - 4;
  // Perimeter blocks with jitter for a skyline feel
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2;
    const radius = ring + (i % 3) * 3.5;
    specs.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: 4 + (i % 4) * 2.2,
      h: 6 + ((i * 7) % 5) * 5,
      d: 4 + ((i * 3) % 4) * 2,
    });
  }
  return specs;
}

function Buildings() {
  const specs = useMemo(makeBuildings, []);
  return (
    <group>
      {specs.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#0B0D18" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Neon roof edge */}
          <mesh position={[0, b.h / 2 + 0.03, 0]}>
            <boxGeometry args={[b.w + 0.15, 0.06, b.d + 0.15]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#FFD700' : '#00F0FF'} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_BOUND * 2 + 16, WORLD_BOUND * 2 + 16]} />
        <meshStandardMaterial color="#07070F" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Center plaza pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[7, 64]} />
        <meshStandardMaterial color="#0A0C16" roughness={0.7} metalness={0.3} />
      </mesh>
      <gridHelper args={[WORLD_BOUND * 2 + 12, 48, '#0E2436', '#0A1622']} position={[0, 0.02, 0]} />
    </group>
  );
}

function Props() {
  const spin1 = useRef<THREE.Mesh>(null!);
  const spin2 = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (spin1.current) spin1.current.rotation.y = clock.elapsedTime * 0.6;
    if (spin2.current) spin2.current.rotation.y = -clock.elapsedTime * 0.45;
  });
  return (
    <group>
      {/* Central beacon */}
      <mesh position={[0, 3.4, 0]}>
        <octahedronGeometry args={[0.85]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 4.2, 0]} intensity={2.2} distance={26} color="#00F0FF" />

      {/* Orbiting rings */}
      <mesh ref={spin1} position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10.5, 0.04, 8, 96]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      <mesh ref={spin2} position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0.35, 0]}>
        <torusGeometry args={[14, 0.03, 8, 96]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>

      {/* Glow benches/cubes */}
      {[
        [-9, 0.5, -9], [9, 0.5, -9], [-9, 0.5, 9], [9, 0.5, 9],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[1.6, 1, 1.6]} />
          <meshStandardMaterial color="#101426" roughness={0.4} metalness={0.7} emissive="#001a2e" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Player rig: controls + camera follow
// ---------------------------------------------------------------------------

function Player({ loadout, config }: { loadout?: FighterLoadout; config?: CompanionAppearanceConfig }) {
  const input = useWorldControls();
  const state = useRef<MoveState>(createMoveState());
  const group = useRef<THREE.Group>(null!);
  const movingRef = useRef(false);

  useFrame((_, dt) => {
    if (!group.current) return;
    const next = computeNextPosition(state.current, input.current, dt, { bound: WORLD_BOUND });
    state.current = next;
    movingRef.current =
      input.current.forward || input.current.back || input.current.left || input.current.right;

    group.current.position.set(next.x, next.y, next.z);
    group.current.rotation.y = next.facing;
  });

  return (
    <group ref={group}>
      <CompanionAvatar loadout={loadout} config={config} movingRef={movingRef} />
      <CameraFollow targetRef={group} movingRef={movingRef} />
    </group>
  );
}

function CameraFollow({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Group>;
  movingRef?: React.MutableRefObject<boolean>;
}) {
  useFrame(({ camera }, dt) => {
    const t = targetRef.current;
    if (!t) return;
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent smoothing
    const desired = new THREE.Vector3(t.position.x, t.position.y + 3.6, t.position.z + 7.2);
    camera.position.lerp(desired, k);
    camera.lookAt(t.position.x, t.position.y + 1.2, t.position.z);
  });
  return null;
}

// ---------------------------------------------------------------------------
// Scene root
// ---------------------------------------------------------------------------

export interface WorldCanvasProps {
  loadout?: FighterLoadout;
  config?: CompanionAppearanceConfig;
}

export function WorldCanvas({ loadout, config }: WorldCanvasProps) {
  const equippedChips = (['HEAD', 'BODY', 'AURA', 'TRAIL'] as const)
    .map((slot) => ({ slot, item: COSMETICS_CATALOG.find((c) => c.id === loadout?.[slot]) }))
    .filter((e) => e.item);

  return (
    <div className="relative w-full h-full">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        camera={{ fov: 55, position: [0, 3.6, 7.2] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#04040A']} />
        <fog attach="fog" args={['#04040A', 30, 95]} />

        <ambientLight intensity={0.45} />
        <directionalLight position={[12, 20, 8]} intensity={0.9} castShadow />
        <directionalLight position={[-10, -4, -8]} intensity={0.5} color="#00F0FF" />

        <Ground />
        <Buildings />
        <Props />
        <Player loadout={loadout} config={config} />
      </Canvas>

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <div className="font-orbitron font-black text-sm tracking-[0.3em] text-white/80 uppercase">
            The World <span className="text-[#00F0FF]">// Trendly</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
            WASD move · Shift sprint · Space jump
          </span>
        </div>

        {equippedChips.length > 0 && (
          <div className="absolute top-4 right-4 space-y-1.5">
            {equippedChips.map(({ slot, item }) => (
              <div
                key={slot}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md"
              >
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#00F0FF]/80">{slot}</span>
                <span className="text-[11px] font-mono text-white/90">{item!.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
