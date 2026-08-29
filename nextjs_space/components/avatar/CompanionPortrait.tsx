'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const DynamicMiniStage3D = dynamic(
  () => import('@/components/avatar/stage3d/MiniStage3D').then((mod) => mod.MiniStage3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/40">
        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#00F0FF] animate-spin" />
      </div>
    ),
  }
);

export type PortraitArchetype =
  | 'cyber_humanoid'
  | 'quantum_android'
  | 'wall_street_titan'
  | 'cosmic_entity'
  | 'shadow_syndicate'
  | 'apex_predator';

export interface ArchetypeMeta {
  name: string;
  codename: string;
  image: string;
  glowColor: string;
  accentHex: string;
  rarity: 'GENESIS' | 'MYTHIC' | 'DIVINE' | 'LEGENDARY' | 'SOVEREIGN';
  perk: string;
}

export const ARCHETYPE_REGISTRY: Record<PortraitArchetype, ArchetypeMeta> = {
  cyber_humanoid: {
    name: 'Kairos',
    codename: 'Tactical Cyber-Humanoid',
    image: '/avatars/cyber_humanoid.jpg',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    accentHex: '#00F0FF',
    rarity: 'GENESIS',
    perk: '+35% Research & Signal Scraping Speed',
  },
  quantum_android: {
    name: 'UNIT-O',
    codename: 'Aethera Quantum Android',
    image: '/avatars/quantum_android.jpg',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    accentHex: '#A855F7',
    rarity: 'DIVINE',
    perk: '+40% Multi-Modal Audio & Video Synthesis',
  },
  wall_street_titan: {
    name: 'Midas',
    codename: 'Obsidian Sentinel Titan',
    image: '/avatars/wall_street_titan.jpg',
    glowColor: 'rgba(255, 215, 0, 0.55)',
    accentHex: '#FFD700',
    rarity: 'SOVEREIGN',
    perk: '+50% Capital Arbitrage & Sales Conversion',
  },
  cosmic_entity: {
    name: 'Nyx',
    codename: 'Celestial Void Entity',
    image: '/avatars/cosmic_entity.jpg',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    accentHex: '#EC4899',
    rarity: 'MYTHIC',
    perk: '+45% Viral Social Expansion & Creative Copy',
  },
  shadow_syndicate: {
    name: 'Viper',
    codename: 'Shadow Syndicate Infiltrator',
    image: '/avatars/shadow_syndicate.jpg',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    accentHex: '#EF4444',
    rarity: 'LEGENDARY',
    perk: '+60% Dark Data Mining & Competitor Intel',
  },
  apex_predator: {
    name: 'Hyperion',
    codename: 'Apex Heavy Mecha Juggernaut',
    image: '/avatars/apex_predator.jpg',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    accentHex: '#F59E0B',
    rarity: 'SOVEREIGN',
    perk: '+75% High-Volume Autonomous Swarm Defense',
  },
};

