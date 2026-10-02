'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  TrendingUp,
  ShieldAlert,
  Brain,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  Layers,
  Radio,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialVentures: any[];
  ceoBrief: any;
  graveyard: any[];
  signalClusters: any[];
  pendingApprovals: any[];
}

export function VenturesClient({
  initialVentures,
  ceoBrief,
  graveyard,
  signalClusters,
  pendingApprovals: initialApprovals,
}: Props) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'ceo' | 'signals' | 'approvals' | 'graveyard'>('portfolio');
  const [ventures, setVentures] = useState(initialVentures);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Venture Form State
  const [newVenture, setNewVenture] = useState({
    name: '',
    industry: 'B2B Software',
    businessModel: 'AI_SAAS',
    problem: '',
    targetCustomer: '',
    riskLevel: 'MEDIUM',
    autonomyLevel: 'LEVEL_3',
    capitalAllocatedCents: 5000,
  });

  const summary = ceoBrief?.portfolioSummary || {
    totalVentures: ventures.length,
    totalVerifiedRevenueCents: 0,
    totalNetProfitCents: 0,
    totalActiveCustomers: 0,
    pendingApprovalsCount: approvals.length,
  };

  const handleCreateVenture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVenture),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create venture');

      toast.success(`Venture "${data.venture.name}" created in DISCOVERED state!`);
      setVentures([data.venture, ...ventures]);
      setShowCreateModal(false);
      setNewVenture({
        name: '',
        industry: 'B2B Software',
        businessModel: 'AI_SAAS',
        problem: '',
        targetCustomer: '',
        riskLevel: 'MEDIUM',
        autonomyLevel: 'LEVEL_3',
        capitalAllocatedCents: 5000,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveApproval = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/ventures/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve approval');

      toast.success(`Action ${status.toLowerCase()} successfully`);
      setApprovals(approvals.filter((a) => a.id !== requestId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Portfolio KPI Command Strip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Rocket className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Trendly Venture OS
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  AUTONOMOUS_V1
                </span>
              </h1>
              <p className="text-xs text-white/50">
                Self-driving venture engine calibrated for verified economic outcomes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Launch Venture
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>Verified Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${((summary.totalVerifiedRevenueCents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">PROVENANCE: VERIFIED</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>Net Profit</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${((summary.totalNetProfitCents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">MARGIN OPTIMIZED</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>Active Customers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {summary.totalActiveCustomers || 0}
          </div>
          <span className="text-[10px] text-white/40 font-mono">STRIPE RECONCILED</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>Pending Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {approvals.length}
          </div>
          <span className="text-[10px] text-amber-400 font-mono">HUMAN GATED</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
        {[
          { id: 'portfolio', label: 'Active Portfolio', icon: Layers, count: ventures.length },
          { id: 'ceo', label: 'CEO Strategic Brief', icon: Brain },
          { id: 'signals', label: 'Opportunity Signals', icon: Radio, count: signalClusters.length },
          { id: 'approvals', label: 'Approval Center', icon: ShieldAlert, count: approvals.length, alert: approvals.length > 0 },
          { id: 'graveyard', label: 'Venture Graveyard', icon: Clock, count: graveyard.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-white/40'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tab.alert ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-white/10 text-white/60'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Active Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {ventures.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#080B14] border border-white/[0.08]">
              <Rocket className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No active ventures yet</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mt-1 mb-6">
                Start by launching a new venture hypothesis or promote an opportunity signal from the Market Radar.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 cursor-pointer"
              >
                Create First Venture
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ventures.map((v) => (
                <div
                  key={v.id}
                  className="p-5 rounded-2xl bg-[#080B14] border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {v.lifecycleState}
                      </span>
                      <span className="text-xs text-white/40 font-mono">{v.businessModel}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{v.name}</h3>
                    <p className="text-xs text-white/60 line-clamp-2 mb-4">{v.problem}</p>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4 text-center">
                      <div>
                        <span className="text-[10px] text-white/40 block">Target</span>
                        <span className="text-xs font-semibold text-white truncate block">{v.targetCustomer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Revenue</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">
                          ${((v.revenueCents || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Autonomy</span>
                        <span className="text-xs font-semibold text-cyan-400 font-mono">{v.autonomyLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-white/50">
                    <span>{v.offers?.length || 0} Offers &bull; {v.leads?.length || 0} Leads</span>
                    <a
                      href={`/ventures/${v.id}`}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      Manage Venture <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: CEO Strategic Brief */}
      {activeTab === 'ceo' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0B1024] to-[#060814] border border-cyan-500/20 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Brain className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">CEO Deliberation: What Should Happen Next?</h2>
                <p className="text-xs text-white/50">
                  Autonomous executive reasoning balancing capital efficiency, delivery bottlenecks, and unit economics.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(ceoBrief?.recommendations || []).map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{rec.ventureName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        rec.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        rec.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">[{rec.actor}]</span>
                    </div>
                    <p className="text-xs text-white/80">{rec.rationale}</p>
                    <span className="text-[10px] text-white/40 font-mono">SOURCE: {rec.dataProvenance}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-cyan-300">
                      ACTION: {rec.recommendedAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Opportunity Signals */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Clustered Market Problems (Real Signals)</h3>
            <span className="text-xs text-white/40 font-mono">{signalClusters.length} problem clusters detected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signalClusters.map((cluster, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400">{cluster.industry}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Urgency: {cluster.avgUrgency}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{cluster.topic}</h4>
                <p className="text-xs text-white/50">{cluster.signalCount} raw signals observed from Reddit & Hacker News.</p>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-white/40">Buyer Intent: {cluster.avgIntent}%</span>
                  <button
                    onClick={() => {
                      setNewVenture({
                        ...newVenture,
                        name: cluster.topic,
                        industry: cluster.industry,
                        problem: `Automate and solve ${cluster.topic} for commercial clients.`,
                      });
                      setShowCreateModal(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Convert to Venture &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Approval Center */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Human Approval Gatekeeper</h3>
              <p className="text-xs text-white/40">Consequential, financial, and irreversible actions requiring operator authorization.</p>
            </div>
            <span className="text-xs text-amber-400 font-mono">{approvals.length} pending review</span>
          </div>

          {approvals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#080B14] border border-white/[0.08] text-white/50 text-sm">
              All agent execution queues are clear. Zero pending approvals.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-[#080B14] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{req.venture?.name} &bull; {req.agentRole}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                      RISK: {req.riskLevel}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{req.proposedAction}</h4>
                  <p className="text-xs text-white/70">{req.rationale}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                    <span className="text-xs text-white/40 font-mono">
                      Est. Cost: ${((req.estimatedCostCents || 0) / 100).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveApproval(req.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleResolveApproval(req.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium border border-emerald-500/40 cursor-pointer"
                      >
                        Approve Action
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Venture Graveyard */}
      {activeTab === 'graveyard' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Venture Graveyard (Post-Mortem Intelligence)</h3>
            <p className="text-xs text-white/40">Failed and terminated ventures preserved as organizational learning assets.</p>
          </div>

          {graveyard.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#080B14] border border-white/[0.08] text-white/50 text-sm">
              No terminated ventures. Failures will automatically be archived here with retrospective learnings.
            </div>
          ) : (
            <div className="space-y-3">
              {graveyard.map((gv) => (
                <div key={gv.id} className="p-4 rounded-2xl bg-[#080B14] border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{gv.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {gv.lifecycleState}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{gv.problem}</p>
                  <div className="pt-2 border-t border-white/[0.06] text-xs text-white/40 font-mono">
                    Learnings recorded: {gv.memories?.length || 0} insights
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Venture Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-[#0B0F1C] border border-white/10 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-cyan-400" /> Launch New Venture
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVenture} className="space-y-4">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Venture Name</label>
                  <input
                    type="text"
                    required
                    value={newVenture.name}
                    onChange={(e) => setNewVenture({ ...newVenture, name: e.target.value })}
                    placeholder="e.g. LeadPulse AI"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 block mb-1">Industry</label>
                    <input
                      type="text"
                      required
                      value={newVenture.industry}
                      onChange={(e) => setNewVenture({ ...newVenture, industry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 block mb-1">Business Model</label>
                    <select
                      value={newVenture.businessModel}
                      onChange={(e) => setNewVenture({ ...newVenture, businessModel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#080B14] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="AI_SAAS">AI SaaS</option>
                      <option value="AI_SERVICE">AI Service</option>
                      <option value="AGENCY">Agency</option>
                      <option value="AUTOMATION_SERVICE">Automation Service</option>
                      <option value="LEAD_GEN">Lead Gen</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">Target Customer Segment</label>
                  <input
                    type="text"
                    required
                    value={newVenture.targetCustomer}
                    onChange={(e) => setNewVenture({ ...newVenture, targetCustomer: e.target.value })}
                    placeholder="e.g. B2B Sales Agencies with 5-20 reps"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60 block mb-1">Commercial Problem Statement</label>
                  <textarea
                    required
                    rows={3}
                    value={newVenture.problem}
                    onChange={(e) => setNewVenture({ ...newVenture, problem: e.target.value })}
                    placeholder="Describe customer pain, workflow friction, or budget wasted..."
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs text-white font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Initializing...' : 'Launch Venture'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
