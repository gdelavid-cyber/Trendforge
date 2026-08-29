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
        {/* Ultra-Bright HDR Triple-A Studio & Neon Rim Lighting */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 6, 5]} intensity={3.2} color="#FFFFFF" />
        <directionalLight position={[-3, 4, 3]} intensity={2.4} color="#E0F2FE" />
        <pointLight position={[-2.5, 2.2, 2.2]} intensity={4.5} distance={10} color="#00F0FF" />
        <pointLight position={[2.5, 2.2, -2]} intensity={4.2} distance={10} color="#E879F9" />
        <pointLight position={[0, 0.6, 2.0]} intensity={3.0} distance={7} color="#38BDF8" />
        <pointLight position={[0, -2, 1.5]} intensity={2.5} distance={7} color="#00F0FF" />
        <pointLight position={[0, 4, -3]} intensity={2.8} distance={9} color="#67E8F9" />

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
