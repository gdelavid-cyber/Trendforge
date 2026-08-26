'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { AnimeCompanion } from './AnimeCompanion';
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
}

/** Compact always-live stage for tight slots (widget orb, cards). No controls, no HDR env. */
export function MiniStage3D({ avatarId = 'cyber_humanoid', emotion = 'confident', isSpeaking = false, isWorking = false, workLabel, workProgress, loadout, className = '' }: MiniStage3DProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas dpr={[1, 1.5]} camera={{ fov: 33, position: [0.15, 1.02, 2.95] }} gl={{ antialias: true, alpha: true }}>
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
            loadout={loadout}
          />
        </Suspense>
        <ContactShadows position={[0, -0.432, 0]} opacity={0.5} scale={2.6} blur={1.4} far={1.4} color="#000000" />
      </Canvas>
    </div>
  );
}

export default MiniStage3D;
