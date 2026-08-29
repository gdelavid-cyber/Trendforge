'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { NftMecha3D } from './NftMecha3D';
import { useInViewport } from './useInViewport';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import type { AvatarEmotion } from '@/hooks/useAvatar';

export interface MiniStage3DProps {
  avatarId?: string;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  loadout?: FighterLoadout;
  className?: string;
  /** 'left' | 'right' offsets the camera and turns the character inward — face-off framing */
  side?: 'left' | 'right' | null;
}

/** Compact always-live stage for tight slots (widget orb, cards). Freezes when offscreen. */
export function MiniStage3D({
  avatarId = 'cyber_humanoid',
  emotion = 'confident',
  isSpeaking = false,
  isWorking = false,
  workLabel,
  workProgress,
  loadout,
  className = '',
  side = null,
}: MiniStage3DProps) {
  const { ref: vpRef, inView } = useInViewport<HTMLDivElement>();
  const camX = side === 'left' ? 0.45 : side === 'right' ? -0.45 : 0.0;

  return (
    <div ref={vpRef} className={`relative ${className}`}>
      <Canvas
        dpr={[1, 2]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 34, position: [camX, 0.38, 2.5] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Cinematic Triple-A Studio & Rim Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[-2.5, 2, 2]} intensity={2.0} distance={8} color="#00F0FF" />
        <pointLight position={[2.5, 2, -2]} intensity={2.2} distance={8} color="#C084FC" />
        <pointLight position={[0, -2, 1.5]} intensity={1.2} distance={6} color="#00F0FF" />
        <pointLight position={[0, 3, -3]} intensity={1.8} distance={8} color="#38BDF8" />

        <Suspense fallback={null}>
          <NftMecha3D
            avatarId={avatarId}
            emotion={emotion}
            isSpeaking={isSpeaking}
            isWorking={isWorking}
            workLabel={workLabel}
            workProgress={workProgress}
            loadout={loadout}
          />
        </Suspense>
        <ContactShadows position={[0, -0.45, 0]} opacity={0.65} scale={3.0} blur={1.8} far={1.8} color="#000000" />
      </Canvas>
    </div>
  );
}

export default MiniStage3D;