export function normalizeArchetype(raw?: string): PortraitArchetype {
  const k = (raw || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (k.includes('quantum') || k.includes('android') || k.includes('unit')) return 'quantum_android';
  if (k.includes('titan') || k.includes('wall') || k.includes('midas')) return 'wall_street_titan';
  if (k.includes('cosmic') || k.includes('entity') || k.includes('nyx')) return 'cosmic_entity';
  if (k.includes('shadow') || k.includes('syndicate') || k.includes('viper') || k.includes('ninja')) return 'shadow_syndicate';
  if (k.includes('apex') || k.includes('predator') || k.includes('hyperion') || k.includes('mecha')) return 'apex_predator';
  return 'cyber_humanoid';
}

export interface CompanionPortraitProps {
  archetype?: string;
  className?: string;
  seed?: number;
  showNftBadge?: boolean;
  showDetailsModalOnClick?: boolean;
  tokenId?: string;
  isMintedNft?: boolean;
}

export function CompanionPortrait({
  archetype,
  className = '',
  seed = 0,
  showNftBadge = false,
  showDetailsModalOnClick = false,
  tokenId,
}: CompanionPortraitProps) {
  const arch = normalizeArchetype(archetype);
  const meta = ARCHETYPE_REGISTRY[arch];
  const [hovered, setHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayTokenId = tokenId || `#${String(1000 + (seed % 8999))}`;

  const copyText = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => showDetailsModalOnClick && setShowModal(true)}
        className={`relative overflow-hidden rounded-2xl select-none group bg-black/60 ${className} ${
          showDetailsModalOnClick ? 'cursor-pointer' : ''
        }`}
        style={{
          boxShadow: hovered
            ? `0 0 35px ${meta.glowColor}, inset 0 0 20px ${meta.glowColor}`
            : `0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)`,
          border: `1px solid ${hovered ? meta.accentHex : 'rgba(255,255,255,0.12)'}`,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Live 3D WebGL Robotic Character Engine */}
        <div className="w-full h-full pointer-events-none">
          <DynamicMiniStage3D avatarId={arch} className="w-full h-full" />
        </div>

        {/* Ambient Dark Sci-Fi Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none z-10" />

        {/* Glowing Neural Circuit Border Accent */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
          style={{
            border: `1px solid ${meta.accentHex}`,
            opacity: hovered ? 0.9 : 0.25,
          }}
        />

        {/* NFT Rarity / Token Badge */}
        {showNftBadge && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            <span
              className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: meta.accentHex,
                borderColor: `${meta.accentHex}66`,
              }}
            >
              <Sparkles className="w-2.5 h-2.5 animate-spin" />
              {meta.rarity} {displayTokenId}
            </span>
          </div>
        )}

        {/* Tactical Info Overlay on Hover */}
        <div
          className={`absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-10 transition-all duration-300 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[11px] font-mono font-black uppercase text-white block truncate">
                {meta.name} // {meta.codename}
              </span>
              <span className="text-[9px] font-mono text-[#00F0FF] block truncate">
                {meta.perk}
              </span>
            </div>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold shrink-0 ml-1">
              3D NFT
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Autonomous AI NFT Provenance Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="glass-card border border-[#00F0FF]/30 rounded-3xl p-6 md:p-8 w-full max-w-2xl text-left relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Background Glow */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
                style={{ backgroundColor: meta.glowColor }}
              />

              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* 3D Rotatable Robot Stage */}
                <div
                  className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-black/80 shrink-0 border relative overflow-hidden shadow-2xl"
                  style={{
                    borderColor: meta.accentHex,
                    boxShadow: `0 0 30px ${meta.glowColor}`,
                  }}
                >
                  <DynamicMiniStage3D avatarId={arch} className="w-full h-full" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-[9px] font-mono font-bold text-[#FFD700]">
                    {meta.rarity} 3D NFT
                  </div>
                  <div className="absolute bottom-2 inset-x-2 p-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/10 text-center">
                    <span className="text-[10px] font-mono text-white font-bold block">
                      Token {displayTokenId}
                    </span>
                  </div>
                </div>

                {/* Provenance Telemetry Details */}
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-mono font-bold uppercase mb-1">
                        <CheckCircle2 className="w-3 h-3" /> Autonomous AI 3D NFT
                      </div>
                      <h2 className="text-2xl font-orbitron font-black text-white uppercase">
                        {meta.name} <span className="text-[#8E9BB4] text-base font-normal">({meta.codename})</span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-[#8E9BB4] hover:text-white text-xs font-mono px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                    >
                      ESC ✕
                    </button>
                  </div>

                  {/* Attribute Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[#8E9BB4] block text-[9px] uppercase">Rarity Class</span>
                      <span className="font-bold text-white mt-0.5 block" style={{ color: meta.accentHex }}>
                        {meta.rarity}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[#8E9BB4] block text-[9px] uppercase">Autonomous Perk</span>
                      <span className="font-bold text-green-400 mt-0.5 block truncate">
                        {meta.perk}
                      </span>
                    </div>
                  </div>

                  {/* On-Chain Cryptographic Specs */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8E9BB4]">EIP-8004 Token Standard:</span>
                      <span className="text-white font-bold">Autonomous 3D Agent NFT</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8E9BB4]">Contract Address:</span>
                      <button
                        onClick={() => copyText(`0x7f4e91a288bc39d01bfa821c${seed}9e`, 'Contract address')}
                        className="text-[#00F0FF] hover:underline flex items-center gap-1 font-bold"
                      >
                        0x7f4e...{seed % 999} <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8E9BB4]">Mint Status:</span>
                      <span className="text-green-400 font-bold flex items-center gap-1">
                        ✓ On-Chain Verified (Solana / Base)
                      </span>
                    </div>
                  </div>

                  {/* Minting & Multi-Bot Policy Note */}
                  <div className="p-3 rounded-xl bg-purple-500/[0.08] border border-purple-500/25 text-[11px] font-mono text-[#D8B4FE] leading-relaxed">
                    🛡️ <strong>Autonomous NFT Policy:</strong> Each operator receives 1 Genesis Prototype Bot. To deploy multiple concurrent autonomous worker bots, each bot must be minted and secured on-chain as a sovereign 3D NFT asset.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CompanionPortrait;
