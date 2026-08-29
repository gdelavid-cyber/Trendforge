'use client';

import React from 'react';
import { AvatarConfigState, AvatarEmotion } from '@/hooks/useAvatar';
import { COSMETICS_CATALOG, CatalogItem, CombatSlot } from '@/lib/cosmetics/catalog';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { Stage3D } from '@/components/avatar/stage3d/Stage3D';

export function canRender3D(
  loadout?: FighterLoadout,
  catalog: CatalogItem[] = COSMETICS_CATALOG
): boolean {
  if (!loadout) return false;
  const equippedKeys = Object.values(loadout).filter(Boolean) as string[];
  if (equippedKeys.length === 0) return false;

  return equippedKeys.every((id) => {
    const item = catalog.find((c) => c.id === id || c.name === id);
    return item?.render?.kind === 'model3d' && Boolean(item.render.glbUrl);
  });
}

export interface AvatarRendererProps {
  avatarId?: 'cyber_humanoid' | 'quantum_android' | 'wall_street_titan' | 'cosmic_entity' | string;
  loadout?: FighterLoadout;
  config?: AvatarConfigState; // Backward compatibility with ChatInterface
  emotion?: AvatarEmotion;
  mood?: AvatarEmotion;
  /** legacy prop — accepted for call-site compatibility, visual pose is emotion-driven now */
  pose?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'stage' | 'column' | 'full';
  animated?: boolean;
  interactive?: boolean;
  /** legacy viseme payload — accepted, mouth animation is frame-based now */
  currentViseme?: {
    amplitude: number;
    mouthOpen: number;
    mouthWide: number;
    mouthRound: number;
  };
  /** legacy props — accepted for call-site compatibility */
  wireframe?: boolean;
  cameraDistance?: number;
  rotationSpeed?: number;
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  /** shows the holographic work panel — the companion visibly executing a task */
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  showParallax?: boolean;
  className?: string;
  onClick?: () => void;
  /** renderer chassis — 'anime' (default) or the procedural 'divine' final form */
  variant?: 'anime' | 'divine' | 'metahuman';
  /** URL to Metahuman GLB (used when variant === 'metahuman') */
  metahumanGlbUrl?: string;
  /** Viseme input for lip sync (used when variant === 'metahuman') */
  visemes?: Array<{ name: string; weight: number }>;
}

export const AVATAR_MAP: Record<string, { name: string; themeColor: string; title: string }> = {
  cyber_humanoid: {
    name: 'KAIROS',
    themeColor: '#00F0FF',
    title: 'High-Frequency Executioner',
  },
  CYBER_HUMANOID: {
    name: 'KAIROS',
    themeColor: '#00F0FF',
    title: 'High-Frequency Executioner',
  },
  quantum_android: {
    name: 'UNIT-Ω',
    themeColor: '#A855F7',
    title: 'DeFi Arbitrage Automaton',
  },
  QUANTUM_ANDROID: {
    name: 'UNIT-Ω',
    themeColor: '#A855F7',
    title: 'DeFi Arbitrage Automaton',
  },
  wall_street_titan: {
    name: 'MIDAS',
    themeColor: '#FFD700',
    title: 'Sovereign Capital Mastermind',
  },
  WALL_STREET_TITAN: {
    name: 'MIDAS',
    themeColor: '#FFD700',
    title: 'Sovereign Capital Mastermind',
  },
  cosmic_entity: {
    name: 'VEIL',
    themeColor: '#EC4899',
    title: 'Transdimensional Oracle',
  },
  COSMIC_ENTITY: {
    name: 'VEIL',
    themeColor: '#EC4899',
    title: 'Transdimensional Oracle',
  },
};

const SIZE_MAP = {
  sm: 'w-24 h-24 max-w-[96px]',
  md: 'w-48 h-48 max-w-[192px]',
  lg: 'w-72 h-72 max-w-[288px]',
  xl: 'w-96 h-96 max-w-[384px]',
  stage: 'w-full max-w-[460px] h-[460px]',
  /** fills the parent column edge-to-edge — no max-width cap */
  column: 'w-full h-[560px]',
  full: 'w-full h-full min-h-[320px]',
};

export function AvatarRenderer({
  avatarId,
  loadout,
  config,
  emotion,
  mood,
  size = 'stage',
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  isWorking = false,
  workLabel,
  workProgress,
  className = '',
  onClick,
  variant,
  metahumanGlbUrl,
  visemes,
}: AvatarRendererProps) {
  const activeAvatarKey = avatarId || config?.baseModel || 'cyber_humanoid';
  const currentEmotion = emotion || mood || 'confident';

  // Resolve equipped cosmetics from loadout or legacy config shape
  const activeLoadout: FighterLoadout = loadout || {
    HEAD: config?.accessory,
    BODY: config?.skin,
    AURA: config?.aura,
    TRAIL: config?.wings,
  };

  const fallback = (
    <div
      className={`relative flex items-center justify-center select-none overflow-hidden ${SIZE_MAP[size]} ${className}`}
      style={{ background: `radial-gradient(circle at center, ${AVATAR_MAP[activeAvatarKey]?.themeColor ?? '#00F0FF'}22 0%, transparent 70%)` }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-2 text-[#8E9BB4] font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#00F0FF] animate-spin" />
        <span>WebGL unavailable</span>
      </div>
    </div>
  );

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.stage;
  const themeColor = AVATAR_MAP[activeAvatarKey]?.themeColor ?? '#00F0FF';

  return (
    <div className={`relative overflow-hidden rounded-2xl ${sizeClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}>
      {/* Moving Cybernetic Video Atmosphere Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-2xl">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-screen scale-110"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
        {/* Dynamic Theme Glow Orb */}
        <div
          className="absolute inset-0 opacity-40 blur-[50px] mix-blend-color-dodge transition-all duration-700 animate-pulse pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 45%, ${themeColor} 0%, transparent 65%)` }}
        />
        {/* Ambient Dark Sci-Fi Vignette */}
        <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-black/40 to-black/85" />
      </div>

      {/* Rotating 4D Holographic Orbit Rings Behind Bot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-dashed border-cyan-400/25 animate-[spin_24s_linear_infinite]"
          style={{ borderColor: `${themeColor}44` }}
        />
        <div
          className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-cyan-300/20 animate-[spin_16s_linear_infinite_reverse]"
          style={{ borderColor: `${themeColor}33` }}
        />
      </div>

      {/* 3D WebGL Avatar Engine */}
      <div className="relative z-10 w-full h-full">
        <Stage3D
          loadout={activeLoadout}
          avatarId={activeAvatarKey}
          emotion={currentEmotion}
          isSpeaking={isSpeaking}
          isWorking={isWorking}
          workLabel={workLabel}
          workProgress={workProgress}
          variant={variant}
          metahumanGlbUrl={metahumanGlbUrl}
          visemes={visemes}
          fallback={fallback}
          className="w-full h-full"
        />
      </div>

      {/* Status Badges */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] text-[10px] font-mono shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse pointer-events-none backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="font-bold tracking-wider">LIVE TRANSMISSION</span>
        </div>
      )}

      {(isThinking || isListening) && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-[10px] font-mono shadow-[0_0_15px_rgba(255,215,0,0.3)] animate-pulse pointer-events-none backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
          <span className="font-bold tracking-wider">{isThinking ? 'NEURAL COMPUTE' : 'LISTENING'}</span>
        </div>
      )}

      {/* Holographic Stage Base Glow */}
      <div
        className="absolute bottom-0 inset-x-8 h-10 blur-xl opacity-60 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at bottom, ${themeColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

export default AvatarRenderer;
