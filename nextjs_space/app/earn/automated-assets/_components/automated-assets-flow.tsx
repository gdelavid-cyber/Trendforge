'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Copy,
  DollarSign,
  Globe,
  Layers,
  Lock,
  Share2,
  Sparkles,
  Store,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { AgentSwarmDrawer } from '@/components/earn/agent-swarm-drawer';
import { UnitEconomicsModal } from '@/components/earn/unit-economics-modal';
import { FULL_FINANCIAL_MODELS } from '@/lib/earn/agents';

interface AutomatedAssetsFlowProps {
  userEarnings?: number;
}

export function AutomatedAssetsFlow({ userEarnings = 0 }: AutomatedAssetsFlowProps) {
  const [activeAssetType, setActiveAssetType] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showEconomicsModal, setShowEconomicsModal] = useState(false);

  // Referral flow state
  const referralCode = 'TRENDLY-VIP-88';
  const referralLink = `https://trendly.io/ref/${referralCode}`;

  // Marketplace flow state
  const [marketAssetTitle, setMarketAssetTitle] = useState('HVAC Emergency Voice Dispatch SOP Pack');
  const [marketAssetPrice, setMarketAssetPrice] = useState('49.00');

  // Micro-SaaS flow state
  const [saasNiche, setSaasNiche] = useState('AI Appointment Bot for Dental Clinics');

  // SCREEN 1: ASSET TYPE SELECTOR
  if (!activeAssetType) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-left font-sans">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-xs font-mono text-[#8b5cf6] mb-4">
            <Layers className="w-3.5 h-3.5" /> RECURRING ASSET ARCHITECTURE
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">
            Build Income While You Sleep
          </h1>
          <p className="text-sm md:text-base text-[#8E9BB4] mb-4">
            Package winning moves into passive compounding engines. Choose your asset class to launch.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEconomicsModal(true)}
            className="h-8 text-xs font-mono border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" /> Inspect Passive Math ($11,500/mo Month 12)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Marketplace Asset */}
          <div className="rounded-3xl p-7 bg-white/[0.02] border border-white/10 hover:border-[#8b5cf6]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2.5 py-1 rounded-full border border-[#00FF66]/20">
                  70–80% REVENUE SHARE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Marketplace Asset</h3>
              <p className="text-xs text-[#8E9BB4] mb-6 leading-relaxed">
                Package your proven prompts, video templates, or client SOPs to sell repeatedly to thousands of Trendly operators.
              </p>
              <div className="space-y-2 font-mono text-xs text-white/90 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Passive royalties on every sale
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Instant digital delivery to buyers
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveAssetType('marketplace');
                setCurrentStep(1);
              }}
              className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-11 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-[#8b5cf6]/90"
            >
              Create Asset &rarr;
            </Button>
          </div>

          {/* Card 2: Referral Program */}
          <div className="rounded-3xl p-7 bg-white/[0.02] border border-white/10 hover:border-[#8b5cf6]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2.5 py-1 rounded-full border border-[#00FF66]/20">
                  10% LIFETIME RECURRING
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Referral Program</h3>
              <p className="text-xs text-[#8E9BB4] mb-6 leading-relaxed">
                Share your unique link with creators and agencies. Earn a recurring 10% monthly commission on all active subscriptions.
              </p>
              <div className="space-y-2 font-mono text-xs text-white/90 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Zero fulfillment or client work
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Compounds month after month
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveAssetType('referral');
                setCurrentStep(1);
              }}
              className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-11 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-[#8b5cf6]/90"
            >
              Get My Link &rarr;
            </Button>
          </div>

          {/* Card 3: Micro-SaaS Deployment */}
          <div className="rounded-3xl p-7 bg-white/[0.02] border border-white/10 hover:border-[#8b5cf6]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#FFD700] bg-[#FFD700]/10 px-2.5 py-1 rounded-full border border-[#FFD700]/20">
                  $19–$49/MO SUBSCRIPTIONS
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Micro-SaaS Deployment</h3>
              <p className="text-xs text-[#8E9BB4] mb-6 leading-relaxed">
                Deploy full Next.js recurring applications directly to Vercel on your own custom domain. AI handles the backend and UI.
              </p>
              <div className="space-y-2 font-mono text-xs text-white/90 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Direct Stripe customer ownership
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> $10–$20 one-time domain cost
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveAssetType('microsaas');
                setCurrentStep(1);
              }}
              className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-11 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-[#8b5cf6]/90"
            >
              Build SaaS &rarr;
            </Button>
          </div>

          {/* Card 4: Web4 Autonomous Agents (LOCKED) */}
          <div className="rounded-3xl p-7 bg-black/40 border border-white/5 relative flex flex-col justify-between opacity-80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-[#FFD700] bg-[#FFD700]/10 px-2.5 py-1 rounded-full border border-[#FFD700]/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> LOCKED
                </span>
              </div>
              <h3 className="text-xl font-bold text-white/80 mb-2">Web4 Autonomous Agents</h3>
              <p className="text-xs text-[#8E9BB4] mb-4 leading-relaxed">
                Autonomous agent workers with dedicated smart-contract wallets and execution guardrails.
              </p>
              <div className="p-3.5 rounded-xl bg-[#FFD700]/5 border border-[#FFD700]/20 font-mono text-xs text-[#FFD700] mb-6">
                <div className="font-bold mb-1">Unlock Milestone:</div>
                <p className="text-[11px] text-[#8E9BB4]">
                  Unlocks automatically after you have earned your first $1,000 on Trendly.
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#FFD700] h-full"
                    style={{ width: `${Math.min(100, (userEarnings / 1000) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right mt-1 text-[#8E9BB4]">
                  ${userEarnings.toFixed(0)} / $1,000.00
                </div>
              </div>
            </div>
            <Button
              disabled
              variant="outline"
              className="w-full border-white/10 text-white/40 font-mono text-xs uppercase h-11"
            >
              Unlocks at $1,000 Earned
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // DEDICATED INTERACTIVE SUB-FLOWS
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-left font-sans">
      {/* Sub-flow Header */}
      <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between font-mono">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setActiveAssetType(null)}
          className="h-8 text-xs text-[#8E9BB4] hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All Asset Types
        </Button>
        <span className="text-xs font-bold text-[#8b5cf6] uppercase">
          {activeAssetType.toUpperCase()} ASSET PIPELINE
        </span>
      </div>

      {/* MARKETPLACE FLOW */}
      {activeAssetType === 'marketplace' && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Package Marketplace Asset</h2>
          <p className="text-xs text-[#8E9BB4]">
            Package your winning deliverable blueprint so other operators can license it.
          </p>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[#8E9BB4] mb-1 uppercase">Asset Title:</label>
              <input
                type="text"
                value={marketAssetTitle}
                onChange={(e) => setMarketAssetTitle(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-[#8E9BB4] mb-1 uppercase">Price (USDC/USD):</label>
              <div className="flex items-center gap-2">
                <span className="text-white">$</span>
                <input
                  type="text"
                  value={marketAssetPrice}
                  onChange={(e) => setMarketAssetPrice(e.target.value)}
                  className="w-32 bg-black/60 border border-white/10 rounded-xl p-3 text-white text-sm"
                />
                <span className="text-[#8E9BB4]">You keep 80% (${(parseFloat(marketAssetPrice || '0') * 0.8).toFixed(2)}) per license.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="font-bold text-white">Included in Package:</div>
              <div className="flex items-center gap-2 text-[#00FF66]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Vapi/Retell Voice Bot Script Manifest
              </div>
              <div className="flex items-center gap-2 text-[#00FF66]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Contractor Cold Pitch Deck &amp; Email Copy
              </div>
              <div className="flex items-center gap-2 text-[#00FF66]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Setup SOP Documentation PDF
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => {
              toast.success('Asset published to Trendly Marketplace!');
              setActiveAssetType(null);
            }}
            className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-12 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            Publish to Marketplace &rarr;
          </Button>
        </div>
      )}

      {/* REFERRAL FLOW */}
      {activeAssetType === 'referral' && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Your 10% Lifetime Referral Engine</h2>
          <p className="text-xs text-[#8E9BB4]">
            Share your link with founders, agencies, or creators. When they upgrade, 10% of their subscription routes to your balance monthly.
          </p>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-3">
            <span className="text-[10px] text-[#8b5cf6] uppercase block font-bold">Your Unique Invite Link:</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-white select-all">{referralLink}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  toast.success('Referral link copied to clipboard!');
                }}
                className="text-xs text-[#8b5cf6]"
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
              </Button>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="font-bold text-white uppercase">Pre-Drafted Share Templates:</div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-[11px] text-[#8E9BB4]">
                "If you are running client deliverables or video clipping, check out Trendly. Slashes 90% of manual asset production time: {referralLink}"
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `If you are running client deliverables or video clipping, check out Trendly. Slashes 90% of manual asset production time: ${referralLink}`
                  );
                  toast.success('Template copied!');
                }}
                className="text-[11px] h-7 border-white/10"
              >
                Copy Post Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MICRO-SAAS FLOW */}
      {activeAssetType === 'microsaas' && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Deploy Turnkey Micro-SaaS</h2>
          <p className="text-xs text-[#8E9BB4]">
            Scaffold a targeted vertical subscription application and deploy to Vercel with Stripe billing.
          </p>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[#8E9BB4] mb-1 uppercase">Select SaaS Niche:</label>
              <input
                type="text"
                value={saasNiche}
                onChange={(e) => setSaasNiche(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="font-bold text-white">Automated Architecture:</div>
              <div className="flex items-center gap-2 text-[#8b5cf6]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Next.js 14 App Router + Tailwind CSS
              </div>
              <div className="flex items-center gap-2 text-[#8b5cf6]">
                <CheckCircle2 className="w-3.5 h-3.5" /> NextAuth authentication &amp; PostgreSQL Prisma schema
              </div>
              <div className="flex items-center gap-2 text-[#8b5cf6]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Stripe recurring subscription webhook handlers
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => {
              toast.success('Scaffolding Micro-SaaS repository... Redirecting to deploy guide.');
              setActiveAssetType(null);
            }}
            className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-12 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            Generate Code &amp; Deploy &rarr;
          </Button>
        </div>
      )}

      {/* Floating 9-Agent Swarm Drawer */}
      <AgentSwarmDrawer />

      {/* Molecular Economics Modal */}
      <UnitEconomicsModal
        isOpen={showEconomicsModal}
        onClose={() => setShowEconomicsModal(false)}
        model={FULL_FINANCIAL_MODELS['automated-assets-suite']}
      />
    </div>
  );
}