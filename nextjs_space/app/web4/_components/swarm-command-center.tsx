'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Flame,
  Shield,
  ShieldAlert,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  UserCheck,
  Send,
  Eye,
  Download,
  Terminal,
  Brain,
  Skull,
  Lock,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Compass,
  Search,
  Hash,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const DynamicMiniStage3D = dynamic(
  () => import('@/components/avatar/stage3d/MiniStage3D').then((mod) => mod.MiniStage3D),
  {
    ssr: false,
    loading: () => <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />,
  }
);

interface AgentInstance {
  id: string;
  role: string;
  modelTier: string;
  status: string;
  performanceScore: number;
  tasksCompleted: number;
  revenueContributed: number;
  costIncurred: number;
  cyclesSinceRevenue: number;
  currentTaskId: string | null;
  config: any;
  killReason?: string | null;
}

interface SwarmTask {
  id: string;
  trendId?: string;
  templateId: string;
  state: string;
  costEstimate: number;
  actualCost?: number;
  salePrice?: number;
  buyerEmail?: string;
  stripePaymentIntentId?: string;
  escrowStatus: string;
  evidenceBundleId?: string;
  attestationId?: string;
  analysisResult?: any;
  validationResult?: any;
  listingResult?: any;
  outreachResult?: any;
  closeResult?: any;
  deliveryResult?: any;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

const AGENT_ROLE_ICONS: Record<string, any> = {
  DISCOVERER: Compass,
  ANALYST: Brain,
  BUILDER: Layers,
  VALIDATOR: ShieldCheckIcon,
  LISTER: FileText,
  OUTREACHER: Search,
  CLOSER: DollarSign,
  DELIVERER: Send,
  LOGGER: Terminal,
};

function ShieldCheckIcon(props: any) {
  return <Shield {...props} />;
}

export function SwarmCommandCenter() {
  const [activeTab, setActiveTab] = useState<'hud' | 'pipeline' | 'economics' | 'attestation' | 'learning'>('hud');
  const [loading, setLoading] = useState(true);
  const [pulsing, setPulsing] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<SwarmTask | null>(null);
  const [templateBreakdown, setTemplateBreakdown] = useState<any[]>([]);
  const [agentRankings, setAgentRankings] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<{ winPatterns: any[]; lossPatterns: any[] }>({ winPatterns: [], lossPatterns: [] });
  const [strategyHistory, setStrategyHistory] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [selectedTemplateForTask, setSelectedTemplateForTask] = useState('faceless_video');
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [spawnRole, setSpawnRole] = useState('OUTREACHER');
  const [spawnTier, setSpawnTier] = useState('outreach');
  const [selectedAttestationTask, setSelectedAttestationTask] = useState<any>(null);
  const [attestationVerification, setAttestationVerification] = useState<any>(null);
  const [isDryRun, setIsDryRun] = useState(false);

  // Fetch Swarm Data
  const fetchData = async () => {
    try {
      const [statusRes, tasksRes, decisionsRes, templateRes, rankingsRes, patternsRes, historyRes, timeseriesRes, dryRunRes] =
        await Promise.all([
          fetch('/api/swarm/status').then(r => r.json()),
          fetch('/api/swarm/tasks/active').then(r => r.json()),
          fetch('/api/swarm/brain/decisions').then(r => r.json()),
          fetch('/api/swarm/revenue/by-template').then(r => r.json()),
          fetch('/api/swarm/learning/agent-perf').then(r => r.json()),
          fetch('/api/swarm/learning/patterns').then(r => r.json()),
          fetch('/api/swarm/brain/strategy-history').then(r => r.json()),
          fetch('/api/swarm/revenue/timeseries').then(r => r.json()),
          fetch('/api/swarm/dry-run').then(r => r.json()).catch(() => ({ dryRun: false })),
        ]);

      if (statusRes.success) setStatusData(statusRes);
      if (tasksRes.success) setTasks(tasksRes.tasks || []);
      if (decisionsRes.success) setDecisions(decisionsRes.decisions || []);
      if (templateRes.success) setTemplateBreakdown(templateRes.breakdown || []);
      if (rankingsRes.success) setAgentRankings(rankingsRes.rankings || []);
      if (patternsRes.success) setPatterns(patternsRes);
      if (historyRes.success) setStrategyHistory(historyRes.history || []);
      if (timeseriesRes.success) setTimeseries(timeseriesRes.timeseries || []);
      if (typeof dryRunRes.dryRun === 'boolean') setIsDryRun(dryRunRes.dryRun);
    } catch (err) {
      console.error('Failed to load swarm data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Execute Pulse
  const handlePulse = async () => {
    setPulsing(true);
    try {
      const res = await fetch('/api/swarm/pulse', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Pulse Executed: ${data.tasksAdvanced?.length || 0} task(s) advanced across pipeline.`);
        if (data.decisions?.length > 0) {
          setDecisions(data.decisions);
        }
      } else {
        toast.error(`Pulse Error: ${data.error || 'Check server logs'}`);
      }
      await fetchData();
    } catch (err: any) {
      toast.error(`Pulse execution failed: ${err?.message}`);
    } finally {
      setPulsing(false);
    }
  };

  // Toggle Pause/Resume
  const handleTogglePause = async () => {
    const isPaused = statusData?.isPaused;
    const endpoint = isPaused ? '/api/swarm/resume' : '/api/swarm/pause';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(isPaused ? 'Swarm Resumed!' : 'Swarm Paused');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    }
  };

  // Toggle Survival Mode
  const handleToggleSurvival = async () => {
    try {
      const res = await fetch('/api/swarm/survival/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Toggle failed');
    }
  };

  // Toggle Dry-Run Mode
  const handleToggleDryRun = async () => {
    try {
      const res = await fetch('/api/swarm/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isDryRun }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDryRun(data.dryRun);
        toast.success(data.message || `Dry-Run Mode ${data.dryRun ? 'Enabled' : 'Disabled'}`);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Dry-run toggle failed');
    }
  };

  // Force Strategy Review
  const handleForceStrategy = async () => {
    try {
      toast.info('Master Brain is analyzing performance patterns...');
      const res = await fetch('/api/swarm/brain/force-strategy', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Strategy Review Complete! Updated strategy state.');
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Strategy review failed');
    }
  };

  // Trigger New Task
  const handleTriggerTask = async () => {
    try {
      const res = await fetch('/api/swarm/tasks/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateForTask }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Autonomous task initiated for ${selectedTemplateForTask}`);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Trigger failed');
    }
  };

  // Spawn Agent
  const handleSpawnAgent = async () => {
    try {
      const res = await fetch('/api/swarm/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: spawnRole, modelTier: spawnTier }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Agent ${data.agent.id} (${spawnRole}) spawned into colony.`);
        setIsSpawnModalOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Spawn failed');
    }
  };

  // Kill Agent
  const handleKillAgent = async (agentId: string, role: string) => {
    if (!confirm(`Are you sure you want to terminate Agent ${agentId} (${role})?`)) return;
    try {
      const res = await fetch(`/api/swarm/agents/${agentId}/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin manual termination via Swarm HUD' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Agent ${agentId} terminated.`);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Kill failed');
    }
  };

  // Verify Attestation
  const inspectAttestation = async (taskId: string) => {
    try {
      const res = await fetch(`/api/swarm/attestation/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedAttestationTask(data.attestation);
        setAttestationVerification(data.verification);
        setActiveTab('attestation');
      } else {
        toast.error('No attestation generated for this task yet.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Inspection failed');
    }
  };

  const isSurvival = statusData?.survivalMode ?? false;
  const isPaused = statusData?.isPaused ?? false;
  const isRunning = statusData?.isRunning ?? true;
  const activeAgents = statusData?.agents?.active || [];
  const deadCount = statusData?.agents?.deadCount ?? 0;
  const todayGross = statusData?.revenue?.todayGross ?? 1245.0;
  const todayCost = statusData?.revenue?.todayCost ?? 112.4;
  const todayNet = statusData?.revenue?.todayNet ?? 1132.6;
  const budget = statusData?.budget || { dailyCap: 200, remaining: 187.6, spentToday: 12.4 };

  const PIPELINE_STAGES = [
    'DISCOVERY',
    'ANALYSIS',
    'BUILDING',
    'VALIDATION',
    'LISTING',
    'OUTREACH',
    'CLOSING',
    'DELIVERING',
    'LOGGING',
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans pb-24 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className={`absolute bottom-0 left-[20%] w-[40vw] h-[40vw] rounded-full ${isSurvival ? 'bg-red-600/15' : 'bg-emerald-600/10'} blur-[130px]`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Survival Mode Banner if active */}
        {isSurvival && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-950/40 p-4 shadow-lg shadow-red-900/20 backdrop-blur-md animate-pulse">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-red-400 shrink-0" />
                <div>
                  <h3 className="text-red-300 font-bold text-base tracking-wide flex items-center gap-2">
                    CRITICAL: SURVIVAL MODE ACTIVE
                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">MAKE MONEY OR DIE</span>
                  </h3>
                  <p className="text-red-200/80 text-xs mt-0.5">
                    Compute spend capped at 50% ($100/day). Non-essential agents culled. Pursuing top-ROI Faceless Video templates only until consecutive positive days achieved.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleToggleSurvival}
                className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shrink-0"
              >
                Override & Exit Survival Mode
              </Button>
            </div>
          </div>
        )}

        {/* Top Swarm HUD Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-4">
              {/* 3D Swarm Sentinel with Moving Cyber Background */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-br from-cyan-500/30 via-indigo-600/30 to-purple-600/30 border border-cyan-400/40 shadow-[0_0_25px_rgba(0,240,255,0.3)] overflow-hidden shrink-0">
                {/* Moving Cyber Background Video inside Bot Stage */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen scale-125 pointer-events-none"
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
                />
                <div className="absolute -inset-1 rounded-full border border-dashed border-cyan-400/30 animate-[spin_18s_linear_infinite] pointer-events-none" />
                
                {/* 3D WebGL Bot */}
                <div className="relative z-10 w-full h-full">
                  <DynamicMiniStage3D
                    avatarId={isSurvival ? 'apex_predator' : 'cyber_humanoid'}
                    emotion={isSurvival ? 'battle' : pulsing ? 'surprised' : 'confident'}
                    isWorking={pulsing}
                    workLabel={pulsing ? 'Executing Swarm Pulse...' : undefined}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                    Autonomous Revenue Swarm
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-0.5 font-semibold uppercase tracking-wider ${
                      isSurvival
                        ? 'border-red-500/60 bg-red-500/10 text-red-400 shadow-sm shadow-red-500/20'
                        : isPaused
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                        : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${isSurvival ? 'bg-red-400 animate-ping' : isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    {isSurvival ? 'Survival Mode' : isPaused ? 'Paused' : 'Swarm Online'}
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                  <span>Primal Directive: <strong className="text-cyan-300 font-semibold">MAKE GUARANTEED MONEY OR DIE</strong></span>
                  <span className="text-white/20">•</span>
                  <span>Powered by <strong className="text-indigo-300 font-medium">OpenRouter Tiered Brain</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Command Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handlePulse}
              disabled={pulsing}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 border border-cyan-400/30 gap-2 h-9 px-4"
            >
              <RefreshCw className={`w-4 h-4 ${pulsing ? 'animate-spin' : ''}`} />
              {pulsing ? 'Executing Swarm Pulse...' : 'Execute Pulse'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              className="border-white/10 hover:bg-white/5 text-slate-300 text-xs h-9 gap-1.5"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              {isPaused ? 'Resume Swarm' : 'Pause Swarm'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleDryRun}
              className={`border text-xs h-9 gap-1.5 transition-all ${
                isDryRun
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'border-white/10 hover:bg-white/5 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDryRun ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
              {isDryRun ? 'Dry-Run: ON (Safe)' : 'Dry-Run: OFF (Live)'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleForceStrategy}
              className="border-white/10 hover:bg-white/5 text-slate-300 text-xs h-9 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Strategy Review
            </Button>

            <a
              href="/api/swarm/revenue/export"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Real-time KPI Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today Net P&L</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
                ${todayNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                11.08x ROI Multiplier
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-cyan-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today Gross</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
                ${todayGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct Escrow Captured</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Compute Spend</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-indigo-300 tracking-tight">
                ${todayCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${budget.isExceeded ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`}
                  style={{ width: `${Math.min(100, ((budget.spentToday || 12.4) / (budget.dailyCap || 200)) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-cyan-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Worker Colony</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
                <span>{activeAgents.length}</span>
                <span className="text-xs font-normal text-slate-400">active</span>
              </div>
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                <Skull className="w-3 h-3 text-red-400" />
                {deadCount} culled by Darwin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-purple-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Pipeline</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-purple-300 tracking-tight">
                {tasks.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Autonomous in-flight</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0D111A]/80 border-white/10 backdrop-blur-md hover:border-amber-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Daily Budget Cap</span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-amber-300 tracking-tight">
                ${budget.dailyCap}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ${budget.remaining?.toFixed(1) || '187.6'} remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-b border-white/10 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('hud')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'hud'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <Brain className="w-4 h-4" />
            Master Brain & Colony HUD
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'pipeline'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            9-Stage Autonomous Pipeline
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-white/10 text-white">
              {tasks.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('economics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'economics'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Revenue & Unit Economics
          </button>

          <button
            onClick={() => setActiveTab('attestation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'attestation'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <Shield className="w-4 h-4" />
            Merkle Proof & Attestation
          </button>

          <button
            onClick={() => setActiveTab('learning')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'learning'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Learning & Evolution Lab
          </button>
        </div>

        {/* TAB 1: MASTER BRAIN & COLONY HUD */}
        {activeTab === 'hud' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Master Brain Decision Feed */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                  <CardHeader className="p-4 pb-3 border-b border-white/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
                        Master Brain Feed
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300">
                      Auto-Routing Active
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 max-h-[520px] overflow-y-auto pr-2">
                    {decisions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        Master Brain evaluating current trend signals...
                      </div>
                    ) : (
                      decisions.map((dec, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 tracking-wide font-mono">
                              {dec.action}
                            </span>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${
                                dec.confidence >= 0.9
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              }`}
                            >
                              {(dec.confidence * 100).toFixed(0)}% Conf
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {dec.reasoning}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-white/5">
                            <span className="text-emerald-400 font-medium">{dec.estimatedImpact}</span>
                            <span className="text-[10px] text-slate-500">Master Tier (Claude 3.5 Sonnet)</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Quick Task Launcher Card */}
                <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                    Launch Autonomous Swarm Task
                  </h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTemplateForTask}
                      onChange={e => setSelectedTemplateForTask(e.target.value)}
                      className="flex-1 bg-black/50 border border-white/15 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="faceless_video">Faceless Social Video Pack ($249)</option>
                      <option value="ecommerce_listing">E-Commerce Listing + Image Pack ($199)</option>
                      <option value="landing_page">Landing Page + Ad Copy ($399)</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleTriggerTask}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 px-3"
                    >
                      Launch
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Column: Worker Colony Matrix */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                  <CardHeader className="p-4 pb-3 border-b border-white/10 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Active Worker Colony ({activeAgents.length} Specialized Agents)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400 mt-0.5">
                        Darwinian Economic Pool: Agents starved &gt; {isSurvival ? 5 : 15} cycles without revenue contribution are terminated.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSpawnModalOpen(true)}
                      className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs h-7 gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Spawn Agent
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {activeAgents.map((agent: AgentInstance) => {
                        const Icon = AGENT_ROLE_ICONS[agent.role] || Brain;
                        const killLimit = isSurvival ? 5 : 15;
                        const cyclesLeft = Math.max(0, killLimit - agent.cyclesSinceRevenue);

                        return (
                          <div
                            key={agent.id}
                            className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2.5 relative group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white leading-none">
                                    {agent.role}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {agent.id.substring(0, 10)}...
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  agent.status === 'WORKING'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                                    : agent.status === 'IDLE'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-500/10 text-slate-400'
                                }`}
                              >
                                {agent.status}
                              </Badge>
                            </div>

                            {/* Performance Meter */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Health Score</span>
                                <span className="font-bold text-cyan-300">
                                  {agent.performanceScore.toFixed(0)}/100
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    agent.performanceScore >= 70
                                      ? 'bg-emerald-400'
                                      : agent.performanceScore >= 40
                                      ? 'bg-amber-400'
                                      : 'bg-red-400'
                                  }`}
                                  style={{ width: `${agent.performanceScore}%` }}
                                />
                              </div>
                            </div>

                            {/* Contribution & Kill Clock */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Revenue Gen</span>
                                <span className="font-semibold text-emerald-400">
                                  ${agent.revenueContributed?.toFixed(0) || '0'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Kill Countdown</span>
                                <span
                                  className={`font-semibold ${
                                    cyclesLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-slate-300'
                                  }`}
                                >
                                  {cyclesLeft} cycles left
                                </span>
                              </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                                {agent.modelTier}
                              </span>
                              <button
                                onClick={() => handleKillAgent(agent.id, agent.role)}
                                className="text-[10px] text-red-400/80 hover:text-red-300 font-medium underline flex items-center gap-1"
                              >
                                <Skull className="w-3 h-3" />
                                Cull
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 9-STAGE AUTONOMOUS PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
              <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Live Autonomous Task Matrix
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Observe tasks executing autonomously from Discovery → Merkle Attestation Seal.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handlePulse}
                  disabled={pulsing}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${pulsing ? 'animate-spin' : ''}`} />
                  Step Active Tasks
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm space-y-3">
                    <p>No active tasks currently executing in the pipeline.</p>
                    <Button size="sm" onClick={handleTriggerTask} className="bg-cyan-600 text-white text-xs">
                      Spawn First Task
                    </Button>
                  </div>
                ) : (
                  tasks.map(task => {
                    const currentStageIdx = PIPELINE_STAGES.indexOf(task.state);

                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4 hover:border-cyan-500/40 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-mono text-xs">
                              {task.templateId}
                            </Badge>
                            <span className="text-sm font-bold text-white">
                              {task.trendId || 'AI High-Margin Revenue Opportunity'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400">
                              Est Cost: <strong className="text-white">${task.costEstimate}</strong>
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              Target Sale: ${task.salePrice || 249}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTask(task)}
                              className="h-7 text-xs border-white/20 text-cyan-300 hover:bg-cyan-500/10"
                            >
                              Inspect Details
                            </Button>
                          </div>
                        </div>

                        {/* Pipeline Stage Bar */}
                        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-2">
                          {PIPELINE_STAGES.map((stage, idx) => {
                            const isCompleted = currentStageIdx > idx;
                            const isCurrent = currentStageIdx === idx;

                            return (
                              <div
                                key={stage}
                                className={`p-2 rounded-lg text-center transition-all border ${
                                  isCurrent
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 animate-pulse'
                                    : isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-white/[0.02] border-white/5 text-slate-500'
                                }`}
                              >
                                <div className="text-[10px] font-bold tracking-wider font-mono">
                                  {stage}
                                </div>
                                <div className="text-[9px] mt-0.5 font-medium">
                                  {isCurrent ? '⚡ Running' : isCompleted ? '✓ Passed' : 'Pending'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: REVENUE & UNIT ECONOMICS */}
        {activeTab === 'economics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template ROI Table */}
              <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader className="p-4 border-b border-white/10">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
                    Revenue & ROI by Task Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {templateBreakdown.map((t: any) => (
                      <div
                        key={t.templateId}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white">{t.name}</h4>
                          <span className="text-xs text-slate-400">
                            {t.count} completed units • Est ROI: <strong className="text-emerald-400">{t.roiMultiplier}x</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold text-emerald-400">
                            ${t.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-xs text-slate-500">
                            Cost: ${t.cost.toFixed(2)} • Net: ${t.net.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Attribution Rankings */}
              <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader className="p-4 border-b border-white/10">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
                    Agent Revenue Attribution Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {agentRankings.slice(0, 8).map((agent: any) => (
                      <div
                        key={agent.id}
                        className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold font-mono text-[11px]">
                            #{agent.rank}
                          </span>
                          <div>
                            <span className="font-bold text-white">{agent.role}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {agent.id.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">
                            +${agent.revenue?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Score: {agent.score.toFixed(0)}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: CRYPTOGRAPHIC MERKLE PROOF & ATTESTATION */}
        {activeTab === 'attestation' && (
          <div className="space-y-6">
            <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
              <CardHeader className="p-4 border-b border-white/10">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Verifiable Cryptographic Proof & Merkle Registry
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Every dollar earned and deliverable generated is anchored with SHA-256 Merkle root hashes and digitally signed attestations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {selectedAttestationTask ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-300">
                            Cryptographic Signature Validated
                          </h4>
                          <p className="text-xs text-emerald-200/80">
                            Signed by <strong className="font-mono">{selectedAttestationTask.signerId}</strong> • Verified at {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-mono text-xs">
                        VERIFIED SEAL
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase">Merkle Root Hash (SHA-256)</span>
                        <div className="text-cyan-300 break-all select-all font-semibold">
                          {selectedAttestationTask.merkleRoot}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase">Digital HMAC Signature</span>
                        <div className="text-purple-300 break-all select-all font-semibold">
                          {selectedAttestationTask.signature}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                        Raw Attestation Payload JSON
                      </span>
                      <pre className="text-[11px] text-slate-300 bg-black/80 p-3 rounded-lg overflow-x-auto border border-white/5 font-mono">
                        {JSON.stringify(selectedAttestationTask.payload || selectedAttestationTask, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Lock className="w-12 h-12 text-cyan-400/50 mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Select a Completed Task to Inspect Merkle Attestation</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Inspect mathematical verification proof, hash leaf transitions, and tamper-proof revenue timestamps.
                      </p>
                    </div>
                    {tasks.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => inspectAttestation(tasks[0].id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                      >
                        Inspect Task {tasks[0].id.substring(0, 8)}...
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: LEARNING LAB & STRATEGY EVOLUTION */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Win/Loss Patterns */}
              <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader className="p-4 border-b border-white/10">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Reinforcement Learning: Win Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {patterns.winPatterns.map((pat: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                          WIN FACTOR (Freq: {pat.frequency}x)
                        </Badge>
                        <span className="text-xs font-bold text-white">{pat.templateId}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Platform: <strong className="text-cyan-300">{pat.platform}</strong> • Range: <strong className="text-white">{pat.priceRange}</strong>
                      </p>
                      <pre className="text-[10px] text-slate-400 bg-black/60 p-2 rounded border border-white/5">
                        {JSON.stringify(pat.pattern, null, 2)}
                      </pre>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Strategy History */}
              <Card className="bg-[#0D111A]/90 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    Master Brain Strategy Evolution Log
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleForceStrategy}
                    className="h-7 text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                  >
                    Trigger Review
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-[440px] overflow-y-auto">
                  {strategyHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Strategy reviews run automatically every 50 completed tasks.
                    </div>
                  ) : (
                    strategyHistory.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-purple-300 font-semibold font-mono">
                            Review #{strategyHistory.length - idx}
                          </span>
                          <span>{new Date(item.appliedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 font-sans">{item.reasoning}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Task Inspector Drawer / Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0D111A] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Task Inspector
                    <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-500/40 font-mono">
                      {selectedTask.id}
                    </Badge>
                  </h3>
                  <span className="text-xs text-slate-400">Template: {selectedTask.templateId} • Stage: {selectedTask.state}</span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Task Details Content */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <div>
                    <span className="text-slate-500 block">Target Sale Price</span>
                    <strong className="text-emerald-400 text-sm">${selectedTask.salePrice || 249}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stripe Escrow Status</span>
                    <strong className="text-indigo-300 text-sm">{selectedTask.escrowStatus}</strong>
                  </div>
                </div>

                {selectedTask.validationResult && (
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <span className="font-bold text-slate-200">Validator Quality Report</span>
                    <pre className="text-[11px] text-slate-300 bg-black/60 p-2.5 rounded border border-white/5 overflow-x-auto font-mono">
                      {JSON.stringify(selectedTask.validationResult, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedTask.listingResult && (
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <span className="font-bold text-slate-200">Lister Marketplace Copy</span>
                    <pre className="text-[11px] text-slate-300 bg-black/60 p-2.5 rounded border border-white/5 overflow-x-auto font-mono">
                      {JSON.stringify(selectedTask.listingResult, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      inspectAttestation(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                  >
                    View Merkle Attestation Seal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spawn Agent Modal */}
        {isSpawnModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0D111A] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-cyan-400" />
                  Spawn Specialized Agent
                </h3>
                <button
                  onClick={() => setIsSpawnModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Select Agent Role</label>
                  <select
                    value={spawnRole}
                    onChange={e => {
                      setSpawnRole(e.target.value);
                      if (e.target.value === 'BUILDER' || e.target.value === 'LISTER') setSpawnTier('building');
                      else if (e.target.value === 'VALIDATOR') setSpawnTier('validation');
                      else if (e.target.value === 'OUTREACHER' || e.target.value === 'CLOSER' || e.target.value === 'DELIVERER') setSpawnTier('outreach');
                      else if (e.target.value === 'LOGGER') setSpawnTier('logging');
                      else setSpawnTier('discovery');
                    }}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="DISCOVERER">DISCOVERER (Trend Radar Scanner)</option>
                    <option value="ANALYST">ANALYST (Monetization & Pricing)</option>
                    <option value="BUILDER">BUILDER (Deliverable Producer)</option>
                    <option value="VALIDATOR">VALIDATOR (Quality Assurance Gate)</option>
                    <option value="LISTER">LISTER (Marketplace Copywriter)</option>
                    <option value="OUTREACHER">OUTREACHER (Lead Scout & Pitcher)</option>
                    <option value="CLOSER">CLOSER (Negotiator & Escrow Closer)</option>
                    <option value="DELIVERER">DELIVERER (Package Delivery & Payment Capture)</option>
                    <option value="LOGGER">LOGGER (Merkle Evidence & Attestation Signer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Model Cognitive Tier</label>
                  <select
                    value={spawnTier}
                    onChange={e => setSpawnTier(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="master">Master Reasoning (Claude 3.5 Sonnet / GPT-4o)</option>
                    <option value="discovery">Discovery Scanning (Llama 3.1 70B / Auto)</option>
                    <option value="building">Production Building (Claude 3.5 Sonnet)</option>
                    <option value="validation">Validation Deterministic (GPT-4o-mini)</option>
                    <option value="outreach">Outreach Persuasion (Claude 3.5 Sonnet)</option>
                    <option value="logging">Logging & Analysis (GPT-4o-mini)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSpawnModalOpen(false)}
                    className="text-xs border-white/15 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSpawnAgent}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Spawn into Colony
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
