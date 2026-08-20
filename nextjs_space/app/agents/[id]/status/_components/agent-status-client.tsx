'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Download, ShieldCheck, DollarSign, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface AgentRunData {
  id: string;
  agentType: string;
  status: string;
  parameters: any;
  result: any;
  logs: string;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  costCents: number;
  durationMs: number | null;
  correlationId: string | null;
}

export function AgentStatusClient({ runId }: { runId: string }) {
  const [run, setRun] = useState<AgentRunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/agent/status/${runId}`);
      const data = await res.json();
      if (data.success && data.run) {
        setRun(data.run);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 2 seconds while running
    const interval = setInterval(() => {
      if (run?.status === 'running' || run?.status === 'queued' || !run) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, run?.status]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [run?.logs]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/agent/cancel/${runId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Agent execution cancelled.');
        fetchStatus();
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch {
      toast.error('Error cancelling agent');
    } finally {
      setCancelling(false);
    }
  };

  const isRunning = run?.status === 'running' || run?.status === 'queued';
  const isCompleted = run?.status === 'completed';
  const isFailed = run?.status === 'failed';
  const isCancelled = run?.status === 'cancelled';

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/agents" className="inline-flex items-center gap-2 text-xs font-mono text-[#8892B0] hover:text-[#00F0FF] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agent Swarm
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#8892B0]">ID: {runId}</span>
          {isRunning && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7 px-3"
            >
              {cancelling ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              Abort Run
            </Button>
          )}
        </div>
      </div>

      {/* Main Execution Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                {run?.agentType?.replace('_', ' ').toUpperCase() ?? 'SWARM AGENT'}
              </span>
              <span className="text-xs font-mono text-[#8892B0]">
                {run?.correlationId ?? 'CORE-THREAD'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              {run?.agentType === 'reddit_scraper' ? 'Reddit Problem Scraper' : 'Prediction Arbitrage Scanner'}
            </h1>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isRunning
                  ? 'bg-blue-500/10 text-[#00F0FF] border border-[#00F0FF]/30'
                  : isCompleted
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : isCancelled
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />}
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
              <span>{run?.status ?? 'LOADING'}</span>
            </div>
          </div>
        </div>

        {/* Execution telemetry line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#8892B0]">
          <div>
            <span className="text-[10px] uppercase block">Started</span>
            <span className="text-white">{run?.createdAt ? new Date(run.createdAt).toLocaleTimeString() : '...'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block">Runtime</span>
            <span className="text-white">{run?.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : isRunning ? 'In Progress...' : '0s'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block">Cost Cap</span>
            <span className="text-green-400 font-bold">${((run?.costCents || 15) / 100).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block">Circuit Health</span>
            <span className="text-[#00F0FF] font-bold">100% NOMINAL</span>
          </div>
        </div>
      </motion.div>

      {/* Structured Result Display (when completed) */}
      {isCompleted && run?.result && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 space-y-6">
          {/* Reddit Scraper Results */}
          {run.agentType === 'reddit_scraper' && (
            <div className="glass-card p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" /> Market Intelligence Report // r/{run.result.subreddit}
                </h3>
              </div>

              <p className="text-xs text-[#8892B0] mb-6 leading-relaxed bg-black/40 p-4 rounded-lg border border-white/5 font-sans">
                {run.result.summary}
              </p>

              {/* 3 Problems List */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#FFD700]">Recurring Community Pain Points & Monetization Solutions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {run.result.problemsList?.map((p: any, idx: number) => (
                    <div key={idx} className="bg-black/50 border border-white/[0.08] p-4 rounded-lg">
                      <span className="text-[9px] font-mono uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                        Problem #{idx + 1} // {p.frequency}
                      </span>
                      <h5 className="text-sm font-bold text-white mt-2 mb-2">{p.problem}</h5>
                      <div className="border-t border-white/5 pt-2 text-xs font-sans text-[#8892B0]">
                        <span className="text-[10px] font-mono text-[#00F0FF] block">PROPOSED SOLUTION:</span>
                        {p.suggestedProductOrService}
                      </div>
                      <div className="mt-2 text-xs font-mono text-green-400 font-bold">
                        Est. Yield: {p.estimatedMarketValue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Steps */}
              {run.result.actionableSteps && (
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] mb-3">Validation & Acquisition Roadmap:</h4>
                  <ul className="space-y-2 text-xs text-[#8892B0] font-sans">
                    {run.result.actionableSteps.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#00F0FF] font-mono font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Prediction Arbitrage Results */}
          {run.agentType === 'prediction_arbitrage' && (
            <div className="glass-card p-6 border border-[#00F0FF]/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00F0FF]" /> Prediction Market Arbitrage Execution
                </h3>
                <span className="text-xs font-mono text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded">
                  Trade ID: {run.result.tradeId}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Net Projected Spread</span>
                  <span className="text-2xl font-bold text-green-400">+{run.result.roiPercent}%</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Estimated Net Profit</span>
                  <span className="text-2xl font-bold text-[#FFD700]">+${run.result.estimatedProfit}</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Execution Mode</span>
                  <span className="text-xl font-bold text-white">{run.result.isSimulation ? 'Paper Simulation' : 'Live Order'}</span>
                </div>
              </div>

              {run.result.bestOpportunity && (
                <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase block mb-1">Target Market Pair:</span>
                  <h4 className="text-sm font-bold text-white mb-2">{run.result.bestOpportunity.marketTitle}</h4>
                  <div className="flex gap-4 font-mono text-[#8892B0] text-[11px] mb-3">
                    <span>YES: ${run.result.bestOpportunity.outcomeA.price}</span>
                    <span>NO: ${run.result.bestOpportunity.outcomeB.price}</span>
                    <span className="text-green-400">Combined Cost: ${run.result.bestOpportunity.sumPrice} (Redeem at $1.00)</span>
                  </div>
                  <a
                    href={run.result.bestOpportunity.marketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#00F0FF] hover:underline font-mono"
                  >
                    View on Polymarket Orderbook <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Terminal Live Logs */}
      <div className="glass-card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#8892B0] border-b border-white/[0.06] pb-3">
          <span className="flex items-center gap-2 text-white">
            <Terminal className="w-4 h-4 text-[#00F0FF]" /> Live Swarm Telemetry Stream
          </span>
          <span className="text-[10px]">AUTO-SCROLL ENABLED</span>
        </div>

        <div className="bg-[#05050A] rounded-lg p-4 font-mono text-xs text-[#00F0FF]/90 h-80 overflow-y-auto space-y-1.5 border border-white/[0.04] shadow-inner">
          {run?.logs ? (
            run.logs.split('\n').map((line, idx) => {
              if (!line.trim()) return null;
              const isError = line.includes('ERROR');
              const isSuccess = line.includes('SUCCESS') || line.includes('completed');
              return (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    isError ? 'text-red-400' : isSuccess ? 'text-green-400 font-bold' : 'text-[#8892B0]'
                  }`}
                >
                  {line}
                </div>
              );
            })
          ) : (
            <div className="text-[#8892B0] animate-pulse">Initializing execution socket...</div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
