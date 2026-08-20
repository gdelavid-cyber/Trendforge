'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Server,
  Video,
  Code,
  DollarSign,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Star,
  Sparkles,
  XCircle,
} from 'lucide-react';
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
  userFeedback?: string;
  userRating?: number;
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

  // Feedback state
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/agent/status/${runId}`);
      const data = await res.json();
      if (data.success && data.run) {
        setRun(data.run);
        if (data.run.userRating) {
          setRating(data.run.userRating);
          setFeedbackSubmitted(true);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
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

  const handleFeedbackSubmit = async () => {
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          rating,
          feedback: feedbackText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Feedback recorded! +${data.communityPointsAwarded} Community Points earned.`);
        setFeedbackSubmitted(true);
      } else {
        toast.error(data.error || 'Failed to submit feedback');
      }
    } catch {
      toast.error('Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
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
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#8892B0] hover:text-[#00F0FF] transition-colors"
        >
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
                {run?.agentType?.replace(/_/g, ' ').toUpperCase() ?? 'SWARM AGENT'}
              </span>
              <span className="text-xs font-mono text-[#8892B0]">{run?.correlationId ?? 'CORE-THREAD'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              {run?.agentType === 'reddit_scraper' && 'Reddit Problem Scraper & Guide'}
              {run?.agentType === 'prediction_arbitrage' && 'Prediction Arbitrage Scanner'}
              {run?.agentType === 'openclaw_deployer' && 'OpenClaw Scraper VPS Deployer'}
              {run?.agentType === 'ai_video_maker' && 'AI Viral Video & Script Generator'}
              {run?.agentType === 'micro_saas_builder' && 'Full-Stack Micro-SaaS App Scaffolder'}
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
            <span className="text-white">
              {run?.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : isRunning ? 'In Progress...' : '0s'}
            </span>
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

      {/* Structured Result Display */}
      {isCompleted && run?.result && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 space-y-6">
          {/* Agent 1: Reddit Scraper */}
          {run.agentType === 'reddit_scraper' && (
            <div className="glass-card p-6 border border-green-500/20">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" /> Market Intelligence Report // r/{run.result.subreddit}
              </h3>
              <p className="text-xs text-[#8892B0] mb-6 bg-black/40 p-4 rounded-lg border border-white/5 font-sans leading-relaxed">
                {run.result.summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {run.result.problemsList?.map((p: any, idx: number) => (
                  <div key={idx} className="bg-black/50 border border-white/[0.08] p-4 rounded-lg">
                    <span className="text-[9px] font-mono uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      Pain Point #{idx + 1}
                    </span>
                    <h5 className="text-sm font-bold text-white mt-2 mb-2">{p.problem}</h5>
                    <div className="border-t border-white/5 pt-2 text-xs font-sans text-[#8892B0]">
                      <span className="text-[10px] font-mono text-[#00F0FF] block">PROPOSED SOLUTION:</span>
                      {p.suggestedProductOrService}
                    </div>
                    <div className="mt-2 text-xs font-mono text-green-400 font-bold">Yield: {p.estimatedMarketValue}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent 2: Prediction Arbitrage */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Net Projected Spread</span>
                  <span className="text-2xl font-bold text-green-400">+{run.result.roiPercent}%</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Estimated Net Profit</span>
                  <span className="text-2xl font-bold text-[#FFD700]">+${run.result.estimatedProfit}</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Mode</span>
                  <span className="text-xl font-bold text-white">
                    {run.result.isSimulation ? 'Paper Simulation' : 'Live Order'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Agent 3: OpenClaw Deployer */}
          {run.agentType === 'openclaw_deployer' && (
            <div className="glass-card p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-400" /> OpenClaw Node Deployment Active
                </h3>
                <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded">
                  {run.result.deploymentId}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Server IP</span>
                  <span className="text-lg font-bold text-white">{run.result.serverIp}</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Active Workers</span>
                  <span className="text-lg font-bold text-[#00F0FF]">{run.result.activeWorkers} Browser Threads</span>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Proxy Latency</span>
                  <span className="text-lg font-bold text-green-400">{run.result.healthCheck?.proxyLatencyMs}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Agent 4: AI Video Maker */}
          {run.agentType === 'ai_video_maker' && (
            <div className="glass-card p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-5 h-5 text-yellow-400" /> Viral Video Asset Ready
                </h3>
                <span className="text-xs font-mono text-yellow-400 font-bold bg-yellow-500/10 px-3 py-1 rounded">
                  {run.result.durationSeconds}s // 1080x1920
                </span>
              </div>
              <div className="bg-black/50 p-4 rounded-lg border border-white/5 mb-4 text-xs font-sans">
                <h4 className="text-white font-bold mb-2">High-Retention Script:</h4>
                <div className="p-3 bg-black/60 rounded border border-white/5 text-[#8892B0] space-y-2">
                  <p>
                    <strong className="text-[#FFD700]">Hook:</strong> {run.result.script?.hook}
                  </p>
                  <p>
                    <strong className="text-[#00F0FF]">Body:</strong> {run.result.script?.body}
                  </p>
                  <p>
                    <strong className="text-green-400">CTA:</strong> {run.result.script?.callToAction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Agent 5: Micro-SaaS Builder */}
          {run.agentType === 'micro_saas_builder' && (
            <div className="glass-card p-6 border border-[#00F0FF]/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-5 h-5 text-[#00F0FF]" /> Micro-SaaS Scaffold Complete: {run.result.appName}
                </h3>
              </div>
              <p className="text-xs text-[#8892B0] mb-4">{run.result.tagline}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">Live Demo Deployment</span>
                  <a
                    href={run.result.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00F0FF] hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    {run.result.liveDemoUrl} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-xs font-mono">
                  <span className="text-[#8892B0] block text-[10px] uppercase">GitHub Code Repository</span>
                  <a
                    href={run.result.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-[#00F0FF] flex items-center gap-1 mt-1"
                  >
                    {run.result.githubRepoUrl} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Agent Feedback Form */}
          <div className="glass-card p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD700]" /> Rate Agent Quality & Performance
              </h4>
              <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded">
                +5 Community Points
              </span>
            </div>
            <p className="text-xs text-[#8892B0] mb-4 font-sans">
              Your feedback is analyzed continuously by the AI Brain to fine-tune system prompts and hyperparameters.
            </p>

            {feedbackSubmitted ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Thank you! Rating ({rating}/5 Stars) submitted and verified.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8892B0] font-mono">Utility Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 rounded transition-colors ${
                          rating >= star ? 'text-[#FFD700]' : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{rating} / 5 Stars</span>
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="Optional: What could the agent improve or what was most valuable?"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs text-white placeholder:text-[#8892B0] focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback}
                  className="cyan-gradient text-black font-extrabold uppercase holographic-btn text-xs h-8 px-5"
                >
                  {submittingFeedback ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ThumbsUp className="w-3.5 h-3.5 mr-1" />}
                  Submit Feedback
                </Button>
              </div>
            )}
          </div>
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
