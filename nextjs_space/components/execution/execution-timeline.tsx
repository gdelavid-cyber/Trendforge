'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Rocket,
  Play,
  Terminal,
  UserCheck,
  Bot,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MoneyChoiceGate } from '@/components/execution/money-choice-gate';

interface StageView {
  key: string;
  label: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FALLBACK' | 'FAILED';
  usedFallback: boolean;
  attempts: number;
  latencyMs: number;
  output: any;
}

interface ExecEvent {
  id: string;
  at: string;
  actor: 'system' | 'llm' | 'user' | 'fallback' | string;
  stageKey?: string | null;
  message: string;
  data?: any;
}

interface ExecView {
  id: string;
  status: string;
  currentStage: string | null;
  progressPct: number;
  degraded: boolean;
  trendName: string;
  revenueKit: any;
  stages: StageView[];
  events?: ExecEvent[];
}

export function ExecutionTimeline({
  executionId,
  onComplete,
}: {
  executionId: string;
  onComplete?: (kit: unknown) => void;
}) {
  const [exec, setExec] = useState<ExecView | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/execution/${executionId}`);
      if (!res.ok) return false;
      const data: ExecView = await res.json();
      setExec(data);
      if (['AWAITING_APPROVAL', 'COMPLETED', 'DEGRADED'].includes(data.status)) {
        onComplete?.(data.revenueKit);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [executionId, onComplete]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const done = await poll();
      if (active && !done) {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, [poll]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [exec?.events]);

  const handleApprove = async (path: 'user' | 'ai_assists') => {
    setApproving(path);
    try {
      await fetch(`/api/execution/${executionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      await poll();
    } finally {
      setApproving(null);
    }
  };

  if (!exec) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-xl bg-muted/20 animate-pulse border border-border/40" />
        <div className="h-64 rounded-xl bg-muted/20 animate-pulse border border-border/40" />
      </div>
    );
  }

  const icon = (s: StageView) => {
    if (s.status === 'RUNNING') return <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />;
    if (s.status === 'FALLBACK') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    if (s.status === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (s.status === 'FAILED') return <AlertTriangle className="h-4 w-4 text-red-400" />;
    return <Circle className="h-4 w-4 text-muted-foreground/30" />;
  };

  // Find preview HTML if available
  const previewStage = exec.stages.find((s) => s.key === 'preview');
  const playableHtml =
    exec.revenueKit?.preview?.playableHtml ||
    previewStage?.output?.playableHtml ||
    null;

  return (
    <div className="space-y-6">
      {/* Main Execution Header & Stage Graph */}
      <Card className="border border-border/70 bg-black/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2.5 font-mono">
              <Rocket className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>Work Graph: <span className="text-foreground font-semibold">{exec.trendName}</span></span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant={exec.degraded ? 'outline' : 'default'}
                className={
                  exec.degraded
                    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                    : exec.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                }
              >
                {exec.status.replace('_', ' ')}
              </Badge>
              {exec.degraded && (
                <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> degraded fallback
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Progress</span>
              <span>{exec.progressPct}%</span>
            </div>
            <Progress value={exec.progressPct} className="h-1.5 bg-muted/40" />
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pt-2">
          {exec.stages.map((s) => (
            <div
              key={s.key}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                s.status === 'RUNNING'
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : s.status === 'COMPLETED'
                    ? 'border-border/50 bg-white/[0.02]'
                    : s.status === 'FALLBACK'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border/20 bg-transparent opacity-60'
              }`}
            >
              <div className="mt-0.5">{icon(s)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  {s.usedFallback && (
                    <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/40 bg-amber-500/10">
                      fallback
                    </Badge>
                  )}
                  {s.attempts > 1 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {s.attempts} attempts
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              {s.latencyMs > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono self-center">
                  {(s.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Playable Video Preview */}
      {playableHtml && (
        <Card className="border border-border/80 bg-black/60 overflow-hidden shadow-2xl">
          <CardHeader className="py-2.5 px-4 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Playable Video Preview & Storyboard
              </CardTitle>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              HTML5 Slideshow Engine
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              srcDoc={playableHtml}
              className="w-full h-96 border-0 bg-[#090d16]"
              sandbox="allow-scripts allow-same-origin"
              title="Playable Video Preview"
            />
          </CardContent>
        </Card>
      )}

      {/* Money Choice Gate: Pre-Qualified Buyers + Practice Pitch Coach */}
      {exec.status === 'AWAITING_APPROVAL' && (
        <MoneyChoiceGate
          executionId={executionId}
          leadCount={exec.revenueKit?.buyerLeadCount || 5}
        />
      )}

      {/* Transparency Log (Real-Time Execution Events) */}
      <Card className="border border-border/60 bg-black/60 shadow-xl overflow-hidden">
        <CardHeader
          className="py-2.5 px-4 bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between cursor-pointer select-none"
          onClick={() => setShowLogs(!showLogs)}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Transparency Execution Log ({exec.events?.length ?? 0} events)
            </CardTitle>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>

        {showLogs && (
          <CardContent className="p-3">
            <div
              ref={logContainerRef}
              className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2 scrollbar-thin scrollbar-thumb-muted"
            >
              {exec.events && exec.events.length > 0 ? (
                exec.events.map((ev) => {
                  const actorColor =
                    ev.actor === 'llm'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : ev.actor === 'fallback'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : ev.actor === 'user'
                          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                          : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';

                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-white/[0.02] border-b border-white/[0.02]"
                    >
                      <span className="text-muted-foreground/60 shrink-0 text-[10px]">
                        {new Date(ev.at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold shrink-0 ${actorColor}`}
                      >
                        {ev.actor}
                      </span>
                      {ev.stageKey && (
                        <span className="text-muted-foreground font-semibold shrink-0 text-[10px]">
                          [{ev.stageKey}]
                        </span>
                      )}
                      <span className="text-foreground/90 break-words flex-1">
                        {ev.message}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground/50 py-4 text-center">
                  Waiting for initial execution events...
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
