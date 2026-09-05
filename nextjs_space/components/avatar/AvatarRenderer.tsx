'use client';

import React from 'react';
import { AvatarConfigState, AvatarEmotion } from '@/hooks/useAvatar';
import { COSMETICS_CATALOG, CatalogItem, CombatSlot } from '@/lib/experience/cosmetics/catalog';
import { FighterLoadout } from '@/lib/experience/cosmetics/stats';
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

  return (
    <div className={`relative ${sizeClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}>
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

      {/* status badges */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-mono animate-pulse pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
          <span>TRANSMITTING</span>
        </div>
      )}

      {(isThinking || isListening) && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-mono animate-pulse pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
          <span>{isThinking ? 'NEURAL COMPUTE' : 'LISTENING'}</span>
        </div>
      )}
    </div>
  );
}

export default AvatarRenderer;
