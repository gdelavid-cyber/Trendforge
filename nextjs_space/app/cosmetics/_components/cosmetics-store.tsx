'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { COSMETICS_CATALOG, COSMETIC_TIERS, CatalogItem } from '@/lib/cosmetics/catalog';
import Link from 'next/link';

export function CosmeticsStore({ user }: { user: any }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const filteredItems = selectedCategory === 'ALL'
    ? COSMETICS_CATALOG
    : COSMETICS_CATALOG.filter((c) => c.category === selectedCategory);

  const handlePurchase = async (item: CatalogItem) => {
    setPurchasingId(item.id);
    setTimeout(() => {
      setPurchasingId(null);
      toast.success(`Successfully unlocked ${item.name}! Equip it in Avatar Studio.`);
    }, 900);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>GTA-STYLE 50+ ITEM COSMETICS STORE // WEARABLE NFT ASSETS</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Cosmetics <span className="cyan-gold-gradient-text">Black Market</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Equip your autonomous economic agents with 50+ GTA skins, holographic tactical visors, plasma wings, and custom animations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/avatar-studio">
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono">
              Open Avatar Studio &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Pricing Tier Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
        {Object.entries(COSMETIC_TIERS).map(([key, tier]) => (
          <div key={key} className={`p-2.5 rounded-xl border ${tier.color} text-center font-mono`}>
            <div className="text-xs font-bold uppercase">{tier.label}</div>
            <div className="text-[11px] font-black mt-0.5">{tier.price > 0 ? `$${tier.price}` : 'Quest Drop'}</div>
          </div>
        ))}
      </div>

      {/* Category Navigation Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'SKIN', 'HEADWEAR', 'WINGS', 'AURA', 'ANIMATION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              selectedCategory === cat
                ? 'cyan-gradient text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-black/40 border border-white/10 text-[#8E9BB4] hover:text-white'
            }`}
          >
            {cat === 'ALL' ? '🌟 All 50+ Items' : cat}
          </button>
        ))}
      </div>

      {/* 50+ Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredItems.map((item) => {
          const isBuying = purchasingId === item.id;
          const tierStyle = COSMETIC_TIERS[item.rarity];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex flex-col justify-between relative border border-white/10 hover:border-[#00F0FF]/40 transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${tierStyle.color}`}>
                    {item.rarity}
                  </span>
                  <span className="text-xs font-mono font-bold text-green-400">
                    {item.price > 0 ? `$${item.price}` : 'FREE'}
                  </span>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-3xl mx-auto my-3 group-hover:scale-110 transition-transform">
                  {item.previewUrl}
                </div>

                <h3 className="text-xs font-bold text-white font-mono truncate text-center mb-1">
                  {item.name}
                </h3>
                <p className="text-[10px] text-[#8E9BB4] font-sans line-clamp-2 text-center mb-4">
                  {item.desc}
                </p>
              </div>

              <Button
                onClick={() => handlePurchase(item)}
                disabled={isBuying}
                size="sm"
                className="w-full cyan-gradient text-black font-extrabold uppercase text-[10px] h-8 holographic-btn font-mono"
              >
                {isBuying ? (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                ) : (
                  <>
                    <Coins className="w-3 h-3 mr-1" /> {item.price > 0 ? `Unlock $${item.price}` : 'Claim Quest'}
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
