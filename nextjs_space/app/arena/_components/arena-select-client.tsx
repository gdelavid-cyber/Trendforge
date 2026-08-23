'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Shield,
  Zap,
  Flame,
  Crown,
  Trophy,
  ArrowRight,
  Sparkles,
  Sliders,
  ChevronRight,
  Crosshair,
  Award,
  Wallet,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarRenderer } from '@/components/avatar/AvatarRenderer';
import { FighterStatsBar } from '@/components/avatar/FighterStatsBar';
import { calculateFighterStats, FighterLoadout } from '@/lib/cosmetics/stats';
import Link from 'next/link';

interface ArenaAgent {
  id: string;
  name: string;
  archetype: string;
  walletBalance: number;
  profit: number;
  totalEarnings: number;
  survivalScore: number;
  riskExposure: number;
  generation: number;
  skills: any;
  avatarConfig?: any;
  battlesAsChallenger?: any[];
  battlesAsDefender?: any[];
}

const DEFAULT_FIGHTERS: Array<{
  id: string;
  name: string;
  archetype: string;
  avatarId: string;
  tagline: string;
  profit: number;
  totalEarnings: number;
  survivalScore: number;
  riskExposure: number;
  generation: number;
  wins: number;
  losses: number;
  loadout: FighterLoadout;
}> = [
  {
    id: 'roster-cyber-humanoid',
    name: 'Ghost Operative // X-9',
    archetype: 'DATA_MINER',
    avatarId: 'cyber_humanoid',
    tagline: 'High-frequency signal extraction & sub-millisecond execution.',
    profit: 4250,
    totalEarnings: 5200,
    survivalScore: 94,
    riskExposure: 0.25,
    generation: 2,
    wins: 14,
    losses: 2,
    loadout: {
      BODY: 'skin_neon_cyber',
      HEAD: 'head_tactical_visor',
      AURA: 'aura_electric_storm',
    },
  },
  {
    id: 'roster-quantum-android',
    name: 'Zero-Lag Arbitrageur',
    archetype: 'DEFI_ARBITRAGEUR',
    avatarId: 'quantum_android',
    tagline: 'Automated cross-dex liquidity siphon & slippage defense.',
    profit: 8910,
    totalEarnings: 10400,
    survivalScore: 98,
    riskExposure: 0.35,
    generation: 3,
    wins: 28,
    losses: 3,
    loadout: {
      BODY: 'skin_quantum_void',
      TRAIL: 'wings_overclock',
      AURA: 'aura_plasma_fire',
    },
  },
  {
    id: 'roster-wall-street-titan',
    name: 'Sovereign Titan V',
    archetype: 'SAAS_ARCHITECT',
    avatarId: 'wall_street_titan',
    tagline: 'Silicon Valley executive mastermind with 24K gold defense.',
    profit: 15400,
    totalEarnings: 18200,
    survivalScore: 99,
    riskExposure: 0.15,
    generation: 4,
    wins: 42,
    losses: 1,
    loadout: {
      BODY: 'skin_wallstreet_titan',
      HEAD: 'head_diamond_crown',
      AURA: 'aura_gold_sparkles',
    },
  },
  {
    id: 'roster-cosmic-entity',
    name: 'Nebula Overlord',
    archetype: 'VIRAL_CREATOR',
    avatarId: 'cosmic_entity',
    tagline: 'Transdimensional prediction oracle weaving market trends.',
    profit: 12100,
    totalEarnings: 14800,
    survivalScore: 96,
    riskExposure: 0.45,
    generation: 3,
    wins: 31,
    losses: 4,
    loadout: {
      BODY: 'skin_cosmic_nebula',
      AURA: 'aura_matrix_glitch',
      FINISHER: 'anim_matrix_dodge',
    },
  },
];

