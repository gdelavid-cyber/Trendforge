'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Bot,
  Crown,
  Sparkles,
  ShieldCheck,
  Coins,
  ArrowRight,
  Loader2,
  Check,
  TrendingUp,
  Tag,
  Flame,
  Search,
  Trophy,
  Award,
  Zap,
  Shield,
  Swords,
  DollarSign,
  Eye,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { AvatarRenderer } from '@/components/avatar/AvatarRenderer';
import { FighterStatsBar } from '@/components/avatar/FighterStatsBar';
import { COSMETICS_CATALOG, CatalogItem, CombatSlot, COSMETIC_TIERS } from '@/lib/cosmetics/catalog';
import { calculateFighterStats, FighterLoadout } from '@/lib/cosmetics/stats';

const SLOT_FILTERS: Array<{ id: 'ALL' | CombatSlot; label: string; icon: any }> = [
  { id: 'ALL', label: 'All Gear', icon: ShoppingBag },
  { id: 'HEAD', label: 'Headwear', icon: Crown },
  { id: 'BODY', label: 'Skins & Plates', icon: Shield },
  { id: 'AURA', label: 'Combat Auras', icon: Flame },
  { id: 'TRAIL', label: 'Wings & Trails', icon: Zap },
  { id: 'FINISHER', label: 'Finishers', icon: Swords },
];

