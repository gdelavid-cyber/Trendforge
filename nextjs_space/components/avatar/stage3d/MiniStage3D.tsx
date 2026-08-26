'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { AnimeCompanion } from './AnimeCompanion';
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
  const camX = side === 'left' ? 0.55 : side === 'right' ? -0.55 : 0.15;
  const faceAngle = side === 'left' ? -0.45 : side === 'right' ? 0.45 : 0;

  return (
    <div ref={vpRef} className={`relative ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 33, position: [camX, 1.02, 2.95] }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.15} />
        <pointLight position={[-2, 1.4, -2]} intensity={1.3} distance={7} color="#00F0FF" />
        <pointLight position={[2, 1, -2.4]} intensity={0.9} distance={7} color="#FFD700" />
        <Suspense fallback={null}>
          <AnimeCompanion
            avatarId={avatarId}
            emotion={emotion}
            isSpeaking={isSpeaking}
            isWorking={isWorking}
            workLabel={workLabel}
            workProgress={workProgress}
            faceAngle={faceAngle}
            loadout={loadout}
          />
        </Suspense>
        <ContactShadows position={[0, -0.432, 0]} opacity={0.5} scale={2.6} blur={1.4} far={1.4} color="#000000" />
      </Canvas>
    </div>
  );
}

export default MiniStage3D;
