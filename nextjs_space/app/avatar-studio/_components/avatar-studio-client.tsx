'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Sparkles,
  Shield,
  Zap,
  Flame,
  Crown,
  Swords,
  Check,
  RotateCcw,
  Bot,
  Brain,
  Volume2,
  Save,
  ChevronRight,
  ArrowRight,
  Layers,
  ShoppingBag,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { AvatarRenderer } from '@/components/avatar/AvatarRenderer';
import { FighterStatsBar } from '@/components/avatar/FighterStatsBar';
import { EmotionController } from '@/components/avatar/EmotionController';
import { COSMETICS_CATALOG, CatalogItem, CombatSlot, COSMETIC_TIERS } from '@/lib/cosmetics/catalog';
import { calculateFighterStats, FighterLoadout, getLoadoutModifiers } from '@/lib/cosmetics/stats';
import { AvatarEmotion } from '@/hooks/useAvatar';

const BASE_MODELS = [
  { id: 'cyber_humanoid', name: 'Cyber Humanoid', archetype: 'DATA_MINER', color: '#00F0FF', desc: 'High-frequency executioner chassis' },
  { id: 'quantum_android', name: 'Quantum Android', archetype: 'DEFI_ARBITRAGEUR', color: '#A855F7', desc: 'Zero-latency chameleon alloy' },
  { id: 'wall_street_titan', name: 'Wall Street Titan', archetype: 'SAAS_ARCHITECT', color: '#FFD700', desc: '24K gold-plated executive plate' },
  { id: 'cosmic_entity', name: 'Cosmic Entity', archetype: 'VIRAL_CREATOR', color: '#EC4899', desc: 'Transdimensional energy form' },
];

const SLOT_CONFIG: Record<CombatSlot, { label: string; icon: any; color: string; desc: string }> = {
  HEAD: { label: 'Headwear / Visor', icon: Crown, color: 'text-amber-400 border-amber-400/30', desc: 'HUDs, Visors, Crowns & Masks' },
  BODY: { label: 'Body Armor / Skin', icon: Shield, color: 'text-[#00F0FF] border-[#00F0FF]/30', desc: 'Tactical Chassis & Plates' },
  AURA: { label: 'Combat Aura', icon: Flame, color: 'text-pink-500 border-pink-500/30', desc: 'Particle Waves & Lightning' },
  TRAIL: { label: 'Wings / Thruster', icon: Zap, color: 'text-purple-400 border-purple-400/30', desc: 'Thrusters, Fins & Wings' },
  FINISHER: { label: 'Stance / Finisher', icon: Swords, color: 'text-emerald-400 border-emerald-400/30', desc: 'Battle Moves & Celebrations' },
};

