'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Terminal,
  Cpu,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Box,
  Code2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCode,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface VentureOption {
  id: string;
  name: string;
  slug: string;
  industry: string;
  lifecycleState: string;
}

interface StationJob {
  id: string;
  stationId: string;
  ventureId: string | null;
  status: string;
  jobPayload: any;
  resultArtifact: any;
  costCents: number | null;
  dispatchedAt: string;
  completedAt: string | null;
}

interface Props {
  initialIsAlive: boolean;
  initialStations: any[];
  initialJobs: StationJob[];
  ventures: VentureOption[];
  starnetUrl: string;
}

const STAGES = [
  { id: 'SPEC', label: '1. Spec & Research', color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  { id: 'SCAFFOLD', label: '2. Scaffold & Arch', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/40', text: 'text-purple-400' },
  { id: 'CODE', label: '3. Core Execution', color: 'from-indigo-500/20 to-indigo-500/5', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  { id: 'AUDIT', label: '4. QA & Verification', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { id: 'DEPLOY', label: '5. Ship & Monetize', color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/40', text: 'text-amber-400' },
];

export function StationClient({
  initialJobs,
  ventures,
}: Props) {
  const [jobs, setJobs] = useState<StationJob[]>(initialJobs);
  const [activeTab, setActiveTab] = useState<'floor' | 'console' | 'ledger'>('floor');

  // Dispatch parameters
  const [selectedVentureId, setSelectedVentureId] = useState(ventures[0]?.id || '');
  const [agentGoal, setAgentGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('nvidia/nemotron-3.5-lightning:free');
  const [isDispatching, setIsDispatching] = useState(false);

  // Live Stream Logs & State
  const [liveTokens, setLiveTokens] = useState<string>('');
  const [liveTools, setLiveTools] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTokens, liveTools]);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource('/api/station/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'token') {
          setLiveTokens((prev) => prev + (data.payload?.delta || ''));
        } else if (data.type === 'tool_call') {
          setLiveTools((prev) => [
            ...prev,
            { tool: data.payload?.tool, args: data.payload?.args, status: 'RUNNING', startedAt: Date.now() },
          ]);
        } else if (data.type === 'tool_result') {
          setLiveTools((prev) =>
            prev.map((t) =>
              t.tool === data.payload?.tool && t.status === 'RUNNING'
                ? { ...t, status: data.payload?.error ? 'FAILED' : 'SUCCESS', result: data.payload?.result, error: data.payload?.error, durationMs: data.payload?.durationMs }
                : t
            )
          );
        } else if (data.type === 'complete') {
          toast.success('Agent mission completed successfully!');
          refreshJobs();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const refreshJobs = async () => {
    try {
      const res = await fetch('/api/station/runs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentGoal.trim()) {
      toast.error('Please describe the mission directive.');
      return;
    }

    setIsDispatching(true);
    setLiveTokens('');
    setLiveTools([]);

    try {
      const res = await fetch('/api/station/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: selectedVentureId || undefined,
          goal: agentGoal.trim(),
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch error');

      setActiveRunId(data.runId);
      toast.success('Native agent mission dispatched on Trendly Engine!');
      setAgentGoal('');
      refreshJobs();
    } catch (err: any) {
      toast.error(err.message || 'Dispatch failed');
    } finally {
      setIsDispatching(false);
    }
  };

  const totalSpentCents = jobs.reduce((acc, j) => acc + (j.costCents || 0), 0);
  const completedCount = jobs.filter((j) => j.status === 'COMPLETE').length;
  const runningCount = jobs.filter((j) => j.status === 'RUNNING').length;

  return (
    <div className="space-y-8">
      {/* Top Cyber Command Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#080811] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <Cpu className="w-7 h-7 animate-pulse text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-orbitron">
                    TRENDLY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400">STATION</span>
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    CORE ACTIVE (IN-PROCESS)
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
                  Native autonomous agent station running inside Trendly. Full-turn tool dispatch, sandboxed shell execution, real-time filesystem ops, and automated financial settlement.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={refreshJobs}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Floor
            </button>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 font-mono text-xs text-purple-300">
              <span className="text-slate-500">ENGINE:</span> LOCAL-IN-PROCESS
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Missions</div>
            <div className="text-2xl font-black text-cyan-400 font-orbitron mt-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              {runningCount} ACTIVE
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completed Deliverables</div>
            <div className="text-2xl font-black text-purple-400 font-orbitron mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              {completedCount} RUNS
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Verified Token Spend</div>
            <div className="text-2xl font-black text-emerald-400 font-orbitron mt-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              ${(totalSpentCents / 100).toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Connected Ventures</div>
            <div className="text-2xl font-black text-amber-400 font-orbitron mt-1 flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-400" />
              {ventures.length} VENTURES
            </div>
          </div>
        </div>
      </div>

      {/* Floor Visual Assembly Line */}
      <div className="p-6 rounded-3xl bg-[#06060c] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-orbitron tracking-wide">
              VENTURE ASSEMBLY CONVEYOR
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">60 FPS REALTIME PIPELINE</span>
        </div>

        {/* 5-Stage Animated Assembly Track */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {STAGES.map((stage, idx) => (
            <div
              key={stage.id}
              className={`p-4 rounded-2xl bg-gradient-to-b ${stage.color} border ${stage.border} relative overflow-hidden flex flex-col justify-between h-32 group hover:scale-[1.02] transition`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${stage.text} font-mono uppercase tracking-wider`}>
                  {stage.label}
                </span>
                <span className="w-2 h-2 rounded-full bg-current opacity-70 animate-pulse" />
              </div>

              <div className="text-[11px] text-slate-300 font-medium">
                {idx === 0 && 'Problem & Market Viability Analysis'}
                {idx === 1 && 'Next.js & Supabase Stack Scaffold'}
                {idx === 2 && 'Shell Commands & Tool Execution'}
                {idx === 3 && 'Automated Lint & E2E Validation'}
                {idx === 4 && 'Stripe Checkout & Production Deploy'}
              </div>

              <div className="w-full bg-slate-950/60 h-1 rounded-full overflow-hidden">
                <div className={`h-full ${stage.text.replace('text-', 'bg-')} animate-pulse w-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Live Dispatch Console + Real-time Streaming Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Dispatch Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleDispatch}
            className="p-6 rounded-3xl bg-[#090914] border border-white/[0.08] space-y-5 shadow-xl"
          >
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-orbitron">
                <Flame className="w-5 h-5 text-amber-400" />
                Dispatch Agent Directive
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Assign a mission to the native station. The agent will autonomously read files, execute shell commands, build code, and record deliverables.
              </p>
            </div>

            {/* Target Venture */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-2 uppercase">
                Target Venture
              </label>
              <select
                value={selectedVentureId}
                onChange={(e) => setSelectedVentureId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
              >
                {ventures.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.industry} • {v.lifecycleState})
                  </option>
                ))}
                {ventures.length === 0 && (
                  <option value="">No ventures available. (Runs as Standalone Mission)</option>
                )}
              </select>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-2 uppercase">
                Execution Model (OpenRouter)
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition font-mono"
              >
                <option value="nvidia/nemotron-3.5-lightning:free">nvidia/nemotron-3.5-lightning:free (Unlimited Free Tier)</option>
                <option value="google/gemma-4-31b-it:free">google/gemma-4-31b-it:free (Free Tier)</option>
                <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet (High Reasoning - Paid)</option>
                <option value="openai/gpt-4o-mini">openai/gpt-4o-mini (Fast & Ultra-Cheap)</option>
              </select>
            </div>

            {/* Agent Directive */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 tracking-wider mb-2 uppercase">
                Mission Directive
              </label>
              <textarea
                rows={4}
                value={agentGoal}
                onChange={(e) => setAgentGoal(e.target.value)}
                placeholder="e.g. Inspect the workspace, run 'git status' via shell_exec, create an initial landing page wireframe in index.html with fs_write, and advance venture state."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition font-sans"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isDispatching}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 font-orbitron"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  DISPATCHING ON NATIVE CORE...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  DISPATCH TO STATION FLOOR
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Terminal & Tool Execution Drawer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-[#05050a] border border-white/[0.08] shadow-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Native Stream Terminal (SSE)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">TOOLS CALLED: {liveTools.length}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* Scrollable Live Console */}
            <div className="flex-1 overflow-y-auto font-mono text-xs p-4 space-y-3 selection:bg-cyan-500/30">
              {liveTokens === '' && liveTools.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2">
                  <Terminal className="w-10 h-10 opacity-30" />
                  <p>Station is idling. Dispatch a directive to watch the native agent think and execute tools live.</p>
                </div>
              )}

              {/* Streaming Tokens */}
              {liveTokens && (
                <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">AGENT STREAM:</div>
                  {liveTokens}
                </div>
              )}

              {/* Live Tool Call Cards */}
              {liveTools.map((t, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs ${
                    t.status === 'RUNNING'
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200 animate-pulse'
                      : t.status === 'SUCCESS'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      TOOL: {t.tool}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {t.status} {t.durationMs ? `(${t.durationMs}ms)` : ''}
                    </span>
                  </div>
                  <pre className="mt-1.5 p-2 rounded bg-black/40 text-[11px] overflow-x-auto text-slate-300">
                    {JSON.stringify(t.args, null, 2)}
                  </pre>
                  {t.result && (
                    <div className="mt-1.5 text-[11px] text-slate-300 truncate">
                      RESULT: {typeof t.result === 'string' ? t.result : JSON.stringify(t.result)}
                    </div>
                  )}
                </div>
              ))}

              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Missions History & Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white font-orbitron tracking-wide">
              DISPATCHED MISSION LEDGER ({jobs.length})
            </h3>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#070712] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040409] text-slate-400 border-b border-white/[0.08] uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mission ID</th>
                  <th className="py-3 px-4">Objective</th>
                  <th className="py-3 px-4">Verified Cost</th>
                  <th className="py-3 px-4">Dispatched</th>
                  <th className="py-3 px-4">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {jobs.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  const statusBadge =
                    job.status === 'COMPLETE'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : job.status === 'RUNNING'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 animate-pulse'
                      : job.status === 'FAILED'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                  return (
                    <React.Fragment key={job.id}>
                      <tr className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${statusBadge}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{job.id.slice(0, 8)}...</td>
                        <td className="py-3 px-4 font-sans text-slate-200 max-w-md truncate">
                          {job.jobPayload?.goal || job.jobPayload?.agentGoal || 'No goal specified'}
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">
                          {job.costCents ? `$${(job.costCents / 100).toFixed(3)}` : 'FREE'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(job.dispatchedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Inspect
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-black/40">
                          <td colSpan={6} className="p-4 border-t border-b border-white/[0.05]">
                            <div className="space-y-2 text-xs font-mono">
                              <div className="text-cyan-400 font-bold">DELIVERABLE ARTIFACT & TOOL TRACE:</div>
                              <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 overflow-x-auto text-slate-300 max-h-64">
                                {JSON.stringify(job.resultArtifact, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