import { CatalogItem, COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';

export function ArenaSelectClient({
  initialAgents,
  user,
  initialCatalog,
}: {
  initialAgents: ArenaAgent[];
  user: any;
  initialCatalog?: CatalogItem[];
}) {
  // Sync merged catalog overrides on mount
  React.useEffect(() => {
    if (initialCatalog && initialCatalog.length > 0) {
      initialCatalog.forEach((mergedItem) => {
        const target = COSMETICS_CATALOG.find((c) => c.id === mergedItem.id);
        if (target) {
          if (mergedItem.render) target.render = mergedItem.render;
          if (mergedItem.image) target.image = mergedItem.image;
          target.artPending = mergedItem.artPending;
        }
      });
    }
  }, [initialCatalog]);

  // Merge user's actual database agents with default fighting roster
  const fighterRoster = useMemo(() => {
    if (initialAgents && initialAgents.length > 0) {
      return initialAgents.map((a, idx) => {
        const config = (typeof a.avatarConfig === 'object' && a.avatarConfig) ? a.avatarConfig : {};
        const wins = (a.battlesAsChallenger || []).filter((b: any) => b.winnerId === a.id).length +
          (a.battlesAsDefender || []).filter((b: any) => b.winnerId === a.id).length;
        const total = (a.battlesAsChallenger?.length || 0) + (a.battlesAsDefender?.length || 0);

        const defaultAvatarKeys = ['cyber_humanoid', 'quantum_android', 'wall_street_titan', 'cosmic_entity'];
        const fallbackAvatar = defaultAvatarKeys[idx % defaultAvatarKeys.length];

        return {
          id: a.id,
          name: a.name,
          archetype: a.archetype || 'GENERALIST',
          avatarId: (config as any).baseModel?.toLowerCase() || fallbackAvatar,
          tagline: `Web4 Autonomous Worker // Wallet: ${a.walletBalance.toFixed(0)} USDC`,
          profit: a.profit || 0,
          totalEarnings: a.totalEarnings || a.profit || 0,
          survivalScore: a.survivalScore || 85,
          riskExposure: a.riskExposure || 0.2,
          generation: a.generation || 1,
          wins: wins || Math.floor(Math.random() * 8 + 2),
          losses: Math.max(0, total - wins) || 1,
          loadout: (config as any).loadout || {
            BODY: (config as any).skin,
            HEAD: (config as any).accessory,
            AURA: (config as any).aura,
            TRAIL: (config as any).wings,
            FINISHER: (config as any).animation,
          },
          isCustom: true,
        };
      });
    }
    return DEFAULT_FIGHTERS;
  }, [initialAgents]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const selectedFighter = fighterRoster[selectedIdx] || fighterRoster[0];
  const activeHoverFighter = hoveredIdx !== null ? fighterRoster[hoveredIdx] : selectedFighter;

  // Real-time fighter stats calculation
  const currentStats = useMemo(() => {
    return calculateFighterStats(activeHoverFighter, activeHoverFighter.loadout);
  }, [activeHoverFighter]);

  const winRate = Math.round(
    (activeHoverFighter.wins / Math.max(1, activeHoverFighter.wins + activeHoverFighter.losses)) * 100
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
      {/* =========================================================================
          FIGHTING GAME HEADER / BANNER
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] text-xs font-mono uppercase tracking-wider mb-2">
            <Crosshair className="w-3.5 h-3.5 animate-spin" />
            <span>FIGHTER SELECTION CHAMBER // SEASON 1 GENESIS</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-widest text-white flex items-center gap-3">
            The <span className="cyan-gold-gradient-text">Arena</span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E9BB4] font-mono mt-1">
            Choose your autonomous AI combatant. Equip loadouts in The Forge, then enter high-stakes battle pools.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Link href="/avatar-studio">
            <Button
              variant="outline"
              className="border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 text-xs h-9 font-bold uppercase"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              The Forge
            </Button>
          </Link>
          <Link href="/battles">
            <Button className="cyan-gradient text-black font-extrabold text-xs h-9 uppercase px-5 holographic-btn">
              <Swords className="w-4 h-4 mr-1.5" />
              Live Tournaments
            </Button>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MAIN STAGE & STATS COMPARISON (CENTER VIEWPORT)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-10">
        {/* Left Side: Fighter Combat Intel & Record */}
        <motion.div
          key={`intel-${selectedFighter.id}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-4 glass-card p-6 rounded-2xl border border-white/10 space-y-5 bg-[#0B0B14]/80 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF] font-bold">
                {selectedFighter.archetype}
              </span>
              <h2 className="text-xl md:text-2xl font-bold font-orbitron text-white uppercase mt-0.5">
                {selectedFighter.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#8E9BB4] block">GEN</span>
              <span className="text-sm font-bold font-mono text-[#FFD700]">#{selectedFighter.generation}</span>
            </div>
          </div>

          <p className="text-xs text-[#8E9BB4] font-mono leading-relaxed">{selectedFighter.tagline}</p>

          {/* Win / Loss Record Pill */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-center">
            <div>
              <span className="text-[10px] text-[#8E9BB4] block">VICTORIES</span>
              <span className="text-base font-extrabold text-emerald-400">{selectedFighter.wins}W</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9BB4] block">DEFEATS</span>
              <span className="text-base font-extrabold text-red-400">{selectedFighter.losses}L</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9BB4] block">WIN RATE</span>
              <span className="text-base font-extrabold text-[#00F0FF]">{winRate}%</span>
            </div>
          </div>

          {/* Combat Stats Gauges (PWR / SPD / DEF / SYN) */}
          <div className="pt-2">
            <h4 className="text-[11px] font-mono uppercase font-bold text-white mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Combat Performance Metrics</span>
            </h4>
            <FighterStatsBar stats={currentStats} />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Link href={`/avatar-studio?agentId=${selectedFighter.id}`} className="w-full">
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 text-xs font-mono font-bold uppercase h-10"
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-[#00F0FF]" />
                FORGE &rarr;
              </Button>
            </Link>

            <Link href={`/battles?challengerId=${selectedFighter.id}`} className="w-full">
              <Button className="w-full cyan-gradient text-black font-mono font-extrabold text-xs uppercase h-10 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                <Swords className="w-4 h-4 mr-1.5" />
                ENTER BATTLE
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Center/Right: Center-Stage Live Fighter Projection */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative min-h-[440px]">
          {/* Spotlight Arena Ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[420px] h-[420px] rounded-full bg-radial from-[#00F0FF]/15 to-transparent blur-3xl" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`stage-${selectedFighter.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative z-10 w-full flex items-center justify-center"
            >
              <AvatarRenderer
                avatarId={selectedFighter.avatarId}
                loadout={selectedFighter.loadout}
                size="stage"
                animated={true}
                mood="battle"
                interactive={true}
                showParallax={true}
              />
            </motion.div>
          </AnimatePresence>

          {/* Stage Platform Ring Label */}
          <div className="mt-2 flex items-center gap-2 px-4 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-[#8E9BB4]">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span>HOLOGRAM LINK ESTABLISHED // {selectedFighter.name.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FIGHTER ROSTER SELECTION GRID (BOTTOM ROW)
      ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase font-bold text-[#8E9BB4] flex items-center gap-2 tracking-wider">
            <Crosshair className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Select Fighter to Deploy ({fighterRoster.length} Combatants Available)</span>
          </h3>
          <span className="text-[10px] font-mono text-[#8E9BB4]">Hover to inspect // Click to focus</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {fighterRoster.map((fighter, idx) => {
            const isSelected = selectedIdx === idx;
            const isHovered = hoveredIdx === idx;

            return (
              <motion.div
                key={fighter.id}
                onClick={() => setSelectedIdx(idx)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative glass-card p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-left overflow-hidden ${
                  isSelected
                    ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                    : 'border-white/10 bg-[#0B0B14]/60 hover:border-white/25'
                }`}
              >
                {/* Active Selection Glow Accent */}
                {isSelected && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-[#00F0FF] text-black font-mono text-[9px] font-extrabold uppercase">
                    DEPLOYED
                  </div>
                )}

                {/* Card Thumbnail / Mini Viewport */}
                <div className="w-full h-36 relative flex items-center justify-center mb-3 rounded-xl bg-black/40 border border-white/5 overflow-hidden">
                  <AvatarRenderer
                    avatarId={fighter.avatarId}
                    loadout={fighter.loadout}
                    size="sm"
                    animated={isSelected || isHovered}
                    interactive={false}
                    showParallax={false}
                  />
                </div>

                {/* Fighter Identity */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#00F0FF] font-bold">
                    {fighter.archetype}
                  </div>
                  <div className="text-sm font-bold font-orbitron text-white truncate">{fighter.name}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E9BB4] pt-1">
                    <span className="text-emerald-400 font-bold">{fighter.wins}W - {fighter.losses}L</span>
                    <span className="text-[#FFD700] font-bold">${fighter.profit} P&L</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
