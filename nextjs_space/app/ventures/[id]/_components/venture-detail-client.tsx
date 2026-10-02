'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  DollarSign,
  TrendingUp,
  Brain,
  ShieldCheck,
  Users,
  Package,
  Layers,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialVenture: any;
  initialEconomics: any;
  ceoRecommendation: any;
}

const LIFECYCLE_STEPS = [
  'DISCOVERED',
  'RESEARCHING',
  'VALIDATING',
  'VALIDATED',
  'BUILDING',
  'READY_TO_SELL',
  'SELLING',
  'FIRST_REVENUE',
  'DELIVERING',
  'PROFITABLE',
  'SCALING',
];

export function VentureDetailClient({
  initialVenture,
  initialEconomics,
  ceoRecommendation: initialCeo,
}: Props) {
  const [venture, setVenture] = useState(initialVenture);
  const [economics, setEconomics] = useState(initialEconomics);
  const [ceo, setCeo] = useState(initialCeo);
  const [activeSection, setActiveSection] = useState<'overview' | 'offers' | 'crm' | 'fulfillment' | 'ledger' | 'memory'>('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Quick State Transition Handler
  const handleTransition = async (toState: string) => {
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/ventures/${venture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transition',
          toState,
          actor: 'USER_OPERATOR',
          reason: `Manual operator promotion to ${toState}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed transition');

      toast.success(`Venture promoted to ${toState}!`);
      setVenture({ ...venture, lifecycleState: toState });

      // Refresh economics & CEO brief
      const econRes = await fetch(`/api/ventures/${venture.id}/economics`);
      const econData = await econRes.json();
      if (econData.success) setEconomics(econData.economics);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsTransitioning(false);
    }
  };

  const currentIndex = LIFECYCLE_STEPS.indexOf(venture.lifecycleState);

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <a href="/ventures" className="text-white/40 hover:text-white text-xs font-mono">
              &larr; PORTFOLIO
            </a>
            <span className="text-white/20">/</span>
            <span className="text-xs font-mono text-cyan-400">{venture.industry}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-3">
            {venture.name}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              {venture.lifecycleState}
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-xl">{venture.problem}</p>
        </div>

        {/* Quick Transition Dropdown / Button */}
        <div className="flex items-center gap-2">
          {currentIndex < LIFECYCLE_STEPS.length - 1 && (
            <button
              onClick={() => handleTransition(LIFECYCLE_STEPS[currentIndex + 1])}
              disabled={isTransitioning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Advance to {LIFECYCLE_STEPS[currentIndex + 1]}
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Visual Stepper */}
      <div className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] overflow-x-auto">
        <span className="text-[10px] text-white/40 font-mono uppercase block mb-3">Venture Lifecycle Progression</span>
        <div className="flex items-center gap-2 min-w-[700px]">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/[0.04] text-white/30 border border-white/[0.08]'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] mt-1.5 font-mono text-center truncate max-w-[80px] ${
                  isCurrent ? 'text-cyan-400 font-bold' : isCompleted ? 'text-white/80' : 'text-white/30'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CEO Strategic Recommendation Card */}
      {ceo && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C122B] to-[#070A18] border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold text-white uppercase">CEO Recommendation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
                  ACTION: {ceo.recommendedAction}
                </span>
                <span className="text-[10px] text-white/40 font-mono">[{ceo.priority} PRIORITY]</span>
              </div>
              <p className="text-xs text-white/70">{ceo.rationale}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unit Economics Command Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08]">
          <span className="text-[10px] text-white/40 font-mono block">VERIFIED REVENUE</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            ${((economics?.verifiedRevenueCents || 0) / 100).toFixed(2)}
          </span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">STRIPE SETTLED</span>
        </div>

        <div className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08]">
          <span className="text-[10px] text-white/40 font-mono block">TOTAL COSTS</span>
          <span className="text-xl font-bold font-mono text-white/80">
            ${((economics?.totalCostCents || 0) / 100).toFixed(2)}
          </span>
          <span className="text-[9px] text-white/40 block mt-0.5">AI + INFRA + MKTG</span>
        </div>

        <div className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08]">
          <span className="text-[10px] text-white/40 font-mono block">NET PROFIT</span>
          <span className={`text-xl font-bold font-mono ${
            (economics?.netProfitCents || 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'
          }`}>
            ${((economics?.netProfitCents || 0) / 100).toFixed(2)}
          </span>
          <span className="text-[9px] text-cyan-400/80 block mt-0.5">GROSS MARGIN: {economics?.grossMarginPct || 0}%</span>
        </div>

        <div className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08]">
          <span className="text-[10px] text-white/40 font-mono block">CAC / LTV</span>
          <div className="text-lg font-bold font-mono text-white flex items-center gap-1">
            <span>${((economics?.cacCents || 0) / 100).toFixed(0)}</span>
            <span className="text-white/30">/</span>
            <span className="text-emerald-400">${((economics?.ltvCents || 0) / 100).toFixed(0)}</span>
          </div>
          <span className="text-[9px] text-white/40 block mt-0.5">PAYBACK ESTIMATED</span>
        </div>

        <div className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08]">
          <span className="text-[10px] text-white/40 font-mono block">AI COST / REVENUE</span>
          <span className={`text-xl font-bold font-mono ${
            (economics?.aiCostToRevenuePct || 0) > 40 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {economics?.aiCostToRevenuePct || 0}%
          </span>
          <span className="text-[9px] text-white/40 block mt-0.5">
            HEALTH: {economics?.unitEconomicsHealth || 'HEALTHY'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        {[
          { id: 'overview', label: 'Audit & Transitions', count: venture.transitions?.length },
          { id: 'offers', label: 'Offers & Pricing', count: venture.offers?.length },
          { id: 'crm', label: 'CRM & Pipeline', count: venture.leads?.length },
          { id: 'fulfillment', label: 'Fulfillment Orders', count: venture.fulfillmentOrders?.length },
          { id: 'ledger', label: 'Financial Truth Ledger', count: venture.financialRecords?.length },
          { id: 'memory', label: 'Venture Memory', count: venture.memories?.length },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
              activeSection === sec.id
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <span>{sec.label}</span>
            {sec.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-white/60">
                {sec.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Section 1: Overview & Transitions */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Transition Audit Log</h3>
          <div className="space-y-2">
            {(venture.transitions || []).map((tr: any) => (
              <div key={tr.id} className="p-3 rounded-xl bg-[#080B14] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-cyan-400">{tr.fromState} &rarr; {tr.toState}</span>
                  <p className="text-white/60 mt-0.5">{tr.reason}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 font-mono block">ACTOR: {tr.actor}</span>
                  <span className="text-[10px] text-white/30 font-mono">{new Date(tr.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Offers */}
      {activeSection === 'offers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Offers & Deliverables</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(venture.offers || []).map((off: any) => (
              <div key={off.id} className="p-4 rounded-xl bg-[#080B14] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{off.title}</h4>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    ${(off.priceCents / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/60">{off.description}</p>
                <div className="text-[10px] text-white/40 font-mono">
                  Interval: {off.billingInterval} &bull; Tier: {off.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: CRM */}
      {activeSection === 'crm' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Qualified Leads & Inquiries</h3>
          <div className="space-y-2">
            {(venture.leads || []).map((ld: any) => (
              <div key={ld.id} className="p-3 rounded-xl bg-[#080B14] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{ld.contactHandle}</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono">
                    STAGE: {ld.pipelineStage}
                  </span>
                  <p className="text-white/60 mt-1">{ld.qualificationNotes || 'No notes'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 font-bold block">Intent: {ld.intentScore}%</span>
                  <span className="text-[10px] text-white/40 font-mono">Via {ld.sourceChannel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Fulfillment */}
      {activeSection === 'fulfillment' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Delivery Orders & Quality Checks</h3>
          <div className="space-y-2">
            {(venture.fulfillmentOrders || []).map((ord: any) => (
              <div key={ord.id} className="p-3 rounded-xl bg-[#080B14] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-white font-bold">Order #{ord.id.slice(-6)}</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                    {ord.status}
                  </span>
                  <p className="text-white/60 mt-1">{ord.verificationNotes || 'Pending inspection'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-cyan-400 block">QA: {ord.qualityScore ?? 'N/A'}%</span>
                  <span className="text-[10px] text-white/40 font-mono">Agent: {ord.assignedAgentType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Financial Truth Ledger */}
      {activeSection === 'ledger' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Financial Records (Strict Provenance)</h3>
          <div className="space-y-2">
            {(venture.financialRecords || []).map((fin: any) => (
              <div key={fin.id} className="p-3 rounded-xl bg-[#080B14] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{fin.description}</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                    PROVENANCE: {fin.provenance}
                  </span>
                  <span className="ml-2 text-[10px] text-white/40 font-mono">{fin.type}</span>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-sm font-bold ${
                    fin.type === 'REVENUE' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {fin.type === 'REVENUE' ? '+' : '-'}${(fin.amountCents / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-white/30 block">{new Date(fin.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 6: Venture Memory */}
      {activeSection === 'memory' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Accumulated Learnings & Objections</h3>
          <div className="space-y-2">
            {(venture.memories || []).map((mem: any) => (
              <div key={mem.id} className="p-3 rounded-xl bg-[#080B14] border border-white/[0.06] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">[{mem.category}]</span>
                  <span className="text-[10px] text-white/40 font-mono">Confidence: {Math.round(mem.confidence * 100)}%</span>
                </div>
                <p className="text-white/80">{mem.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
