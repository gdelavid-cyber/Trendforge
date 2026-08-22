'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Zap,
  Flame,
  Crown,
  Check,
  RotateCw,
  Eye,
  Sliders,
  Palette,
  Layers,
  ArrowRight,
  Bot,
  User,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface CosmeticItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  previewUrl: string;
  price: number;
  unlockMethod: string;
}

export function AvatarStudioClient({ user }: { user: any }) {
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'BASE' | 'SKIN' | 'ACCESSORY' | 'AURA' | 'ANIMATION'>('BASE');

  // Customization state
  const [baseModel, setBaseModel] = useState<'CYBER_HUMANOID' | 'QUANTUM_ANDROID' | 'WALL_STREET_TITAN' | 'COSMIC_ENTITY'>('CYBER_HUMANOID');
  const [selectedSkin, setSelectedSkin] = useState<string>('Neon Cyan');
  const [selectedAccessory, setSelectedAccessory] = useState<string>('Holographic Tactical Visor');
  const [selectedAura, setSelectedAura] = useState<string>('Plasma Fire Aura');
  const [selectedAnimation, setSelectedAnimation] = useState<string>('Hover Levitation Idle');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // Fetch cosmetics
    fetch('/api/web4/avatar')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cosmetics) {
          setCosmetics(data.cosmetics);
        }
      })
      .catch(() => {});

    // Fetch user agents
    fetch('/api/web4/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.agents) {
          setAgents(data.agents);
          if (data.agents.length > 0) {
            setSelectedAgentId(data.agents[0].id);
            if (data.agents[0].avatarConfig) {
              const cfg = data.agents[0].avatarConfig;
              if (cfg.baseModel) setBaseModel(cfg.baseModel);
              if (cfg.skin) setSelectedSkin(cfg.skin);
              if (cfg.accessory) setSelectedAccessory(cfg.accessory);
              if (cfg.aura) setSelectedAura(cfg.aura);
              if (cfg.animation) setSelectedAnimation(cfg.animation);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAvatar = async () => {
    if (!selectedAgentId) {
      toast.error('Please create or select an agent to equip this avatar.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/web4/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          avatarConfig: {
            baseModel,
            skin: selectedSkin,
            accessory: selectedAccessory,
            aura: selectedAura,
            animation: selectedAnimation,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Avatar successfully equipped and synchronized with Agent!');
      } else {
        toast.error(data.error || 'Failed to save avatar.');
      }
    } catch {
      toast.error('Network error saving avatar.');
    } finally {
      setSaving(false);
    }
  };

  const getBaseAvatarGraphic = () => {
    switch (baseModel) {
      case 'CYBER_HUMANOID': return '🥷';
      case 'QUANTUM_ANDROID': return '🤖';
      case 'WALL_STREET_TITAN': return '👑';
      case 'COSMIC_ENTITY': return '🌌';
      default: return '🥷';
    }
  };

  const getAccessoryGraphic = () => {
    if (selectedAccessory.includes('Visor')) return '🥽';
    if (selectedAccessory.includes('Wings')) return '🪽';
    if (selectedAccessory.includes('Crown')) return '💎';
    if (selectedAccessory.includes('Blade')) return '⚔️';
    return '';
  };

  const getAuraColor = () => {
    if (selectedAura.includes('Fire')) return 'shadow-[0_0_80px_rgba(255,0,122,0.6)] border-[#FF007A]/50 bg-[#FF007A]/10';
    if (selectedAura.includes('Matrix')) return 'shadow-[0_0_80px_rgba(0,255,102,0.6)] border-[#00FF66]/50 bg-[#00FF66]/10';
    if (selectedAura.includes('Sparkles') || selectedAura.includes('Gold')) return 'shadow-[0_0_80px_rgba(255,215,0,0.6)] border-[#FFD700]/50 bg-[#FFD700]/10';
    return 'shadow-[0_0_80px_rgba(0,240,255,0.6)] border-[#00F0FF]/50 bg-[#00F0FF]/10';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>GTA-STYLE 3D AVATAR STUDIO // WEB4 VISUAL IDENTITY</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Visual <span className="cyan-gold-gradient-text">Avatar Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Customize sovereign economic agent avatars with visual models, skins, accessories, and glowing particle auras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/marketplace/web4">
            <Button variant="outline" size="sm" className="border-white/10 text-xs font-mono uppercase text-white bg-white/[0.03]">
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-[#FFD700]" /> Cosmetics Shop
            </Button>
          </Link>
          <Button
            onClick={handleSaveAvatar}
            disabled={saving}
            size="sm"
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-5 holographic-btn font-mono"
          >
            <Check className="w-3.5 h-3.5 mr-1.5 stroke-[3]" /> {saving ? 'Syncing...' : 'Equip to Agent'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Real-Time 3D Holographic Avatar Stage */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-card p-8 flex flex-col items-center justify-center relative min-h-[460px] overflow-hidden border border-white/10">
            {/* Holographic Stage Backdrop Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Rotating 3D Platform Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-12 w-64 h-24 rounded-full border border-[#00F0FF]/30 border-dashed pointer-events-none"
              style={{ transform: 'perspective(400px) rotateX(65deg)' }}
            />

            {/* Main Visual Character Canvas */}
            <motion.div
              animate={{
                y: selectedAnimation.includes('Hover') ? [-8, 8, -8] : [0, 0, 0],
                rotate: rotationAngle,
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative z-10 w-48 h-48 rounded-3xl border-2 flex items-center justify-center text-7xl transition-all duration-500 backdrop-blur-xl ${getAuraColor()}`}
            >
              {/* Base Model Character */}
              <span>{getBaseAvatarGraphic()}</span>

              {/* Accessory Overlay */}
              {getAccessoryGraphic() && (
                <span className="absolute -top-3 -right-3 text-3xl animate-bounce">
                  {getAccessoryGraphic()}
                </span>
              )}
            </motion.div>

            {/* Stage Rotation & Zoom Controls */}
            <div className="mt-8 z-10 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotationAngle((prev) => prev - 45)}
                className="border-white/10 text-xs font-mono text-[#8E9BB4] hover:text-white bg-black/40"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" /> Rotate -45°
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotationAngle((prev) => prev + 45)}
                className="border-white/10 text-xs font-mono text-[#8E9BB4] hover:text-white bg-black/40"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" /> Rotate +45°
              </Button>
            </div>

            {/* Equipped Spec Badges */}
            <div className="mt-6 z-10 flex flex-wrap justify-center gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
                Skin: {selectedSkin}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">
                Item: {selectedAccessory}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/20">
                Aura: {selectedAura}
              </span>
            </div>
          </div>

          {/* Target Agent Selector */}
          <div className="glass-card p-4">
            <label className="text-xs font-mono text-[#8E9BB4] uppercase block mb-1 font-bold">
              Target Agent to Equip:
            </label>
            {agents.length > 0 ? (
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.archetype} // ${a.walletBalance.toFixed(1)} USDC)
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-[#8E9BB4] font-mono">
                No active Web4 agents found.{' '}
                <Link href="/builder" className="text-[#00F0FF] underline">
                  Create an agent in Agent Studio &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Customization Tabs & Cosmetics Catalog */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customization Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-xl border border-white/[0.08]">
            {[
              { key: 'BASE', label: 'Base Models', icon: User },
              { key: 'SKIN', label: 'Skins & Textures', icon: Palette },
              { key: 'ACCESSORY', label: 'Accessories', icon: Crown },
              { key: 'AURA', label: 'Particle Auras', icon: Flame },
              { key: 'ANIMATION', label: 'Animations', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab.key
                    ? 'cyan-gradient text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'text-[#8E9BB4] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Base Models */}
          {activeTab === 'BASE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'CYBER_HUMANOID', name: 'Cyber Humanoid Operative', icon: '🥷', desc: 'Tactical stealth operative optimized for high-speed web scraping and social intelligence.' },
                { id: 'QUANTUM_ANDROID', name: 'Quantum Void Android', icon: '🤖', desc: 'High-compute silicon unit built for algorithmic DeFi arbitrage and orderbook analysis.' },
                { id: 'WALL_STREET_TITAN', name: 'Wall Street Sovereign Titan', icon: '👑', desc: 'Golden executive suited for SaaS scaffolding and enterprise client conversion.' },
                { id: 'COSMIC_ENTITY', name: 'Cosmic Nebula Entity', icon: '🌌', desc: 'Multidimensional entity possessing viral video scripting and media automation.' },
              ].map((model) => (
                <div
                  key={model.id}
                  onClick={() => setBaseModel(model.id as any)}
                  className={`glass-card p-5 cursor-pointer transition-all ${
                    baseModel === model.id ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">{model.icon}</div>
                  <h4 className="text-sm font-bold text-white font-mono">{model.name}</h4>
                  <p className="text-xs text-[#8E9BB4] font-sans mt-1">{model.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Skins */}
          {activeTab === 'SKIN' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cosmetics.filter((c) => c.category === 'SKIN').map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedSkin(c.name)}
                  className={`glass-card p-4 cursor-pointer text-left transition-all ${
                    selectedSkin === c.name ? 'border-[#00F0FF] bg-[#00F0FF]/10' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{c.previewUrl}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFD700]">
                      {c.rarity}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono truncate">{c.name}</div>
                  <div className="text-[10px] text-[#8E9BB4] font-mono mt-1">
                    {c.price > 0 ? `$${c.price} USDC` : 'Free Unlocked'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Accessories */}
          {activeTab === 'ACCESSORY' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cosmetics.filter((c) => c.category === 'ACCESSORY').map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedAccessory(c.name)}
                  className={`glass-card p-4 cursor-pointer text-left transition-all ${
                    selectedAccessory === c.name ? 'border-[#00F0FF] bg-[#00F0FF]/10' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{c.previewUrl}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFD700]">
                      {c.rarity}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono truncate">{c.name}</div>
                  <div className="text-[10px] text-[#8E9BB4] font-mono mt-1">
                    {c.price > 0 ? `$${c.price} USDC` : 'Free Unlocked'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Particle Auras */}
          {activeTab === 'AURA' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cosmetics.filter((c) => c.category === 'EFFECT').map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedAura(c.name)}
                  className={`glass-card p-4 cursor-pointer text-left transition-all ${
                    selectedAura === c.name ? 'border-[#00F0FF] bg-[#00F0FF]/10' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{c.previewUrl}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFD700]">
                      {c.rarity}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono truncate">{c.name}</div>
                  <div className="text-[10px] text-[#8E9BB4] font-mono mt-1">
                    {c.price > 0 ? `$${c.price} USDC` : 'Free Unlocked'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Animations */}
          {activeTab === 'ANIMATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cosmetics.filter((c) => c.category === 'ANIMATION').map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedAnimation(c.name)}
                  className={`glass-card p-4 cursor-pointer text-left transition-all ${
                    selectedAnimation === c.name ? 'border-[#00F0FF] bg-[#00F0FF]/10' : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{c.previewUrl}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFD700]">
                      {c.rarity}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono truncate">{c.name}</div>
                  <div className="text-[10px] text-[#8E9BB4] font-mono mt-1">
                    {c.price > 0 ? `$${c.price} USDC` : 'Free Unlocked'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
