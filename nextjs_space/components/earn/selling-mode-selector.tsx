'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, ShieldAlert, Sparkles, User, Zap, Lock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { CopilotChannel, CopilotMode } from '@/lib/copilot/types';

interface SellingModeSelectorProps {
  executionId?: string;
  leadId?: string;
  leadSource?: string;
  defaultPrice?: number;
  onActivated?: (sessionData: any) => void;
}

export function SellingModeSelector({
  executionId = 'default_exec',
  leadId,
  leadSource = 'email',
  defaultPrice = 450,
  onActivated,
}: SellingModeSelectorProps) {
  const [mode, setMode] = useState<CopilotMode>('co_pilot');
  const [channel, setChannel] = useState<CopilotChannel>(
    (leadSource?.toLowerCase() as CopilotChannel) || 'email'
  );
  const [offerPrice, setOfferPrice] = useState<number>(defaultPrice);
  const [priceFloor, setPriceFloor] = useState<number>(Math.round(defaultPrice * 0.6));
  const [loading, setLoading] = useState<boolean>(false);

  // Hard-coded legal check: auto_close blocked on linkedin, upwork, x
  const isAutoCloseBlocked = ['linkedin', 'upwork', 'x', 'phone'].includes(channel.toLowerCase());

  const handleActivate = async () => {
    if (mode === 'auto_close' && isAutoCloseBlocked) {
      toast.error(`Auto-Close is prohibited on ${channel.toUpperCase()} due to platform TOS.`);
      return;
    }

    if (priceFloor > offerPrice) {
      toast.error('Price floor cannot be higher than your initial offer price.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/earn/sales/activate-sell-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          leadId,
          channel,
          mode,
          offerPrice,
          priceFloor,
          productDescription: 'Turnkey AI Service / Automated Deliverable',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate sales mode');
      }

      toast.success(data.message || 'Sales Mode activated!');
      if (onActivated) {
        onActivated(data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate sales mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#07070C] border border-white/10 text-left font-mono space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5" /> SALES EXECUTION ENGINE · METHOD X
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-sans">
            Activate <span className="cyan-gradient-text">Sales Closing Layer</span>
          </h3>
          <p className="text-xs text-[#8E9BB4] mt-1">
            Choose how your deliverable will be sold to qualified buyers.
          </p>
        </div>

        {/* Channel Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8E9BB4]">Channel:</span>
          <select
            value={channel}
            onChange={(e) => {
              const ch = e.target.value as CopilotChannel;
              setChannel(ch);
              if (['linkedin', 'upwork', 'x', 'phone'].includes(ch) && mode === 'auto_close') {
                setMode('co_pilot');
                toast.info(`Auto-Close disabled on ${ch.toUpperCase()}. Switched to AI Co-Pilot.`);
              }
            }}
            className="bg-[#0B0B14] border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#00F0FF]"
          >
            <option value="email">Email Outreach</option>
            <option value="in_app">In-App Chat</option>
            <option value="reddit">Reddit Reply</option>
            <option value="phone">Phone / Twilio Call</option>
            <option value="linkedin">LinkedIn DM (Co-Pilot/Manual Only)</option>
            <option value="upwork">Upwork Proposal (Co-Pilot/Manual Only)</option>
          </select>
        </div>
      </div>

      {/* 3 Selling Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Manual */}
        <div
          onClick={() => setMode('manual')}
          className={`cursor-pointer p-5 rounded-xl border transition-all flex flex-col justify-between ${
            mode === 'manual'
              ? 'bg-[#00F0FF]/5 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.15)]'
              : 'bg-[#0B0B14] border-white/10 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              {mode === 'manual' && <CheckCircle2 className="w-5 h-5 text-[#00F0FF]" />}
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-sans">1. Manual Close</h4>
            <p className="text-xs text-[#8E9BB4] mt-2 leading-relaxed">
              You receive the qualified buyer profile, deliverable link, and verified contact. Full human ownership of
              every message and call.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/50">
            Human sells · 0% automated outreach
          </div>
        </div>

        {/* Card 2: AI Co-Pilot (Recommended) */}
        <div
          onClick={() => setMode('co_pilot')}
          className={`cursor-pointer p-5 rounded-xl border transition-all flex flex-col justify-between relative ${
            mode === 'co_pilot'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.25)]'
              : 'bg-[#0B0B14] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#00F0FF] text-black font-extrabold text-[10px] uppercase">
            Recommended
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Bot className="w-5 h-5" />
              </div>
              {mode === 'co_pilot' && <CheckCircle2 className="w-5 h-5 text-[#00F0FF]" />}
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-sans">2. AI Co-Pilot</h4>
            <p className="text-xs text-[#8E9BB4] mt-2 leading-relaxed">
              AI monitors buyer replies, delivers live objection handling &amp; coaching alerts in &lt;3s. You approve or
              edit every message with 1 click.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-[#00F0FF]">
            Aware / Alert / Advise · Human in control
          </div>
        </div>

        {/* Card 3: Auto-Close */}
        <div
          onClick={() => {
            if (!isAutoCloseBlocked) {
              setMode('auto_close');
            } else {
              toast.error(`Auto-Close is legally prohibited on ${channel.toUpperCase()}.`);
            }
          }}
          className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
            isAutoCloseBlocked
              ? 'opacity-40 cursor-not-allowed bg-black/40 border-white/5'
              : mode === 'auto_close'
              ? 'cursor-pointer bg-[#FFD700]/10 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.2)]'
              : 'cursor-pointer bg-[#0B0B14] border-white/10 hover:border-white/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isAutoCloseBlocked
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                }`}
              >
                {isAutoCloseBlocked ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              {mode === 'auto_close' && !isAutoCloseBlocked && (
                <CheckCircle2 className="w-5 h-5 text-[#FFD700]" />
              )}
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-sans">3. Auto-Close</h4>
            <p className="text-xs text-[#8E9BB4] mt-2 leading-relaxed">
              Autonomous negotiation with legal AI disclosure, price floor safety, objection handling, and Stripe
              payment link closing.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            {isAutoCloseBlocked ? (
              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Prohibited on {channel.toUpperCase()}
              </span>
            ) : (
              <span className="text-[10px] text-[#FFD700]">
                Compliant channel approved · Hard price floor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Safeguard Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div>
          <label className="text-xs text-[#8E9BB4] uppercase block mb-1">Target Offer Price ($)</label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-[#8E9BB4] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(Number(e.target.value))}
              className="pl-9 bg-[#0B0B14] border-white/20 text-white font-bold text-sm"
              min="10"
            />
          </div>
          <span className="text-[10px] text-[#8E9BB4] mt-1 block">What the initial proposal quotes.</span>
        </div>

        <div>
          <label className="text-xs text-[#8E9BB4] uppercase block mb-1">
            Absolute Price Floor ($) <span className="text-[#FFD700]">· Non-Negotiable</span>
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-[#8E9BB4] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="number"
              value={priceFloor}
              onChange={(e) => setPriceFloor(Number(e.target.value))}
              className="pl-9 bg-[#0B0B14] border-white/20 text-white font-bold text-sm"
              min="5"
            />
          </div>
          <span className="text-[10px] text-[#8E9BB4] mt-1 block">
            AI will NEVER accept or quote a price below this floor.
          </span>
        </div>
      </div>

      {/* Activation Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-[#8E9BB4]">
          Mode Selected: <span className="text-white font-bold uppercase">{mode}</span> on{' '}
          <span className="text-[#00F0FF] uppercase">{channel}</span>
        </div>

        <Button
          onClick={handleActivate}
          disabled={loading || (mode === 'auto_close' && isAutoCloseBlocked)}
          className="cyan-gradient text-black font-extrabold uppercase text-xs h-11 px-6 holographic-btn"
        >
          {loading ? 'Activating Engine...' : `Deploy ${mode === 'auto_close' ? 'Auto-Closer' : 'Sales Co-Pilot'} →`}
        </Button>
      </div>
    </div>
  );
}
