'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AvatarConfigState, AvatarEmotion, AvatarPose } from '@/hooks/useAvatar';
import { COSMETICS_CATALOG, CatalogItem, CombatSlot } from '@/lib/cosmetics/catalog';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { Sparkles, Shield, Zap, Swords, Crown, Flame } from 'lucide-react';
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
  pose?: AvatarPose;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'stage' | 'full';
  animated?: boolean;
  interactive?: boolean;
  currentViseme?: {
    amplitude: number;
    mouthOpen: number;
    mouthWide: number;
    mouthRound: number;
  };
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  wireframe?: boolean;
  cameraDistance?: number;
  rotationSpeed?: number;
  showParallax?: boolean;
  className?: string;
  onClick?: () => void;
}

const AVATAR_MAP: Record<string, { name: string; folderName: string; themeColor: string; title: string }> = {
  cyber_humanoid: {
    name: 'Cyber Humanoid',
    folderName: 'cyber_humanoid',
    themeColor: '#00F0FF',
    title: 'High-Frequency Executioner',
  },
  CYBER_HUMANOID: {
    name: 'Cyber Humanoid',
    folderName: 'cyber_humanoid',
    themeColor: '#00F0FF',
    title: 'High-Frequency Executioner',
  },
  quantum_android: {
    name: 'Quantum Android',
    folderName: 'quantum_android',
    themeColor: '#A855F7',
    title: 'DeFi Arbitrage Automaton',
  },
  QUANTUM_ANDROID: {
    name: 'Quantum Android',
    folderName: 'quantum_android',
    themeColor: '#A855F7',
    title: 'DeFi Arbitrage Automaton',
  },
  wall_street_titan: {
    name: 'Wall Street Titan',
    folderName: 'wall_street_titan',
    themeColor: '#FFD700',
    title: 'Sovereign Capital Mastermind',
  },
  WALL_STREET_TITAN: {
    name: 'Wall Street Titan',
    folderName: 'wall_street_titan',
    themeColor: '#FFD700',
    title: 'Sovereign Capital Mastermind',
  },
  cosmic_entity: {
    name: 'Cosmic Nebula Entity',
    folderName: 'cosmic_entity',
    themeColor: '#EC4899',
    title: 'Transdimensional Oracle',
  },
  COSMIC_ENTITY: {
    name: 'Cosmic Nebula Entity',
    folderName: 'cosmic_entity',
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
  full: 'w-full h-full min-h-[320px]',
};

export function AvatarRenderer({
  avatarId,
  loadout,
  config,
  emotion,
  mood,
  pose = 'idle',
  size = 'stage',
  animated = true,
  interactive = true,
  currentViseme,
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  showParallax = true,
  className = '',
  onClick,
}: AvatarRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);

  // Normalize avatar key
  const activeAvatarKey = avatarId || config?.baseModel || 'cyber_humanoid';
  const avatarMeta = AVATAR_MAP[activeAvatarKey] || AVATAR_MAP.cyber_humanoid;
  const currentEmotion = emotion || mood || 'confident';

  // Resolve equipped cosmetics from loadout or config
  const equippedItems = useMemo(() => {
    const items: Record<CombatSlot, CatalogItem | null> = {
      HEAD: null,
      EYEWEAR: null,
      BODY: null,
      AURA: null,
      TRAIL: null,
      FINISHER: null,
    };

    const activeLoadout = loadout || {
      HEAD: config?.accessory,
      EYEWEAR: undefined as string | undefined,
      BODY: config?.skin,
      AURA: config?.aura,
      TRAIL: config?.wings,
      FINISHER: config?.animation,
    };

    if (activeLoadout) {
      Object.entries(activeLoadout).forEach(([slot, val]) => {
        if (!val) return;
        const found = COSMETICS_CATALOG.find((c) => c.id === val || c.name === val);
        if (found) {
          items[slot as CombatSlot] = found;
        }
      });
    }

    return items;
  }, [loadout, config]);

  // Motion values for smooth 3D parallax tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
  const scale = useSpring(useTransform(mouseX, [-0.5, 0.5], [1.02, 1.02]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !showParallax || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Base avatar asset paths
  const baseWebp = `/avatars/${avatarMeta.folderName}_animated.webp`;
  const basePng = `/avatars/${avatarMeta.folderName}.png`;
  const imageSource = animated && !imageError ? baseWebp : basePng;

  // Compute primary aura color based on AURA item or avatar theme
  const auraColor = useMemo(() => {
    if (equippedItems.AURA?.id === 'aura_plasma_fire') return '#FF007A';
    if (equippedItems.AURA?.id === 'aura_matrix_glitch') return '#00FF66';
    if (equippedItems.AURA?.id === 'aura_gold_sparkles') return '#FFD700';
    if (equippedItems.AURA?.id === 'aura_electric_storm') return '#00F0FF';
    return avatarMeta.themeColor;
  }, [equippedItems.AURA, avatarMeta.themeColor]);

  const mouthOpenScale = currentViseme?.mouthOpen ? 1 + currentViseme.mouthOpen * 0.15 : isSpeaking ? 1.05 : 1;

  const render2DTree = (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative flex items-center justify-center select-none overflow-hidden ${SIZE_MAP[size]} ${className}`}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        style={{
          rotateX: showParallax ? rotateX : 0,
          rotateY: showParallax ? rotateY : 0,
          scale: showParallax ? scale : 1,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* =========================================================================
            LAYER 1: Holographic Combat Arena Backstage & Ambient Glow
        ========================================================================= */}
        <div
          className="absolute inset-0 rounded-3xl opacity-30 blur-2xl transition-colors duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${auraColor} 0%, transparent 70%)`,
          }}
        />

        {/* Ambient Ring / Holographic Stage Grid */}
        <div
          className="absolute bottom-2 w-3/4 h-8 rounded-full border border-white/20 opacity-40 shadow-[0_0_20px_currentColor] pointer-events-none"
          style={{
            borderColor: auraColor,
            color: auraColor,
            transform: 'rotateX(75deg)',
          }}
        />

        {/* =========================================================================
            LAYER 2: Combat AURA FX Layer
        ========================================================================= */}
        {equippedItems.AURA && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.5, 0.85, 0.5],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-4 rounded-full pointer-events-none blur-md mix-blend-screen"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${auraColor}88 15%, ${auraColor}22 55%, transparent 75%)`,
            }}
          />
        )}

        {/* =========================================================================
            LAYER 3: TRAIL / WINGS Layer (Behind Avatar)
        ========================================================================= */}
        {equippedItems.TRAIL && !equippedItems.TRAIL.artPending && (
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <img
              src={equippedItems.TRAIL.image}
              alt={equippedItems.TRAIL.name}
              className="w-4/5 h-4/5 object-contain opacity-90 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              onError={(e) => {
                // Graceful degradation: hide if asset not found
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </motion.div>
        )}

        {/* =========================================================================
            LAYER 4: BASE FIGHTER AVATAR (Animated WebP Loop / PNG)
        ========================================================================= */}
        <motion.div
          animate={{
            scale: mouthOpenScale,
            y: pose === 'battle' ? [0, -4, 0] : isSpeaking ? [0, -3, 0] : [0, -2, 0],
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <img
            src={imageSource}
            alt={avatarMeta.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
          />
        </motion.div>

        {/* =========================================================================
            LAYER 5: COSMETIC OVERLAYS (HEAD / BODY / ACCESSORIES)
        ========================================================================= */}
        {equippedItems.HEAD && !equippedItems.HEAD.artPending && (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[8%] z-20 w-1/3 h-1/4 flex items-center justify-center pointer-events-none"
          >
            <img
              src={equippedItems.HEAD.image}
              alt={equippedItems.HEAD.name}
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_#FFD700]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </motion.div>
        )}

        {/* =========================================================================
            LAYER 6: HUD Status Indicators & Emotion Aura Accents
        ========================================================================= */}
        {isSpeaking && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-mono animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
            <span>TRANSMITTING</span>
          </div>
        )}

        {isThinking && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-mono animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
            <span>NEURAL COMPUTE</span>
          </div>
        )}
      </motion.div>
    </div>
  );

  if (canRender3D(loadout)) {
    return (
      <Stage3D
        loadout={loadout}
        fallback={render2DTree}
        className={`${SIZE_MAP[size]} ${className}`}
      />
    );
  }

  return render2DTree;
}
