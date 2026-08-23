'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Tag,
  Coins,
  Check,
  Loader2,
  Filter,
  Shield,
  Swords,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { COSMETICS_CATALOG, COSMETIC_TIERS, CatalogItem, CombatSlot } from '@/lib/cosmetics/catalog';
import Link from 'next/link';

export function CosmeticsStore({ user }: { user: any }) {
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set(['head_tactical_visor', 'skin_neon_cyber']));

  const filteredItems =
    selectedSlot === 'ALL'
      ? COSMETICS_CATALOG
      : COSMETICS_CATALOG.filter((c) => c.slot === selectedSlot || c.category === selectedSlot);

  const handlePurchase = async (item: CatalogItem) => {
    setPurchasingId(item.id);
    setTimeout(() => {
      setPurchasingId(null);
      setUnlockedIds((prev) => new Set([...Array.from(prev), item.id]));
      toast.success(`Successfully unlocked ${item.name}! Equip it in The Forge.`);
    }, 700);
  };

  const slotTabs = [
    { id: 'ALL', label: 'All Assets', icon: ShoppingBag },
    { id: 'HEAD', label: 'Headwear', icon: Crown },
    { id: 'BODY', label: 'Skins & Plates', icon: Shield },
    { id: 'AURA', label: 'Auras', icon: Flame },
    { id: 'TRAIL', label: 'Wings & Trails', icon: Zap },
    { id: 'FINISHER', label: 'Finishers', icon: Swords },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>FIGHTING GEAR ARMORY // 50+ WEARABLE COMBAT ASSETS</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Cosmetics <span className="cyan-gold-gradient-text">Black Market</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-mono mt-1">
            Equip your autonomous economic combatants with tactical visors, plasma auras, dragon wings, and finisher stances.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Link href="/arena">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs h-10 font-bold uppercase">
              The Arena
            </Button>
          </Link>
          <Link href="/avatar-studio">
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-5 holographic-btn">
              The Forge &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Slot Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 font-mono scrollbar-none">
        {slotTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedSlot === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedSlot(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                  : 'bg-[#0B0B14] text-[#8E9BB4] hover:text-white border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isUnlocked = unlockedIds.has(item.id);
          const tier = COSMETIC_TIERS[item.rarity];
          const isPurchasing = purchasingId === item.id;

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card p-4 rounded-2xl border border-white/10 bg-[#0B0B14]/80 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${tier.color}`}>
                    {item.rarity} // {item.slot}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-[#FFD700]">
                    {item.price > 0 ? `$${item.price.toFixed(2)}` : 'QUEST REWARD'}
                  </span>
                </div>

                {/* Art Frame (Zero Emojis) */}
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

                <h3 className="text-sm font-bold font-mono text-white truncate">{item.name}</h3>
                <p className="text-[11px] text-[#8E9BB4] font-mono line-clamp-2 mt-1 leading-relaxed">{item.desc}</p>

                {/* Stat Modifiers */}
                <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-emerald-400 font-bold">
                  {item.statModifiers.pwr && <span>+{item.statModifiers.pwr} PWR</span>}
                  {item.statModifiers.spd && <span>+{item.statModifiers.spd} SPD</span>}
                  {item.statModifiers.def && <span>+{item.statModifiers.def} DEF</span>}
                  {item.statModifiers.syn && <span>+{item.statModifiers.syn} SYN</span>}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-white/5 mt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">{item.unlockMethod}</span>
                {isUnlocked ? (
                  <Link href="/avatar-studio">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-white/20 text-[#00F0FF]">
                      EQUIP IN FORGE
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPurchasing}
                    onClick={() => handlePurchase(item)}
                    className="h-7 text-[10px] font-mono font-bold uppercase cyan-gradient text-black px-3"
                  >
                    <DollarSign className="w-3 h-3 mr-0.5" />
                    {isPurchasing ? 'UNLOCKING...' : 'UNLOCK'}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
