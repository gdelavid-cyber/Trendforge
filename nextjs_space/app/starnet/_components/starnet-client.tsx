'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Activity,
  ShieldAlert,
  Play,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Zap,
  DollarSign,
  TrendingUp,
  Terminal,
  Clock,
  Plus,
  Compass,
  Hammer,
  Megaphone,
  Briefcase,
  Sliders,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialTasks: any[];
  initialApprovals: any[];
  initialVentures: any[];
  initialSpends: any[];
  userId: string;
}

const AGENT_ROLES = [
  {
    role: 'SCOUT',
    title: 'Market Scout',
    description: 'Discovers viral trends, forum bottlenecks, and competitor gaps.',
    icon: Compass,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
  },
  {
    role: 'ARCHITECT',
    title: 'Venture Architect',
    description: 'Synthesizes demand evidence, conducts ICP interviews, drafts validation reports.',
    icon: Layers,
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
  },
  {
    role: 'BUILDER',
    title: 'Product Builder',
    description: 'Constructs product specs, landing page copy, value propositions, and live offers.',
    icon: Hammer,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
  {
    role: 'MARKETER',
    title: 'Growth Marketer',
    description: 'Formulates multi-channel acquisition playbooks, cold outbound, and community hooks.',
    icon: Megaphone,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    role: 'CLOSER',
    title: 'Deal Closer',
    description: 'Manages sales proposal drafting, term negotiation, and Stripe checkout deployment.',
    icon: Briefcase,
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
  },
  {
    role: 'OPERATOR',
    title: 'Fleet Governor',
    description: 'Reconciles real revenues, enforces burn rate limits, governs lifecycle stage gates.',
    icon: Sliders,
    color: 'from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-400',
  },
];

export function StarNetDashboardClient({
  initialTasks,
  initialApprovals,
  initialVentures,
  initialSpends,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'approvals' | 'fleet' | 'telemetry'>('tasks');
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [approvals, setApprovals] = useState<any[]>(initialApprovals);
  const [ventures, setVentures] = useState<any[]>(initialVentures);
  const [spends, setSpends] = useState<any[]>(initialSpends);
  const [isRunningSweep, setIsRunningSweep] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectForm, setInjectForm] = useState({
    agentRole: 'ARCHITECT',
    taskType: 'DEMAND_VALIDATION',
    ventureId: ventures[0]?.id || '',
    payloadJson: '{\n  "priority": "HIGH"\n}',
  });

  // Fleet Aggregates
  const totalVerifiedRevenueCents = ventures.reduce((sum, v) => {
    const verified = (v.financialRecords || [])
      .filter((f: any) => f.type === 'REVENUE' && f.provenance === 'VERIFIED')
      .reduce((s: number, f: any) => s + f.amountCents, 0);
    return sum + (v.revenueCents || verified);
  }, 0);

  const totalComputeSpendCents = spends.reduce((sum, s) => sum + (s.costCents || 0), 0);

  const handleRunAutonomousSweep = async () => {
    setIsRunningSweep(true);
    try {
      const res = await fetch('/api/ventures/autonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger autonomy sweep');

      toast.success(
        `Autonomous sweep complete: ${data.summary.advancedCount} advanced, ${data.summary.pausedCount} paused.`
      );

      // Refresh tasks and approvals
      const [taskRes, appRes] = await Promise.all([
        fetch('/api/starnet/tasks?limit=30'),
        fetch('/api/approvals/requests?status=PENDING'),
      ]);
      const taskData = await taskRes.json();
      const appData = await appRes.json();
      if (taskData.tasks) setTasks(taskData.tasks);
      if (appData.requests) setApprovals(appData.requests);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRunningSweep(false);
    }
  };

  const handleProcessNextTask = async () => {
    setIsProcessingNext(true);
    try {
      const res = await fetch('/api/starnet/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PROCESS_NEXT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute next task');

      if (data.executed) {
        toast.success(`Task ${data.result.taskId} executed by ${data.result.agentRole}!`);
      } else {
        toast.info('No pending tasks in queue.');
      }

      const taskRes = await fetch('/api/starnet/tasks?limit=30');
      const taskData = await taskRes.json();
      if (taskData.tasks) setTasks(taskData.tasks);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingNext(false);
    }
  };

  const handleResolveApproval = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/approvals/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve approval');

      toast.success(`Approval request ${action.toLowerCase()} successfully!`);
      setApprovals(approvals.filter((a) => a.id !== requestId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleInjectTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(injectForm.payloadJson);
      } catch {
        throw new Error('Invalid JSON payload');
      }

      const res = await fetch('/api/starnet/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentRole: injectForm.agentRole,
          taskType: injectForm.taskType,
          ventureId: injectForm.ventureId || undefined,
          payload: parsedPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to queue task');

      toast.success(`Task queued for ${injectForm.agentRole}!`);
      setTasks([data.task, ...tasks]);
      setShowInjectModal(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                StarNet Swarm Command Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AUTONOMOUS v2.0
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Multi-agent enterprise swarm orchestrator & automated venture lifecycle governor
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleProcessNextTask}
            disabled={isProcessingNext}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isProcessingNext ? 'animate-spin' : ''}`} />
            Process Next Task
          </button>

          <button
            onClick={() => setShowInjectModal(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Inject Task
          </button>

          <button
            onClick={handleRunAutonomousSweep}
            disabled={isRunningSweep}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isRunningSweep ? 'animate-spin' : ''}`} />
            Run Autonomy Sweep
          </button>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ACTIVE VENTURES</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{ventures.length}</div>
          <div className="text-xs text-cyan-400/80 mt-1">Autonomous fleet</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>SWARM ROLES</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">6 / 6 Online</div>
          <div className="text-xs text-emerald-400 mt-1">Zero latency drift</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>PENDING APPROVALS</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{approvals.length}</div>
          <div className="text-xs text-amber-400/80 mt-1">Human circuit breaker</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>TOTAL VERIFIED REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${(totalVerifiedRevenueCents / 100).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Stripe confirmed</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>COMPUTE BURN</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            ${(totalComputeSpendCents / 100).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Agent token spend</div>
        </div>
      </div>

      {/* Swarm Specialist Agent Matrix */}
      <div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Specialist Agent Fleet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AGENT_ROLES.map((agent) => {
            const Icon = agent.icon;
            const roleTasks = tasks.filter((t) => (t.payload as any)?.agentRole === agent.role);
            const roleSpends = spends.filter((s) => s.agentRole === agent.role);
            const roleCostUsd = roleSpends.reduce((s, sp) => s + (sp.costCents || 0), 0) / 100;

            return (
              <div
                key={agent.role}
                className={`p-3.5 rounded-xl border bg-gradient-to-b ${agent.color} transition-all hover:scale-[1.02] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-white">
                      ACTIVE
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-white">{agent.title}</div>
                  <p className="text-xs text-slate-300/80 mt-1 line-clamp-2">{agent.description}</p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{roleTasks.length} tasks</span>
                  <span className="font-mono text-cyan-300 font-medium">${roleCostUsd.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Task Queue ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Approval Queue ({approvals.length})
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fleet'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Venture Fleet ({ventures.length})
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Compute Telemetry
        </button>
      </div>

      {/* Tab 1: Task Queue */}
      {activeTab === 'tasks' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/[0.04] text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Venture</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No tasks found in queue. Click "Inject Task" to dispatch work.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const agentRole = (task.payload as any)?.agentRole || 'OPERATOR';
                    const isPending = task.status === 'PENDING';
                    const isRunning = task.status === 'RUNNING';
                    const isCompleted = task.status === 'COMPLETED';

                    return (
                      <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400">{task.taskId}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/5 border border-white/10 text-white">
                            {agentRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{task.taskType}</td>
                        <td className="px-4 py-3 text-slate-400">{task.venture?.name || 'Global Fleet'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isRunning
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(task.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="text-xs text-cyan-400 hover:underline"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Approval Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-white/10 bg-white/[0.02]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">Approval Queue Clear</h3>
              <p className="text-sm text-slate-400 mt-1">
                No ventures have triggered capital threshold or risk circuit breakers.
              </p>
            </div>
          ) : (
            approvals.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {req.riskLevel} RISK
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{req.proposedAction}</span>
                    <span className="text-xs text-slate-500">• {req.venture?.name}</span>
                  </div>
                  <h4 className="font-semibold text-white text-base">{req.rationale}</h4>
                  <div className="text-xs text-slate-400">
                    Estimated Cost / Burn:{' '}
                    <span className="text-white font-mono font-medium">
                      ${(req.estimatedCostCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleResolveApproval(req.id, 'REJECTED')}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject & Kill
                  </button>
                  <button
                    onClick={() => handleResolveApproval(req.id, 'APPROVED')}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Resume
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Venture Fleet Progress */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ventures.map((v) => (
            <div key={v.id} className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-base">{v.name}</h4>
                  <p className="text-xs text-slate-400">{v.industry || 'Technology'} • {v.targetCustomer}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {v.lifecycleState}
                </span>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Allocation: <span className="text-white font-mono font-medium">${(v.capitalAllocatedCents / 100).toFixed(2)}</span>
                </div>
                <div>
                  Revenue: <span className="text-emerald-400 font-mono font-medium">${(v.revenueCents / 100).toFixed(2)}</span>
                </div>
                <div>
                  Offers: <span className="text-white font-mono font-medium">{v.offers?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Compute Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <h3 className="font-semibold text-white">Agent Token & Spend Telemetry</h3>
          <div className="divide-y divide-white/5">
            {spends.slice(0, 15).map((sp) => (
              <div key={sp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{sp.agentRole}</span>
                  <span className="text-slate-400 font-mono">• {sp.toolName || sp.modelUsed}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">
                    {sp.tokensIn + sp.tokensOut} tokens
                  </span>
                  <span className="font-mono text-cyan-400 font-medium">
                    ${(sp.costCents / 100).toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Task Detail Inspector */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0B0F19] border border-white/20 rounded-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Task Payload & Execution Trace
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-400">
                Task ID: <span className="text-cyan-400 font-mono">{selectedTask.taskId}</span>
              </div>
              <div className="text-slate-400">
                Type: <span className="text-white font-medium">{selectedTask.taskType}</span>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Payload:</div>
              <pre className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto">
                {JSON.stringify(selectedTask.payload, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Execution Result:</div>
              <pre className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(selectedTask.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Task Injection */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleInjectTask}
            className="w-full max-w-lg bg-[#0B0F19] border border-white/20 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base">Inject Swarm Task</h3>
              <button
                type="button"
                onClick={() => setShowInjectModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Agent Role</label>
                <select
                  value={injectForm.agentRole}
                  onChange={(e) => setInjectForm({ ...injectForm, agentRole: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  {AGENT_ROLES.map((r) => (
                    <option key={r.role} value={r.role} className="bg-slate-900 text-white">
                      {r.title} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Type Identifier</label>
                <input
                  type="text"
                  value={injectForm.taskType}
                  onChange={(e) => setInjectForm({ ...injectForm, taskType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. DEMAND_VALIDATION, OFFER_CREATION"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Associate with Venture (Optional)</label>
                <select
                  value={injectForm.ventureId}
                  onChange={(e) => setInjectForm({ ...injectForm, ventureId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="" className="bg-slate-900 text-white">
                    None (Global Fleet)
                  </option>
                  {ventures.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                      {v.name} ({v.lifecycleState})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">JSON Payload</label>
                <textarea
                  value={injectForm.payloadJson}
                  onChange={(e) => setInjectForm({ ...injectForm, payloadJson: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInjectModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
              >
                Dispatch Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
