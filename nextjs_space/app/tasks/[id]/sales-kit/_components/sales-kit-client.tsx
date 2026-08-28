'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Copy,
  Check,
  DollarSign,
  Shield,
  Send,
  MessageSquare,
  HelpCircle,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  task: any;
  salesKit: any;
}

export function SalesKitClient({ task, salesKit }: Props) {
  const [activeTab, setActiveTab] = useState<'templates' | 'pricing' | 'objections' | 'followup'>('templates');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const templates: any[] = salesKit?.outreachTemplates || [];
  const objections: any[] = salesKit?.objectionScripts || [];
  const followUps: any[] = salesKit?.followUpSequences || [];
  const price = salesKit?.pricingRecommendation ? (salesKit.pricingRecommendation / 100).toFixed(2) : '150.00';

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Task Workspace</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD700] uppercase">
              SALES KIT VAULT // OPTION B ASSETS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Turnkey Sales Kit for {task.title}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/tasks/${task.id}/sales`}>
            <Button
              size="sm"
              className="liquid-glass-strong text-white text-xs font-mono rounded-full px-5 h-9 font-bold hover:scale-105 transition-transform"
            >
              Open Pipeline Kanban →
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-fit font-mono text-xs">
        {[
          { id: 'templates', label: 'Outreach Templates', icon: Send },
          { id: 'pricing', label: 'Pricing Strategy', icon: DollarSign },
          { id: 'objections', label: 'Objection Scripts', icon: HelpCircle },
          { id: 'followup', label: 'Follow-Up Sequence', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl, i) => (
            <div
              key={i}
              className="liquid-glass rounded-3xl p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase px-2.5 py-0.5 rounded-full bg-[#00F0FF]/10">
                    {tpl.channel.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${tpl.subject ? tpl.subject + '\n\n' : ''}${tpl.body}`, i)}
                    className="text-xs font-mono text-white/50 hover:text-white flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white">{tpl.title}</h3>

                {tpl.subject && (
                  <div className="text-xs font-mono text-white/80 bg-white/5 p-2 rounded-xl">
                    <span className="text-white/40">Subject: </span>
                    {tpl.subject}
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[#030614] border border-white/5 text-xs text-white/85 font-sans whitespace-pre-wrap leading-relaxed">
                  {tpl.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Pricing */}
      {activeTab === 'pricing' && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xl">
              $
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase">RECOMMENDED SALE PRICE</div>
              <div className="text-3xl font-bold text-green-400 font-mono">${price} USD</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase">Market Justification</h4>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              {salesKit?.pricingRationale ||
                'Pricing benchmarked against active Upwork job budgets and Fiverr seller tiers for high-demand deliverables.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase">Product Copy & Deliverable Summary</h4>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              {salesKit?.productCopy || 'Full commercial package ready for instant transfer and client deployment.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Objections */}
      {activeTab === 'objections' && (
        <div className="space-y-3.5">
          {objections.map((obj, i) => (
            <div key={i} className="liquid-glass rounded-3xl p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                  Q
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white font-sans">{obj.objection}</h4>
                  <div className="mt-2 text-xs text-white/80 leading-relaxed font-sans bg-white/5 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[#00F0FF] font-bold block mb-1">Recommended Rebuttal:</span>
                    {obj.rebuttal}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Follow-up */}
      {activeTab === 'followup' && (
        <div className="space-y-3.5">
          {followUps.map((seq, i) => (
            <div key={i} className="liquid-glass rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                    Day {seq.day}
                  </span>
                  <h4 className="text-xs font-bold text-white">{seq.title}</h4>
                </div>
                <button
                  onClick={() => copyToClipboard(seq.body, 100 + i)}
                  className="text-xs font-mono text-white/50 hover:text-white flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10"
                >
                  {copiedIndex === 100 + i ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#030614] border border-white/5 text-xs text-white/85 font-sans whitespace-pre-wrap leading-relaxed">
                {seq.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
