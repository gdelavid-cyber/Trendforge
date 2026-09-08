'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Database,
  Layers,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal as TerminalIcon,
  Users,
  Zap,
} from 'lucide-react';

interface TelemetryHealth {
  status: 'LIVE' | 'STALE' | 'BLOCKED' | 'NEVER_RUN';
  lastRunAt: string | null;
  lastSource: string | null;
  recordsIngested: number;
  errorMessage: string | null;
  minutesSinceLastRun: number | null;
}

interface TelemetryCounts {
  trend: number;
  task: number;
  executionLog: number;
  agentActivityLog: number;
  swarmBrainDecision: number;
  novaTrace: number;
  autonomousAgent: number;
  web4Agent: number;
  swarmTask: number;
  assetJob: number;
}

interface AutonomousAgentItem {
  id: string;
  role: string;
  status: string;
  performanceScore: number;
  tasksCompleted: number;
  tasksFailed: number;
  cyclesSinceRevenue: number;
  lastActiveTime: string;
}

interface Web4AgentItem {
  id: string;
  name: string;
  archetype: string;
  status: string;
  walletBalance: number;
  survivalScore: number;
  lastActive: string | null;
}

interface SpeciesItem {
  id: string;
  role: string;
  name: string;
  status: string;
  targetHeadcount: number;
  dailyBudgetUsd: number;
  currentSpendUsd: number;
}

interface JobItem {
  id: string;
  slot: string;
  rarity: string;
  stage: string;
  priority: number;
  attempts: number;
  totalCostUsd?: number;
  errorMessage?: string | null;
  createdAt: string | null;
}

interface EventLogItem {
  id: string;
  timestamp: string;
  type: 'EXECUTION' | 'AGENT' | 'DECISION' | 'TRACE';
  label: string;
  text: string;
  cost?: number;
  confidence?: number;
}

interface TelemetryData {
  success: boolean;
  health: TelemetryHealth;
  counts: TelemetryCounts;
  agents: AutonomousAgentItem[];
  web4Agents: Web4AgentItem[];
  species?: SpeciesItem[];
  jobs: JobItem[];
  eventLog: EventLogItem[];
  error?: string;
}

