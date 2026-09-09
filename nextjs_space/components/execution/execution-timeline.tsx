'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertTriangle, Rocket } from 'lucide-react';

interface StageView {
  key: string;
  label: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FALLBACK' | 'FAILED';
  usedFallback: boolean;
  attempts: number;
  latencyMs: number;
  output: unknown;
}

interface ExecView {
  id: string;
  status: string;
  currentStage: string | null;
  progressPct: number;
  degraded: boolean;
  trendName: string;
  revenueKit: unknown;
  stages: StageView[];
}

export function ExecutionTimeline({
  executionId,
  onComplete,
}: {
  executionId: string;
  onComplete?: (kit: unknown) => void;
}) {
  const [exec, setExec] = useState<ExecView | null>(null);
  const [approving, setApproving] = useState(false);

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
        setTimeout(tick, 2500);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, [poll]);

  const approve = async () => {
    setApproving(true);
    try {
      await fetch(`/api/execution/${executionId}/approve`, { method: 'POST' });
      await poll();
    } finally {
      setApproving(false);
    }
  };

  if (!exec) {
    return <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />;
  }

  const icon = (s: StageView) => {
    if (s.status === 'RUNNING') return <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />;
    if (s.status === 'FALLBACK') return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    if (s.status === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (s.status === 'FAILED') return <AlertTriangle className="h-4 w-4 text-red-400" />;
    return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  };

  return (
    <Card className="border border-border/80 bg-black/40 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 font-mono">
            <Rocket className="h-4 w-4 text-emerald-400" />
            Executing: {exec.trendName}
          </CardTitle>
          <Badge
            variant={exec.degraded ? 'outline' : 'default'}
            className={
              exec.degraded
                ? 'text-yellow-400 border-yellow-400/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }
          >
            {exec.status}
          </Badge>
        </div>
        <Progress value={exec.progressPct} className="mt-3" />
      </CardHeader>

      <CardContent className="space-y-2">
        {exec.stages.map((s) => (
          <div
            key={s.key}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-white/[0.02] p-3"
          >
            <div className="mt-0.5">{icon(s)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                {s.usedFallback && (
                  <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/40">
                    fallback
                  </Badge>
                )}
                {s.attempts > 1 && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {s.attempts} attempts
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
            {s.latencyMs > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {(s.latencyMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        ))}

        {exec.status === 'AWAITING_APPROVAL' && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium mb-1 text-emerald-400">Revenue kit ready</p>
            <p className="text-xs text-muted-foreground mb-3">
              Everything from offer through close is drafted. Review the outreach before you send
              anything — the drafts use personalization slots that need real values.
              {exec.degraded && ' Some stages used fallback output; re-run those for better quality.'}
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={approve}
              disabled={approving}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
            >
              {approving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
              Approve & unlock kit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
