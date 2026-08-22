'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarketplaceItem {
  id: string;
  sellerId: string;
  price: number;
  currency: string;
  itemType: string;
  status: string;
  agent?: any;
  cosmetic?: any;
  seller?: { name: string; email: string };
}

export function Web4MarketplaceClient({ user }: { user: any }) {
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'AGENT' | 'COSMETIC'>('ALL');
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/web4/marketplace');
      const data = await res.json();
      if (data.success && data.listings) {
        setListings(data.listings);
      }
    } catch {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleBuy = async (listingId: string) => {
    setPurchasingId(listingId);
    try {
      const res = await fetch('/api/web4/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BUY', listingId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${data.message} (10% platform commission deducted: $${data.commissionPaid})`);
        fetchListings();
      } else {
        toast.error(data.error || 'Transaction failed');
      }
    } catch {
      toast.error('Network error executing purchase');
    } finally {
      setPurchasingId(null);
    }
  };

  const filteredListings = filterType === 'ALL'
    ? listings
    : listings.filter((l) => l.itemType === filterType);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>P2P ECONOMIC CITIZEN EXCHANGE // 10% PLATFORM PROTOCOL COMMISSION</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Agent & Cosmetic <span className="cyan-gold-gradient-text">Marketplace</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Buy, sell, and hire verified high-yield autonomous Web4 agents and rare GTA cosmetic accessories.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
          {['ALL', 'AGENT', 'COSMETIC'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterType === type
                  ? 'cyan-gradient text-black font-bold'
                  : 'text-[#8E9BB4] hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Listings' : type === 'AGENT' ? '🤖 Sovereign Agents' : '👑 Rare Cosmetics'}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8E9BB4] font-mono">LOADING MARKETPLACE ORDERBOOKS...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <Tag className="w-12 h-12 text-[#FFD700] mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-white font-orbitron uppercase">No Active Listings Found</h3>
          <p className="text-xs text-[#8E9BB4] font-sans">
            Be the first operative to list an autonomous agent or rare cosmetic in the Web4 exchange.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const isBuying = purchasingId === item.id;
            const isAgent = item.itemType === 'AGENT' && item.agent;
            const isCosmetic = item.itemType === 'COSMETIC' && item.cosmetic;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col justify-between relative border border-white/10 hover:border-[#00F0FF]/40 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                      {isAgent ? item.agent.archetype : item.cosmetic?.category || 'ITEM'}
                    </span>
                    <span className="text-sm font-mono font-black text-green-400">
                      ${item.price.toFixed(2)} {item.currency}
                    </span>
                  </div>

                  {/* Item Preview */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl">
                      {isAgent ? '🤖' : item.cosmetic?.previewUrl || '👑'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono truncate max-w-[200px]">
                        {isAgent ? item.agent.name : item.cosmetic?.name}
                      </h3>
                      <span className="text-[10px] text-[#8E9BB4] font-mono block">
                        Seller: {item.seller?.name || 'Protocol Genesis'}
                      </span>
                    </div>
                  </div>

                  {/* Agent P&L / Spec Breakdown */}
                  {isAgent && (
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1 text-xs font-mono mb-4">
                      <div className="flex justify-between">
                        <span className="text-[#8E9BB4]">Verified Profit:</span>
                        <span className="text-green-400 font-bold">+${item.agent.profit.toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E9BB4]">Darwinism Score:</span>
                        <span className="text-[#00F0FF] font-bold">{item.agent.survivalScore}/100</span>
                      </div>
                    </div>
                  )}

                  {isCosmetic && (
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs font-mono mb-4">
                      <span className="text-[#FFD700] uppercase font-bold">Rarity: {item.cosmetic.rarity}</span>
                      <p className="text-[10px] text-[#8E9BB4] font-sans mt-1">Unlockable for GTA avatar customizer</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleBuy(item.id)}
                  disabled={isBuying}
                  className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-9 holographic-btn font-mono"
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Settling on Conway...
                    </>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5 mr-1.5 fill-current" /> Buy Now (${item.price} USDC)
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
