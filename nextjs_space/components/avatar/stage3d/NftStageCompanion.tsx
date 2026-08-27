'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ARCHETYPE_REGISTRY, normalizeArchetype, PortraitArchetype } from '@/components/avatar/CompanionPortrait';
import type { AvatarEmotion } from '@/hooks/useAvatar';
import type { FighterLoadout } from '@/lib/cosmetics/stats';

export interface NftStageCompanionProps {
  avatarId?: string;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  loadout?: FighterLoadout;
}

export function NftStageCompanion({
  avatarId = 'cyber_humanoid',
  emotion = 'confident',
  isSpeaking = false,
  isWorking = false,
  workLabel,
  workProgress,
}: NftStageCompanionProps) {
  const arch = normalizeArchetype(avatarId);
  const meta = ARCHETYPE_REGISTRY[arch];

  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  // Load high-resolution 3D NFT character texture
  const texture = useTexture(meta.image);
  texture.colorSpace = THREE.SRGBColorSpace;

  const accentColor = useMemo(() => new THREE.Color(meta.accentHex), [meta.accentHex]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Organic breathing & subtle floating movement
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.04 + 0.55;
      groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.06;
    }

    // Rotating 3D Holographic Halo Rings
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.6;
      haloRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 1.2) * 0.1;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.4;
      ringRef.current.rotation.y = Math.cos(t * 0.9) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.55, 0]}>
      {/* 3D Holographic Character Plane with Volumetric Curve and Rim Glow */}
      <mesh ref={planeRef} position={[0, 0.25, 0]} castShadow receiveShadow>
        <planeGeometry args={[1.55, 1.55, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.25}
          metalness={0.4}
          emissive={accentColor}
          emissiveIntensity={isSpeaking ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Holographic 3D Data Ring Orbiting Bot */}
      <mesh ref={haloRef} position={[0, 0.98, 0]}>
        <torusGeometry args={[0.62, 0.015, 16, 64]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Gyro Ring */}
      <mesh ref={ringRef} position={[0, 0.25, 0]}>
        <torusGeometry args={[0.92, 0.012, 16, 64]} />
        <meshBasicMaterial
          color={meta.accentHex === '#FFD700' ? '#00F0FF' : '#FFD700'}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Floating Sparkles / Quantum Nanites */}
      <Sparkles
        count={28}
        scale={[1.8, 1.8, 1.8]}
        size={2.2}
        speed={0.4}
        color={meta.accentHex}
        position={[0, 0.3, 0]}
        opacity={0.65}
      />

      {/* Interactive 3D Holographic HUD Info in World Space */}
      <Html position={[0, 1.25, 0]} center distanceFactor={4.5} className="pointer-events-none select-none">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
              {meta.name} // {meta.rarity} NFT
            </span>
          </div>

          {isSpeaking && (
            <div className="px-2 py-0.5 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] text-[9px] font-mono font-bold animate-pulse">
              🎙️ SYNTHESIZING VOICE STREAM
            </div>
          )}

          {isWorking && (
            <div className="px-2 py-0.5 rounded bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-[9px] font-mono font-bold">
              ⚡ {workLabel || 'EXECUTING AUTONOMOUS WORKFLOW'} ({workProgress || 80}%)
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default NftStageCompanion;
