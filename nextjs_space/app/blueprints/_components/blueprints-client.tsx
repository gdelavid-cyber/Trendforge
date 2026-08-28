'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  ArrowRight,
  Layers,
  Wand2,
  CheckCircle2,
  Code,
  DollarSign,
  Shield,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BlueprintDef {
  category: string;
  name: string;
  description: string;
  defaultMilestones: Array<{
    order: number;
    name: string;
    description: string;
    type: string;
  }>;
  deliverableTypes: string[];
  suggestedPlatforms: string[];
  defaultPricingCents: number;
}

interface CustomBlueprint {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  milestones: any;
  salesPipelineConfig: any;
  isCustom: boolean;
  createdAt: string;
}

interface Props {
  defaults: BlueprintDef[];
  customBlueprints: CustomBlueprint[];
}

export function BlueprintsClient({ defaults, customBlueprints }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customList, setCustomList] = useState<CustomBlueprint[]>(customBlueprints);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const defaultMilestones = [
        { order: 1, name: 'Market Intelligence & Analysis', description: 'Scrape live demand and competitor pricing.', type: 'RESEARCH' },
        { order: 2, name: 'Turnkey Asset Production', description: 'Generate primary deliverable files.', type: 'PRODUCTION' },
        { order: 3, name: 'Automated Quality Audit', description: 'Validate quality, retention, and originality.', type: 'VALIDATION' },
        { order: 4, name: 'Buyer Lead Sourcing', description: 'Scrape high-intent buyers across platforms.', type: 'SALES_SETUP' },
        { order: 5, name: 'Sales Pipeline Execution', description: 'Deploy Option A, B, or C sales workflows.', type: 'SALES_EXECUTION' },
        { order: 6, name: 'Escrow Payment & Payout', description: 'Collect funds and release payout on delivery.', type: 'PAYMENT' },
        { order: 7, name: 'Settlement & Ledger Update', description: 'Record sale provenance in dashboard.', type: 'COMPLETED' },
      ];

      const res = await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          milestones: defaultMilestones,
          salesPipelineConfig: { channels: ['fiverr', 'upwork', 'email', 'social'] },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Custom blueprint registered successfully!');
        setCustomList((prev) => [data.blueprint, ...prev]);
        setIsCreateOpen(false);
        setName('');
        setDescription('');
      } else {
        toast.error(data.error || 'Failed to create blueprint');
      }
    } catch (e) {
      toast.error('Network error creating blueprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#00F0FF] uppercase">
              AUTONOMOUS ARCHITECTURE // BLUEPRINT REGISTRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Task Blueprints & Swarm Templates
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Modular 7-milestone execution definitions for any digital or physical wealth opportunity.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="liquid-glass-strong text-white font-mono text-xs rounded-full px-5 h-10 font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
        >
          <Plus className="w-4 h-4 text-[#00F0FF]" />
          <span>New Blueprint</span>
        </Button>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaults.map((bp) => (
          <div
            key={bp.category}
            className="liquid-glass rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:scale-[1.02] transition-transform"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] font-bold uppercase">
                  {bp.category}
                </span>
                <span className="text-[10px] font-mono text-green-400 font-bold">
                  Avg: ${(bp.defaultPricingCents / 100).toFixed(0)}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{bp.name}</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">{bp.description}</p>

              <div className="pt-2 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">7-Step Milestones</div>
                <div className="space-y-1 text-[11px] font-mono text-white/80">
                  {bp.defaultMilestones.slice(0, 4).map((m) => (
                    <div key={m.order} className="flex items-center gap-2">
                      <span className="text-[#00F0FF] text-[9px]">0{m.order}.</span>
                      <span className="truncate">{m.name}</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-white/40">+ 3 sales & settlement steps</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40">
                Platforms: {bp.suggestedPlatforms.join(', ')}
              </span>
              <Link href="/tasks">
                <Button size="sm" variant="outline" className="text-xs font-mono rounded-full h-8 border-white/15">
                  Deploy
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {customList.map((cb) => (
          <div
            key={cb.id}
            className="liquid-glass rounded-3xl p-6 flex flex-col justify-between space-y-4 border border-purple-500/30"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                  CUSTOM BLUEPRINT
                </span>
                <span className="text-[9px] font-mono text-white/40">User Owned</span>
              </div>

              <h3 className="text-base font-bold text-white">{cb.name}</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">{cb.description || 'Custom autonomous blueprint.'}</p>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40">7 Milestones Configured</span>
              <Link href="/tasks">
                <Button size="sm" className="liquid-glass-strong text-xs font-mono rounded-full h-8 text-white">
                  Deploy Swarm
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0D1A] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white uppercase">Create Task Blueprint</div>
                  <div className="text-[10px] text-white/50">Define custom autonomous workflow</div>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBlueprint} className="space-y-4">
              <div>
                <label className="text-[10px] text-white/50 uppercase block mb-1">Blueprint Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Autonomous Newsletter Synthesizer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/50 uppercase block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#050814] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="AI_CONTENT">AI Content & Video</option>
                  <option value="ECOMMERCE">E-Commerce & POD</option>
                  <option value="EDUCATION">Digital Products & Ebooks</option>
                  <option value="CRYPTO_FINANCE">Web3 & Smart Contracts</option>
                  <option value="AGENT_ECONOMY">AI Agent & SaaS</option>
                  <option value="CUSTOM">Custom Workflow</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/50 uppercase block mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the objective, target deliverables, and target audience..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00F0FF] font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full h-9 text-xs border-white/15"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="liquid-glass-strong text-white rounded-full px-6 h-9 font-bold hover:scale-105 transition-transform"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Blueprint'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
