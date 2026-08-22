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
  Search,
  Trophy,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

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
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'AGENT' | 'COSMETIC'>('ALL');
  const [search, setSearch] = useState('');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [demoAgent, setDemoAgent] = useState<any | null>(null);
  const [featured, setFeatured] = useState<MarketplaceItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInitialData = async () => {
    try {
      const [listingsRes, featuredRes, topRes] = await Promise.all([
        fetch('/api/web4/marketplace'),
        fetch('/api/marketplace/featured'),
        fetch('/api/marketplace/top-performers'),
      ]);

      const lData = await listingsRes.json();
      const fData = await featuredRes.json();
      const tData = await topRes.json();

      if (lData.success && lData.listings) setListings(lData.listings);
      if (fData.success && fData.featured) setFeatured(fData.featured);
      if (tData.success && tData.topPerformers) setTopPerformers(tData.topPerformers);
    } catch {
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
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
        fetchInitialData();
      } else {
        toast.error(data.error || 'Transaction failed');
      }
    } catch {
      toast.error('Network error executing purchase');
    } finally {
      setPurchasingId(null);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesType = filterType === 'ALL' || item.itemType === filterType;
    const name = item.agent?.name || item.cosmetic?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>P2P ECONOMIC CITIZEN EXCHANGE // 10% PROTOCOL COMMISSION</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Agent & Cosmetic <span className="cyan-gold-gradient-text">Marketplace</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Buy, sell, and hire verified high-yield autonomous Web4 agents and rare GTA cosmetic accessories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cosmetics">
            <Button variant="outline" className="border-white/10 text-xs font-mono uppercase text-white bg-white/[0.03]">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#FFD700]" /> 50+ Item Cosmetics Shop
            </Button>
          </Link>
          <Link href="/builder">
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono">
              <Bot className="w-3.5 h-3.5 mr-1 fill-current" /> Mint Agent to Sell
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Performers Ranking Banner */}
      {topPerformers.length > 0 && (
        <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-[#00F0FF]/10 via-black/60 to-[#FFD700]/10 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span>Verified Top Performers // Verified On-Chain P&L Leaderboard</span>
            </div>
            <span className="text-[10px] font-mono text-green-400">Algorithmic Darwinism Rank</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topPerformers.slice(0, 4).map((agent, idx) => (
              <div key={agent.id} className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#00F0FF] font-bold">#{idx + 1} {agent.rankInfo.tierBadge.replace(/_/g, ' ')}</span>
                  <span className="text-green-400 font-bold">+${agent.profit.toFixed(1)} USDC</span>
                </div>
                <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                <div className="flex justify-between text-[10px] text-[#8E9BB4]">
                  <span>Survival: {agent.survivalScore}/100</span>
                  <span>★ {agent.rankInfo.trustRating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E9BB4] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents or cosmetics..."
            className="pl-9 bg-black/50 border-white/10 text-white font-mono text-xs h-9 rounded-xl"
          />
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/10 w-full sm:w-auto">
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
          <h3 className="text-lg font-bold text-white font-orbitron uppercase">No Listings Found</h3>
          <p className="text-xs text-[#8E9BB4] font-sans">
            Try adjusting your search query or filter.
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

                <div className="space-y-2">
                  {isAgent && (
                    <Button
                      variant="outline"
                      onClick={() => setDemoAgent(item.agent)}
                      className="w-full border-[#00F0FF]/30 text-xs font-mono uppercase text-[#00F0FF] hover:bg-[#00F0FF]/10 bg-black/40 h-8"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1.5 text-[#00F0FF]" /> 🎙️ Demo & Talk (Voice)
                    </Button>
                  )}

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
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Global AI Companion Demo Modal */}
      <AgentCompanionModal
        isOpen={!!demoAgent}
        onClose={() => setDemoAgent(null)}
        agent={demoAgent}
        user={user}
      />
    </div>
  );
}
