'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, AlertTriangle, ShieldCheck, Check, X, RefreshCw, Zap, TrendingUp, DollarSign, Users, ArrowUpRight, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function BrainDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchBrainData = async () => {
    try {
      const res = await fetch('/api/admin/brain/metrics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      toast.error('Failed to load Brain telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrainData();
  }, []);

  const handleDecision = async (decisionId: string, action: 'approved' | 'rejected') => {
    setResolvingId(decisionId);
    try {
      const res = await fetch('/api/admin/brain/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId, action }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success(`Decision marked as ${action.toUpperCase()}!`);
        fetchBrainData();
      } else {
        toast.error(resJson.error || 'Failed to update decision');
      }
    } catch {
      toast.error('Error contacting decision engine');
    } finally {
      setResolvingId(null);
    }
  };

  const metrics = data?.currentMetrics || {};
  const anomalies = data?.anomalies || [];
  const proposedDecisions = data?.proposedDecisions || [];
  const recentDecisions = data?.recentDecisions || [];

  const llmCost = metrics.estimatedLlmCostMonth || 0;
  const budgetCap = 200;
  const budgetPercent = Math.min(100, Math.round((llmCost / budgetCap) * 100));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>AI BRAIN // AUTONOMOUS PLATFORM ENGINE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white">
            Brain <span className="cyan-gold-gradient-text">Command Center</span>
          </h1>
          <p className="text-xs text-[#8892B0] font-mono mt-1">
            CONTINUOUS OBSERVABILITY, ANOMALY DETECTION & HITL GOVERNANCE
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => { setLoading(true); fetchBrainData(); }}
          className="border-white/10 text-xs font-mono text-[#8892B0] hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </Button>
      </motion.div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Active Operatives (7d)</span>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00F0FF]" /> {metrics.activeUsers7d ?? 0}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Total Registered: {metrics.totalUsers ?? 0}</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Estimated MRR</span>
          <div className="text-2xl font-bold text-green-400 mt-1 flex items-center gap-1 font-mono">
            <DollarSign className="w-5 h-5 text-green-400" /> ${(metrics.totalRevenueUsd ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Stripe Recurring Tiers</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Swarm Agent Success Rate</span>
          <div className="text-2xl font-bold text-[#00F0FF] mt-1 flex items-center gap-2 font-mono">
            <Bot className="w-5 h-5 text-[#00F0FF]" /> {metrics.agentSuccessRate ?? 100}%
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">{metrics.totalAgentRuns ?? 0} Total 30d Runs</span>
        </div>

        <div className="glass-card p-5">
          <div className="flex justify-between items-center">
            <span className="text-[#8892B0] text-[10px] uppercase font-mono block">LLM Monthly Cost</span>
            <span className={`text-[10px] font-mono font-bold ${budgetPercent > 80 ? 'text-red-400' : 'text-green-400'}`}>
              ${llmCost} / ${budgetCap}
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 mt-3">
            <div
              className={`h-full ${budgetPercent > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-[#00F0FF] to-[#FFD700]'}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-[#8892B0] font-mono block mt-2">Budget Cap Alert at $200.00</span>
        </div>
      </div>

      {/* Active Anomalies & Alerts */}
      <div className="mb-8">
        <h2 className="text-sm font-mono uppercase tracking-wider text-[#FFD700] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FFD700]" /> Active Anomaly Flags ({anomalies.length})
        </h2>

        {anomalies.length === 0 ? (
          <div className="glass-card p-6 text-center text-xs font-mono text-green-400 border border-green-500/20">
            <ShieldCheck className="w-6 h-6 text-green-400 mx-auto mb-2" />
            ALL SYSTEMS NOMINAL // ZERO HIGH-SEVERITY ANOMALIES DETECTED
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a: any) => (
              <div
                key={a.id}
                className={`glass-card p-5 border ${
                  a.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{a.title}</h4>
                    <p className="text-xs text-[#8892B0] mt-1 font-sans">{a.description}</p>
                    <div className="mt-2 text-xs font-mono text-[#00F0FF]">
                      Recommended: {a.recommendedAction}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human-In-The-Loop Pending Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pending Decisions */}
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-[#00F0FF] mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00F0FF]" /> Pending HITL Optimization Decisions
          </h2>

          <div className="space-y-4">
            {recentDecisions.filter((d: any) => d.outcome === 'pending').length === 0 ? (
              <div className="glass-card p-8 text-center text-xs font-mono text-[#8892B0]">
                NO PENDING PROPOSALS REQUIRING HUMAN CONFIRMATION
              </div>
            ) : (
              recentDecisions
                .filter((d: any) => d.outcome === 'pending')
                .map((dec: any) => (
                  <div key={dec.id} className="glass-card p-5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {dec.riskLevel} RISK // {dec.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-[#8892B0]">
                        {new Date(dec.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{dec.title}</h4>
                    <p className="text-xs text-[#8892B0] font-sans">{dec.description}</p>

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleDecision(dec.id, 'approved')}
                        disabled={resolvingId === dec.id}
                        className="bg-green-500 hover:bg-green-600 text-black font-bold text-xs h-8 px-4 flex-1"
                      >
                        {resolvingId === dec.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                        Approve & Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(dec.id, 'rejected')}
                        disabled={resolvingId === dec.id}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-4"
                      >
                        <X className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Audit Log of Historical Actions */}
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-white mb-3">
            Brain Decision Audit Trail
          </h2>

          <div className="glass-card divide-y divide-white/[0.04] max-h-[380px] overflow-y-auto">
            {recentDecisions.map((dec: any) => (
              <div key={dec.id} className="p-4 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">{dec.title}</span>
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded ${
                      dec.outcome === 'executed'
                        ? 'bg-green-500/20 text-green-400'
                        : dec.outcome === 'rejected'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {dec.outcome}
                  </span>
                </div>
                <p className="text-[11px] text-[#8892B0] font-sans">{dec.description}</p>
                <div className="text-[9px] text-[#8892B0] mt-1 flex justify-between">
                  <span>Actor: {dec.executedBy ?? 'System'}</span>
                  <span>{new Date(dec.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