export function Web4MarketplaceClient({ user }: { user: any }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>('cyber_humanoid');
  const [slotFilter, setSlotFilter] = useState<'ALL' | CombatSlot>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(
    new Set(['skin_neon_cyber', 'head_tactical_visor', 'aura_plasma_fire', 'wings_overclock'])
  );

  // Live preview loadout state
  const [previewLoadout, setPreviewLoadout] = useState<FighterLoadout>({
    HEAD: 'head_tactical_visor',
    BODY: 'skin_neon_cyber',
    AURA: 'aura_plasma_fire',
    TRAIL: 'wings_overclock',
    FINISHER: 'anim_matrix_dodge',
  });

  // Fetch user agents
  useEffect(() => {
    fetch('/api/web4/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.agents && data.agents.length > 0) {
          setAgents(data.agents);
          const first = data.agents[0];
          setSelectedAgentId(first.id);
          if (first.avatarConfig?.baseModel) {
            setSelectedBaseModel(first.avatarConfig.baseModel.toLowerCase());
          }
          if (first.avatarConfig?.loadout) {
            setPreviewLoadout(first.avatarConfig.loadout);
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  // Live Stats calculation
  const liveStats = useMemo(() => {
    return calculateFighterStats(activeAgent, previewLoadout);
  }, [activeAgent, previewLoadout]);

  // Filter items based on search and slot category
  const filteredCatalog = useMemo(() => {
    return COSMETICS_CATALOG.filter((item) => {
      const matchesSlot = slotFilter === 'ALL' || item.slot === slotFilter;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSlot && matchesSearch;
    });
  }, [slotFilter, searchQuery]);

  // Instant preview equip handler (client-side state, 0 server roundtrips)
  const handleItemClick = (item: CatalogItem) => {
    setPreviewLoadout((prev) => ({
      ...prev,
      [item.slot]: item.id,
    }));
    toast.info(`Previewing ${item.name} on ${activeAgent?.name || 'Fighter'}!`);
  };

  // Purchase / Checkout handler
  const handlePurchase = async (item: CatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPurchasingId(item.id);

    try {
      const res = await fetch('/api/cosmetics/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          payFromAgentId: selectedAgentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlock cosmetic');
      }
      setOwnedItemIds((prev) => new Set([...Array.from(prev), item.id]));
      setPreviewLoadout((prev) => ({
        ...prev,
        [item.slot]: item.id,
      }));
      toast.success(data.message || `Successfully unlocked ${item.name}! Equipped in combat loadout.`);
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed.');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] text-xs font-mono uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>COMBAT ARMORY & WEARABLE NFT BLACK MARKET</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-widest text-white">
            Combat <span className="cyan-gold-gradient-text">Marketplace</span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E9BB4] font-mono mt-1">
            Equip rare visors, aura wave emitters, and armor plates with instant client-side preview.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Link href="/tasks">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs h-10 font-bold uppercase">
              Weekly Tasks
            </Button>
          </Link>
          <Link href="/avatar-studio">
            <Button className="cyan-gradient text-black font-extrabold text-xs h-10 uppercase px-5 holographic-btn">
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              The Forge
            </Button>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SPLIT-VIEW MARKETPLACE LAYOUT
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT SIDE (5 COLS): LIVE FIGHTER PREVIEW & STAT IMPACT
        ======================================================================= */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0B0B14]/90 flex flex-col items-center justify-center relative min-h-[460px]">
            {/* Live Fighter Model with Instant Preview Equip */}
            <AvatarRenderer
              avatarId={selectedBaseModel}
              loadout={previewLoadout}
              size="stage"
              mood="battle"
              animated={true}
              interactive={true}
              showParallax={true}
            />

            {/* Live Fighter HUD Tag */}
            <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between font-mono">
              <div>
                <span className="text-[9px] uppercase text-[#00F0FF] font-bold block">LIVE STAGE TARGET</span>
                <span className="text-xs font-bold text-white uppercase">{activeAgent?.name || 'GENESIS COMBATANT'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span>INSTANT MIRROR ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Real-time Stat Performance Gauges */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#0B0B14] space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Zap className="w-3.5 h-3.5 text-[#00F0FF]" /> Live Loadout Stats
            </h4>
            <FighterStatsBar stats={liveStats} compact={false} />
          </div>
        </div>

        {/* =======================================================================
            RIGHT SIDE (7 COLS): SLOT FILTERS & COMBAT CATALOG
        ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search Bar & Slot Filter Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9BB4]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tactical visors, flame auras, dragon wings..."
                className="bg-black/60 border-white/15 text-white pl-10 font-mono text-xs h-10 rounded-xl focus:border-[#00F0FF]"
              />
            </div>

            {/* 6 Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono">
              {SLOT_FILTERS.map((f) => {
                const Icon = f.icon;
                const isActive = slotFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSlotFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                        : 'bg-white/5 text-[#8E9BB4] hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCatalog.map((item) => {
              const isEquipped = previewLoadout[item.slot] === item.id;
              const isOwned = ownedItemIds.has(item.id);
              const tier = COSMETIC_TIERS[item.rarity];
              const isPurchasing = purchasingId === item.id;

              return (
                <motion.div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className={`relative glass-card p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between overflow-hidden ${
                    isEquipped
                      ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_16px_rgba(0,240,255,0.25)]'
                      : 'border-white/10 bg-[#0B0B14]/80 hover:border-white/20'
                  }`}
                >
                  {/* Top Header: Slot Tag & Price/Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${tier.color}`}>
                      {item.rarity} // {item.slot}
                    </span>

                    {isEquipped ? (
                      <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#00F0FF] text-black">
                        EQUIPPED
                      </span>
                    ) : isOwned ? (
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        OWNED
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-extrabold text-[#FFD700]">
                        {item.price > 0 ? `$${item.price.toFixed(2)}` : 'FREE REWARD'}
                      </span>
                    )}
                  </div>

                  {/* Item Art Frame / Placeholder (Zero Emojis) */}
                  <div className={`w-full h-32 rounded-xl flex items-center justify-center mb-3 border ${tier.color} bg-black/40 relative overflow-hidden`}>
                    {!item.artPending ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain p-2 filter drop-shadow-[0_0_12px_currentColor]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                        <Sparkles className="w-6 h-6 opacity-70" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#8E9BB4] font-bold">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Description & Stat Modifiers */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold font-mono text-white truncate">{item.name}</h3>
                    <p className="text-[11px] text-[#8E9BB4] font-mono line-clamp-2 leading-relaxed">{item.desc}</p>

                    {/* Stat Boosts Pill */}
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-emerald-400 font-bold">
                      {item.statModifiers.pwr && <span>+{item.statModifiers.pwr} PWR</span>}
                      {item.statModifiers.spd && <span>+{item.statModifiers.spd} SPD</span>}
                      {item.statModifiers.def && <span>+{item.statModifiers.def} DEF</span>}
                      {item.statModifiers.syn && <span>+{item.statModifiers.syn} SYN</span>}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">
                      {isEquipped ? 'Active in Stage' : 'Click to Preview'}
                    </span>

                    {!isOwned && item.price > 0 ? (
                      <Button
                        size="sm"
                        disabled={isPurchasing}
                        onClick={(e) => handlePurchase(item, e)}
                        className="h-7 text-[10px] font-mono font-bold uppercase cyan-gradient text-black px-3"
                      >
                        <DollarSign className="w-3 h-3 mr-0.5" />
                        {isPurchasing ? 'BUYING...' : 'PURCHASE'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isEquipped ? 'secondary' : 'outline'}
                        onClick={() => handleItemClick(item)}
                        className="h-7 text-[10px] font-mono font-bold uppercase border-white/20 text-white"
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