export function AvatarStudioClient({ user, initialCatalog }: { user: any; initialCatalog?: CatalogItem[] }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [activeSlot, setActiveSlot] = useState<CombatSlot>('HEAD');
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>('cyber_humanoid');
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState<AvatarEmotion>('battle');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');

  // Sync merged catalog overrides on mount
  useEffect(() => {
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

  // Active loadout slots
  const [currentLoadout, setCurrentLoadout] = useState<FighterLoadout>({
    HEAD: 'head_tactical_visor',
    BODY: 'skin_neon_cyber',
    AURA: 'aura_plasma_fire',
    TRAIL: 'wings_overclock',
    FINISHER: 'anim_matrix_dodge',
  });

  // Fetch user's registered agents on mount
  useEffect(() => {
    fetch('/api/web4/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.agents && data.agents.length > 0) {
          setAgents(data.agents);
          const firstAgent = data.agents[0];
          setSelectedAgentId(firstAgent.id);

          if (firstAgent.avatarConfig) {
            const cfg = firstAgent.avatarConfig;
            if (cfg.baseModel) setSelectedBaseModel(cfg.baseModel.toLowerCase());
            if (cfg.loadout) setCurrentLoadout(cfg.loadout);
            if (cfg.voiceId) setVoiceId(cfg.voiceId);
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  // When selected agent changes, populate its existing loadout
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    const agent = agents.find((a) => a.id === agentId);
    if (agent && agent.avatarConfig) {
      const cfg = agent.avatarConfig;
      if (cfg.baseModel) setSelectedBaseModel(cfg.baseModel.toLowerCase());
      if (cfg.loadout) setCurrentLoadout(cfg.loadout);
      if (cfg.voiceId) setVoiceId(cfg.voiceId);
    }
  };

  // Base stats without loadout modifiers
  const baseStats = useMemo(() => {
    return calculateFighterStats(activeAgent, {});
  }, [activeAgent]);

  // Live modified stats with current loadout
  const liveStats = useMemo(() => {
    return calculateFighterStats(activeAgent, currentLoadout);
  }, [activeAgent, currentLoadout]);

  // Catalog items filtered for the currently selected slot
  const slotItems = useMemo(() => {
    return COSMETICS_CATALOG.filter((item) => item.slot === activeSlot);
  }, [activeSlot]);

  // Equip item to current loadout
  const handleEquipItem = (item: CatalogItem) => {
    setCurrentLoadout((prev) => ({
      ...prev,
      [activeSlot]: item.id,
    }));
    toast.success(`Equipped ${item.name} to ${activeSlot} slot!`);
  };

  // Save loadout to database
  const handleSaveLoadout = async () => {
    if (!selectedAgentId) {
      toast.error('No agent selected to save loadout to.');
      return;
    }

    setSaving(true);
    try {
      const avatarConfigPayload = {
        baseModel: selectedBaseModel.toUpperCase(),
        loadout: currentLoadout,
        skin: currentLoadout.BODY,
        accessory: currentLoadout.HEAD,
        aura: currentLoadout.AURA,
        wings: currentLoadout.TRAIL,
        animation: currentLoadout.FINISHER,
        voiceId,
        emotion: mood,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/web4/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          avatarConfig: avatarConfigPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Combat Loadout successfully locked into ${activeAgent?.name || 'Agent'}!`);
      } else {
        toast.error(data.error || 'Failed to save loadout.');
      }
    } catch {
      toast.error('Network error saving loadout.');
    } finally {
      setSaving(false);
    }
  };

  // Voice Test
  const handleTestVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Combat systems calibrated. Loadout modifiers active. Ready for tournament deployment.`
      );
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.info('Synthesizing combat briefing audio...');
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-10">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] text-xs font-mono uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>THE FORGE // LOADOUT CALIBRATION MATRIX</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-widest text-white">
            Combat <span className="cyan-gold-gradient-text">Forge</span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E9BB4] font-mono mt-1">
            Equip 5 tactical combat slots (HEAD / BODY / AURA / TRAIL / FINISHER) with real-time stat modifiers.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Link href="/arena">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs h-10 font-bold uppercase">
              &larr; Return to Arena
            </Button>
          </Link>
          <Button
            onClick={handleSaveLoadout}
            disabled={saving}
            className="cyan-gradient text-black font-extrabold text-xs h-10 uppercase px-6 holographic-btn shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'LOCKING IN...' : 'SAVE LOADOUT'}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          THE FORGE 3-PANEL LAYOUT
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            PANEL 1 (LEFT, 4 COLS): LOADOUT SLOTS & ITEM INVENTORY
        ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Agent Selector Dropdown (if user has multiple bots) */}
          {agents.length > 1 && (
            <div className="glass-card p-4 rounded-xl border border-white/10 space-y-2">
              <label className="text-[10px] font-mono text-[#8E9BB4] uppercase font-bold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#00F0FF]" /> Target Combatant
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => handleAgentSelect(e.target.value)}
                className="w-full bg-black/80 border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id} className="bg-black text-white">
                    {a.name} ({a.archetype})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5 Combat Slot Navigation Pills */}
          <div className="glass-card p-3 rounded-xl border border-white/10 grid grid-cols-5 gap-1.5 bg-[#0B0B14]">
            {(['HEAD', 'BODY', 'AURA', 'TRAIL', 'FINISHER'] as CombatSlot[]).map((slot) => {
              const cfg = SLOT_CONFIG[slot];
              const Icon = cfg.icon;
              const isActive = activeSlot === slot;
              const equippedId = currentLoadout[slot];
              const equippedItem = COSMETICS_CATALOG.find((c) => c.id === equippedId);

              return (
                <button
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  className={`p-2 rounded-lg text-center font-mono transition-all flex flex-col items-center gap-1 ${
                    isActive
                      ? 'bg-[#00F0FF]/15 border border-[#00F0FF] text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : 'border border-transparent hover:border-white/15 text-[#8E9BB4]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F0FF]' : 'text-[#8E9BB4]'}`} />
                  <span className="text-[9px] font-bold uppercase">{slot}</span>
                </button>
              );
            })}
          </div>

          {/* Slot Catalog Inventory Grid */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3 bg-[#0B0B14]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  <span>{SLOT_CONFIG[activeSlot].label}</span>
                </span>
                <span className="text-[10px] text-[#8E9BB4] font-mono block">
                  {SLOT_CONFIG[activeSlot].desc}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] font-bold">
                {slotItems.length} Available
              </span>
            </div>

            {/* Inventory Items List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {slotItems.map((item) => {
                const isEquipped = currentLoadout[activeSlot] === item.id;
                const tier = COSMETIC_TIERS[item.rarity];
                const SlotIcon = SLOT_CONFIG[item.slot].icon;

                return (
                  <motion.div
                    key={item.id}
                    onClick={() => handleEquipItem(item)}
                    whileHover={{ scale: 1.01, x: 2 }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    {/* Item Thumbnail / Art-Pending Rarity Placeholder Frame (Zero Emojis) */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${tier.color} overflow-hidden relative`}>
                      {!item.artPending ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <SlotIcon className="w-5 h-5 opacity-80" />
                      )}
                    </div>

                    {/* Item Details & Stat Modifiers */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-white truncate">{item.name}</span>
                        {isEquipped && (
                          <span className="px-1.5 py-0.2 rounded bg-[#00F0FF] text-black font-mono text-[8px] font-black uppercase">
                            EQUIPPED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${tier.color}`}>
                          {item.rarity}
                        </span>

                        {/* Modifiers Pill */}
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 font-bold">
                          {item.statModifiers.pwr && <span>+{item.statModifiers.pwr} PWR</span>}
                          {item.statModifiers.spd && <span>+{item.statModifiers.spd} SPD</span>}
                          {item.statModifiers.def && <span>+{item.statModifiers.def} DEF</span>}
                          {item.statModifiers.syn && <span>+{item.statModifiers.syn} SYN</span>}
                        </div>
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div>
                      {isEquipped ? (
                        <div className="w-6 h-6 rounded-full bg-[#00F0FF] text-black flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[#8E9BB4] hover:text-white uppercase font-bold">
                          EQUIP
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =======================================================================
            PANEL 2 (CENTER, 4 COLS): LIVE STAGE PREVIEW & STANCE CONTROLS
        ======================================================================= */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4">
          <div className="w-full glass-card p-6 rounded-3xl border border-white/10 bg-[#0B0B14]/90 flex flex-col items-center justify-center relative min-h-[460px]">
            {/* Live Fighter Renderer with Equipped Loadout */}
            <AvatarRenderer
              avatarId={selectedBaseModel}
              loadout={currentLoadout}
              size="stage"
              mood={mood}
              animated={true}
              interactive={true}
              showParallax={true}
            />

            {/* Combat Stance & Voice Test HUD */}
            <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between gap-2 font-mono">
              {/* Mood / Stance Switcher */}
              <div className="flex items-center gap-1.5">
                {(['battle', 'confident', 'thinking'] as AvatarEmotion[]).map((em) => (
                  <button
                    key={em}
                    onClick={() => setMood(em)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      mood === em
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'bg-white/5 text-[#8E9BB4] hover:text-white'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Voice Test Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestVoice}
                className="h-7 text-[10px] border-white/20 text-[#00F0FF] hover:bg-[#00F0FF]/10 font-mono font-bold"
              >
                <Volume2 className="w-3 h-3 mr-1" />
                TEST VOICE
              </Button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            PANEL 3 (RIGHT, 4 COLS): BASE MODEL SELECTOR & REAL-TIME STATS
        ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Base Chassis Archetype Selector */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 bg-[#0B0B14]">
            <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Bot className="w-3.5 h-3.5 text-[#00F0FF]" /> Base Combat Chassis
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {BASE_MODELS.map((model) => {
                const isSelected = selectedBaseModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedBaseModel(model.id)}
                    className={`p-3 rounded-xl border text-left font-mono transition-all ${
                      isSelected
                        ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : 'border-white/10 bg-black/40 text-[#8E9BB4] hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold text-white truncate">{model.name}</div>
                    <div className="text-[9px] text-[#00F0FF] font-bold uppercase mt-0.5">{model.archetype}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Stat Modifiers Gauge */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4 bg-[#0B0B14]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-[#00F0FF]" /> Live Stat Modifiers
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Modifiers Active</span>
            </div>

            <FighterStatsBar stats={liveStats} baseStats={baseStats} />
          </div>

          {/* Currently Equipped Summary */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-2 bg-[#0B0B14]">
            <h4 className="text-[11px] font-mono uppercase font-bold text-[#8E9BB4] mb-2">Equipped Combat Summary</h4>
            <div className="space-y-1.5 text-[11px] font-mono">
              {Object.entries(currentLoadout).map(([slot, itemId]) => {
                const item = COSMETICS_CATALOG.find((c) => c.id === itemId);
                return (
                  <div key={slot} className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-[#8E9BB4] uppercase text-[10px]">{slot}:</span>
                    <span className="text-white font-bold truncate max-w-[180px]">{item?.name || 'Empty'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
