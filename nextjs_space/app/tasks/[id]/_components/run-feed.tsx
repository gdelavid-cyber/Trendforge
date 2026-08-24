'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Proof-of-work run feed: polls the owner-scoped run endpoint while the
// companion is working and renders the step log as it lands — with timing,
// full outputs, and evidence chips (links/ids) so the user can verify that
// real work happened instead of trusting a status word.

interface StepEntry {
  index: number;
  title: string | null;
  action: string | null;
  status: string;
  output: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  at?: string | null;
}

interface ArtifactEntry {
  id: string;
  stepIndex: number;
  kind: string;
  name: string;
  url: string | null;
  meta: any;
  createdAt: string;
}

interface RunData {
  run: {
    id: string;
    mode: string | null;
    status: string;
    currentStep: number;
    task: { id: string; title: string; totalSteps: number };
  };
  steps: StepEntry[];
  artifacts: ArtifactEntry[];
}

const STATUS_META: Record<string, { icon: typeof CheckCircle; classes: string; label: string }> = {
  done: { icon: CheckCircle, classes: 'text-green-400 bg-green-500/10 border-green-500/30', label: 'done' },
  blocked: { icon: AlertTriangle, classes: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30', label: 'blocked' },
  failed: { icon: XCircle, classes: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'failed' },
  approved_by_user: { icon: ShieldCheck, classes: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/30', label: 'approved' },
  rejected_by_user: { icon: XCircle, classes: 'text-gray-400 bg-gray-500/10 border-gray-500/30', label: 'rejected' },
};

function formatDuration(ms: number | null): string | null {
  if (ms === null || ms === undefined) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function EvidenceChips({ artifact }: { artifact: ArtifactEntry }) {
  const chips: React.ReactNode[] = [];
  const meta = artifact.meta ?? {};

  if (artifact.url) {
    chips.push(
      <a key="url" href={artifact.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 hover:bg-[#00F0FF]/20">
        Open {(meta.format ? artifact.name : artifact.kind.toLowerCase()) || 'deliverable'} <ExternalLink className="w-2.5 h-2.5" />
      </a>
    );
  }
  if (artifact.kind === 'EMAIL' && meta.messageId) {
    chips.push(
      <span key="email" className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/25">
        sent via {meta.provider ?? 'provider'}{meta.recipient ? ` → ${meta.recipient}` : ''} · id {String(meta.messageId).slice(0, 18)}
      </span>
    );
  }
  if (artifact.kind === 'POST') {
    chips.push(
      <span key="post" className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/25">
        live on X{meta.postId ? ` · ${String(meta.postId).slice(0, 16)}` : ''}
      </span>
    );
  }
  if (artifact.kind === 'RESEARCH' && Array.isArray(meta.sources)) {
    chips.push(
      <span key="research" className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25">
        {meta.sources.length} live source{meta.sources.length === 1 ? '' : 's'}
      </span>
    );
  }
  if (artifact.kind === 'TRADE') {
    chips.push(
      <span key="trade" className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/25">
        staged ticket{meta.live ? '' : ' · not filled'}
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>;
}

export function RunFeed({ userTaskId, active }: { userTaskId: string | null; active: boolean }) {
  const [data, setData] = useState<RunData | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchRun = useCallback(async () => {
    if (!userTaskId) return;
    try {
      const res = await fetch(`/api/tasks/runs/${userTaskId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.success) setData({ run: body.run, steps: body.steps, artifacts: body.artifacts });
    } catch {}
  }, [userTaskId]);

  useEffect(() => {
    if (!userTaskId) return;
    setLoading(true);
    fetchRun().finally(() => setLoading(false));
  }, [userTaskId, fetchRun]);

  useEffect(() => {
    if (!userTaskId || !active) return;
    const timer = setInterval(fetchRun, 3000);
    return () => clearInterval(timer);
  }, [userTaskId, active, fetchRun]);

  // Refetch once when a live run settles so the feed shows its final state.
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && !active && userTaskId) fetchRun();
    wasActive.current = active;
  }, [active, userTaskId, fetchRun]);

  const toggle = (index: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const downloadReceipt = () => {
    if (!data) return;
    const bundle = {
      generatedAt: new Date().toISOString(),
      platform: 'Trendly proof-of-work receipt',
      run: data.run,
      steps: data.steps,
      artifacts: data.artifacts.map((a) => ({
        kind: a.kind,
        name: a.name,
        url: a.url,
        evidence: a.meta,
        createdAt: a.createdAt,
        stepIndex: a.stepIndex,
      })),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trendly-proof-${data.run.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!userTaskId || loading || !data || data.steps.length === 0) return null;

  const sorted = [...data.steps].sort((a, b) => a.index - b.index);

  return (
    <div className="glass-card border border-white/5 rounded-xl p-6" data-tour="task-run-feed">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" /> Live Work Log
          {active && <Loader2 className="w-3 h-3 text-[#00F0FF] animate-spin" />}
        </h3>
        <Button size="sm" variant="outline" onClick={downloadReceipt} className="border-white/10 text-white h-7 text-[10px] font-mono uppercase">
          <Download className="w-3 h-3 mr-1" /> Proof receipt
        </Button>
      </div>

      <div className="space-y-2.5">
        {sorted.map((step) => {
          const meta = STATUS_META[step.status] ?? { icon: Clock, classes: 'text-muted-foreground bg-white/5 border-white/10', label: step.status };
          const Icon = meta.icon;
          const duration = formatDuration(step.durationMs);
          const artifact = data.artifacts.find((a) => a.stepIndex === step.index);
          const isOpen = expanded.has(step.index);

          return (
            <div key={`${step.index}-${step.finishedAt ?? step.at ?? 'pending'}`} className={`rounded-lg border p-3 ${step.status === 'blocked' ? 'border-yellow-500/20 bg-yellow-500/[0.04]' : 'border-white/5 bg-black/30'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${meta.classes}`}>
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[55%]">{step.title ?? `Step ${step.index + 1}`}</span>
                {step.action && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[#8E9BB4] border border-white/10">{step.action}</span>
                )}
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${meta.classes}`}>{meta.label}</span>
                {duration && <span className="text-[9px] font-mono text-[#8E9BB4] ml-auto">{duration}</span>}
              </div>

              <p className={`text-[11px] font-mono mt-2 whitespace-pre-wrap break-words text-[#B0B0C8] ${isOpen ? '' : 'line-clamp-2'}`}>
                {step.output || '(no output recorded)'}
              </p>

              {step.output.length > 140 && (
                <button onClick={() => toggle(step.index)} className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-mono text-[#00F0FF] hover:text-white">
                  {isOpen ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show full <ChevronDown className="w-3 h-3" /></>}
                </button>
              )}

              {artifact && <EvidenceChips artifact={artifact} />}

              {step.startedAt && (
                <p className="text-[9px] font-mono text-[#8E9BB4]/70 mt-1.5">
                  {new Date(step.startedAt).toLocaleTimeString()}{step.finishedAt ? ` → ${new Date(step.finishedAt).toLocaleTimeString()}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