export function SwarmTelemetryConsole() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/swarm/telemetry', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setFetchError(null);
      } else {
        setFetchError(json.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Network error fetching telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 border border-[#00F0FF]/20 bg-[#040408] rounded-2xl font-mono text-center py-12 space-y-3">
        <RefreshCw className="w-6 h-6 text-[#00F0FF] animate-spin mx-auto" />
        <div className="text-sm font-bold text-[#E8E8E8] tracking-wider">CONNECTING…</div>
        <p className="text-xs text-[#8E9BB4]">Querying swarm state & telemetry bus</p>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="glass-card p-6 border border-red-500/30 bg-red-950/20 rounded-2xl font-mono text-left py-6 space-y-2">
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>TELEMETRY BUS ERROR</span>
        </div>
        <p className="text-xs text-red-200/80 break-words">{fetchError || 'No telemetry payload returned.'}</p>
      </div>
    );
  }

  const { health, counts, agents, web4Agents, species, eventLog } = data;

  return (
    <div className="space-y-6 text-[#E8E8E8]">
      {/* 1. Scraper Health Banner */}
      <div className="rounded-2xl border bg-[#040408] p-5 relative overflow-hidden">
        {health.status === 'LIVE' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-cyan-400 pl-4 py-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <div>
                <span className="font-orbitron font-bold text-sm text-cyan-300 tracking-wider">
                  SCRAPLER STATUS: LIVE
                </span>
                <p className="text-xs font-mono text-[#8E9BB4] mt-0.5">
                  Last run {health.minutesSinceLastRun ?? 0}m ago via {health.lastSource ?? 'SCRAPLING_WORKER'} —{' '}
                  <strong className="text-white">{health.recordsIngested}</strong> signals ingested.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 self-start sm:self-auto">
              HEALTHY &middot; ACTIVE
            </div>
          </div>
        )}

        {health.status === 'STALE' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-amber-400 pl-4 py-1">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-amber-400 shrink-0"></span>
              <div>
                <span className="font-orbitron font-bold text-sm text-amber-300 tracking-wider">
                  SCRAPER STATUS: STALE
                </span>
                <p className="text-xs font-mono text-[#8E9BB4] mt-0.5">
                  No successful ingest in {health.minutesSinceLastRun ?? '>45'}m. Worker scheduled job may be paused or offline.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 self-start sm:self-auto">
              STALE &middot; DISPATCH REQUIRED
            </div>
          </div>
        )}

        {health.status === 'BLOCKED' && (
          <div className="flex flex-col gap-2 border-l-4 border-red-500 pl-4 py-1">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-orbitron font-bold text-sm text-red-400 tracking-wider">
                SCRAPER STATUS: BLOCKED
              </span>
            </div>
            <p className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-500/30 rounded p-2.5 mt-1">
              {health.errorMessage || 'Ingestion failed with zero records and error state recorded.'}
            </p>
          </div>
        )}

        {health.status === 'NEVER_RUN' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-slate-600 pl-4 py-1">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8E9BB4] shrink-0" />
              <div>
                <span className="font-orbitron font-bold text-sm text-[#8E9BB4] tracking-wider">
                  SCRAPER STATUS: NEVER RUN
                </span>
                <p className="text-xs font-mono text-[#8E9BB4] mt-0.5">
                  Scraper has never reported. Deploy the worker cron job to begin live intake.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded bg-slate-900 text-slate-400 border border-slate-700 self-start sm:self-auto">
              IDLE &middot; NO INGESTION LOGS
            </div>
          </div>
        )}
      </div>

      {/* 2. Subsystem Census */}
      <div className="glass-card p-6 border border-white/[0.08] bg-[#040408]/90 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-white">
              Subsystem Census (Dormancy Radar)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#8E9BB4]">Verified DB Row Counts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(counts).map(([table, count]) => {
            const isDormant = count === 0;
            return (
              <div
                key={table}
                className={`p-3 rounded-xl border transition-all ${
                  isDormant
                    ? 'bg-black/30 border-white/[0.04] opacity-50'
                    : 'bg-slate-950/60 border-cyan-500/20'
                }`}
              >
                <div className="text-[10px] font-mono text-[#8E9BB4] truncate" title={table}>
                  {table}
                </div>
                <div className="text-xl font-bold font-mono mt-1 text-white">
                  {count.toLocaleString()}
                </div>
                <div className="text-[9px] font-mono mt-1">
                  {isDormant ? (
                    <span className="text-slate-500 uppercase tracking-wide">DORMANT</span>
                  ) : (
                    <span className="text-cyan-400 uppercase tracking-wide">ONLINE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Agents & Web4 Agents Panel */}
      <div className="glass-card p-6 border border-white/[0.08] bg-[#040408]/90 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFD700]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-white">
              Active Swarm & Web4 Agents
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#8E9BB4]">
            {agents.length + web4Agents.length} Agents Tracked
          </span>
        </div>

        {agents.length === 0 && web4Agents.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[#8E9BB4] border border-dashed border-white/[0.08] rounded-xl">
            NO AGENTS SPAWNED — IDLE
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Autonomous Agents */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#8E9BB4] uppercase tracking-wider block">
                Autonomous Workforce
              </span>
              {agents.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-[#8E9BB4] bg-black/30 rounded-lg border border-white/[0.04]">
                  NO AUTONOMOUS AGENTS
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {agents.map((ag) => (
                    <div
                      key={ag.id}
                      className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white">{ag.role}</span>
                        <div className="text-[10px] text-[#8E9BB4] mt-0.5">
                          Score: {ag.performanceScore.toFixed(0)} &middot; Tasks: {ag.tasksCompleted} ok / {ag.tasksFailed} fail
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/20 text-cyan-300">
                        {ag.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Web4 Agents */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#8E9BB4] uppercase tracking-wider block">
                Web4 Companions (Ledger-Backed)
              </span>
              {web4Agents.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-[#8E9BB4] bg-black/30 rounded-lg border border-white/[0.04]">
                  NO WEB4 AGENTS
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {web4Agents.map((ag) => (
                    <div
                      key={ag.id}
                      className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white">{ag.name}</span>
                        <div className="text-[10px] text-[#8E9BB4] mt-0.5">
                          {ag.archetype} &middot; Balance: ${ag.walletBalance.toFixed(2)} USDC
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
                        {ag.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Species & Budget Panel (Admin only) */}
      {species !== undefined && (
        <div className="glass-card p-6 border border-white/[0.08] bg-[#040408]/90 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#FFD700]" />
              <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-white">
                Species Budgets & Caps (Admin View)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8E9BB4]">Verified Spend Caps</span>
          </div>

          {species.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-[#8E9BB4] border border-dashed border-white/[0.08] rounded-xl">
              NO SPECIES CONFIGURED
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {species.map((sp) => {
                const ratio = sp.dailyBudgetUsd > 0 ? Math.min(100, Math.round((sp.currentSpendUsd / sp.dailyBudgetUsd) * 100)) : 0;
                return (
                  <div key={sp.id} className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white truncate">{sp.name || sp.role}</span>
                      <span className="text-[10px] text-[#8E9BB4]">{sp.targetHeadcount} agents</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[#8E9BB4] mb-1">
                        <span>Spend</span>
                        <span>
                          ${sp.currentSpendUsd.toFixed(2)} / ${sp.dailyBudgetUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${ratio > 90 ? 'bg-red-400' : ratio > 60 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Live Event Terminal */}
      <div className="glass-card p-6 border border-white/[0.08] bg-[#040408]/90 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-white">
              Swarm Event Log (Realtime Bus)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#8E9BB4]">Last 40 Actionable Events</span>
        </div>

        {eventLog.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[#8E9BB4] border border-dashed border-white/[0.08] rounded-xl">
            NO ACTIVITY RECORDED — IDLE
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 bg-black/60 p-4 rounded-xl border border-white/[0.06]">
            {eventLog.map((ev) => {
              let badgeStyle = 'text-gray-400 border-gray-700 bg-gray-900/30';
              if (ev.type === 'EXECUTION') badgeStyle = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
              if (ev.type === 'AGENT') badgeStyle = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
              if (ev.type === 'DECISION') badgeStyle = 'text-purple-400 border-purple-500/30 bg-purple-950/20';
              if (ev.type === 'TRACE') badgeStyle = 'text-slate-400 border-slate-700 bg-slate-900/40';

              const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';

              return (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 py-1 border-b border-white/[0.03] hover:bg-white/[0.02] px-1 rounded transition-colors"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-[10px] text-[#8E9BB4] shrink-0 pt-0.5">{timeStr}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeStyle}`}>
                      {ev.type} &middot; {ev.label}
                    </span>
                    <span className="text-[#E8E8E8] truncate text-[11px] pt-0.5" title={ev.text}>
                      {ev.text}
                    </span>
                  </div>
                  {typeof ev.cost === 'number' && (
                    <span className="text-[10px] text-amber-400 font-bold shrink-0">
                      ${ev.cost.toFixed(4)}
                    </span>
                  )}
                  {typeof ev.confidence === 'number' && (
                    <span className="text-[10px] text-purple-400 font-bold shrink-0">
                      {ev.confidence}% conf
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
