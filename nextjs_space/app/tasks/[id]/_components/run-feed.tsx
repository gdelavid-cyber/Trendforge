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
  Sparkles,
  Mic,
  Video,
  Briefcase,
  Volume2,
  Copy,
  Check,
  Play,
  Square,
  Share2,
  Mail,
  Search,
  FileText,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

interface BrainstormMessage {
  speaker: string;
  archetype: string;
  roleTitle: string;
  thought: string;
  proposal: string;
}

interface BrainstormData {
  consensusStrategy: string;
  keyTactics: string[];
  roleAssignments: { stepIndex: number; assignedTo: string; specialty: string }[];
  dialogue: BrainstormMessage[];
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

// Interactive Web Speech synthesis voice note player
function VoiceNoteCard({ artifact }: { artifact: ArtifactEntry }) {
  const meta = artifact.meta ?? {};
  const transcript = meta.transcript || '';
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice synthesis not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    toast.success('Voice transcript copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-br from-[#00F0FF]/10 via-black/50 to-purple-500/10 border border-[#00F0FF]/30 text-left">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-xs font-bold font-mono text-white">🎙️ Spoken Voice Note</span>
          {meta.durationSec && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#00F0FF] border border-[#00F0FF]/20">
              {meta.durationSec}s
            </span>
          )}
          {meta.voiceProfile?.tone && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {meta.voiceProfile.tone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={togglePlay}
            className={`h-6 text-[10px] font-mono px-2 ${
              isPlaying
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                : 'cyan-gradient text-black font-bold'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-2.5 h-2.5 mr-1 fill-current" /> Stop Audio
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5 mr-1 fill-current" /> Play Voice Note
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={copyTranscript}
            className="h-6 text-[10px] font-mono px-2 border-white/10 text-white hover:bg-white/10"
          >
            {copied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
          </Button>
        </div>
      </div>
      <p className="text-[11px] font-sans text-[#E0E7FF] bg-black/40 p-2 rounded border border-white/5 italic">
        "{transcript}"
      </p>
    </div>
  );
}

// Interactive 9:16 Video Storyboard & Script Card
function VideoPackageCard({ artifact }: { artifact: ArtifactEntry }) {
  const meta = artifact.meta ?? {};
  const scenes = Array.isArray(meta.scenes) ? meta.scenes : [];
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const copyScript = () => {
    const text = `🎬 ${meta.title || artifact.name}\n\nHOOK: ${meta.hook || ''}\n\nSCENES:\n${scenes
      .map(
        (s: any) =>
          `Scene ${s.sceneNumber} (${s.durationSec}s):\nVisual: ${s.visualDescription}\nVoiceover: "${s.voiceover}"\nOverlay: ${s.onScreenText}`
      )
      .join('\n\n')}\n\nCaption: ${meta.caption || ''}\nHashtags: ${Array.isArray(meta.hashtags) ? meta.hashtags.join(' ') : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Complete Video Package & Script copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-br from-pink-500/10 via-black/50 to-[#FFD700]/10 border border-pink-500/30 text-left">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-xs font-bold font-mono text-white">🎬 9:16 Viral Video Package</span>
          {meta.viewsPotential && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
              🔥 Est. Reach: {meta.viewsPotential}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={copyScript}
            className="h-6 text-[10px] font-mono px-2 border-pink-500/30 text-pink-300 hover:bg-pink-500/20"
          >
            {copied ? <Check className="w-2.5 h-2.5 mr-1 text-green-400" /> : <Copy className="w-2.5 h-2.5 mr-1" />}
            Copy Video Package
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFull(!showFull)}
            className="h-6 text-[10px] font-mono px-1.5 text-[#8E9BB4]"
          >
            {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {meta.hook && (
        <div className="text-[11px] font-sans text-white mb-2 bg-black/40 p-2 rounded border border-pink-500/20">
          <span className="font-mono font-bold text-pink-400 uppercase text-[9px] block mb-0.5">3-Second Hook:</span>
          "{meta.hook}"
        </div>
      )}

      {showFull && scenes.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {scenes.map((s: any, idx: number) => (
            <div key={idx} className="p-2 rounded bg-black/50 border border-white/5 text-[10px] font-mono">
              <div className="flex justify-between text-pink-300 font-bold mb-1">
                <span>SCENE {s.sceneNumber}</span>
                <span>{s.durationSec}s</span>
              </div>
              <p className="text-[#8E9BB4] mb-1">🎥 {s.visualDescription}</p>
              <p className="text-white italic mb-1">🗣️ "{s.voiceover}"</p>
              <p className="text-[#00F0FF]">💬 Overlay: `{s.onScreenText}`</p>
            </div>
          ))}
          {meta.caption && (
            <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] text-[#CCD6F6] font-sans mt-2">
              <span className="font-mono font-bold text-[#FFD700] block mb-0.5">Caption:</span>
              {meta.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Interactive Sales & Outreach Campaign Card
function SalesCampaignCard({ artifact }: { artifact: ArtifactEntry }) {
  const meta = artifact.meta ?? {};
  const sequence = Array.isArray(meta.outreachSequence) ? meta.outreachSequence : [];
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const copySequence = () => {
    const text = `💼 ${meta.title || artifact.name}\nTarget: ${meta.targetPersona || ''}\nOffer: ${meta.pricingOffer || ''}\n\nSEQUENCE:\n${sequence
      .map((s: any) => `[${s.stage} - ${s.channel}]\nSubject: ${s.subject || 'N/A'}\n${s.messageBody}\nCTA: ${s.callToAction}`)
      .join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Sales Outreach Sequence copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-br from-green-500/10 via-black/50 to-[#00F0FF]/10 border border-green-500/30 text-left">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-bold font-mono text-white">💼 Sales & Client Acquisition</span>
          {meta.pricingOffer && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-300 border border-green-500/20 font-bold">
              Offer: {meta.pricingOffer}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={copySequence}
            className="h-6 text-[10px] font-mono px-2 border-green-500/30 text-green-300 hover:bg-green-500/20"
          >
            {copied ? <Check className="w-2.5 h-2.5 mr-1 text-green-400" /> : <Copy className="w-2.5 h-2.5 mr-1" />}
            Copy Pitch Sequence
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFull(!showFull)}
            className="h-6 text-[10px] font-mono px-1.5 text-[#8E9BB4]"
          >
            {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {meta.valueProposition && (
        <p className="text-[11px] font-sans text-white mb-2 bg-black/40 p-2 rounded border border-green-500/20">
          <span className="font-mono font-bold text-green-400 uppercase text-[9px] block mb-0.5">Value Proposition:</span>
          {meta.valueProposition}
        </p>
      )}

      {showFull && sequence.length > 0 && (
        <div className="space-y-2 mt-2">
          {sequence.map((s: any, idx: number) => (
            <div key={idx} className="p-2 rounded bg-black/50 border border-white/5 text-[10px] font-mono">
              <div className="text-green-300 font-bold mb-1 uppercase text-[9px]">
                {s.stage} // {s.channel}
              </div>
              {s.subject && <p className="text-white font-bold mb-1">Subject: {s.subject}</p>}
              <p className="text-[#CCD6F6] whitespace-pre-wrap mb-1">{s.messageBody}</p>
              <p className="text-[#FFD700]">👉 CTA: {s.callToAction}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceChips({ artifact }: { artifact: ArtifactEntry }) {
  if (artifact.kind === 'VOICE') {
    return <VoiceNoteCard artifact={artifact} />;
  }
  if (artifact.kind === 'VIDEO') {
    return <VideoPackageCard artifact={artifact} />;
  }
  if (artifact.kind === 'SALES') {
    return <SalesCampaignCard artifact={artifact} />;
  }

  const chips: React.ReactNode[] = [];
  const meta = artifact.meta ?? {};

  if (artifact.url) {
    chips.push(
      <a
        key="url"
        href={artifact.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 hover:bg-[#00F0FF]/20"
      >
        Open {(meta.format ? artifact.name : artifact.kind.toLowerCase()) || 'deliverable'} <ExternalLink className="w-2.5 h-2.5" />
      </a>
    );
  }
  if (artifact.kind === 'EMAIL' && meta.messageId) {
    chips.push(
      <span
        key="email"
        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/25"
      >
        sent via {meta.provider ?? 'provider'}
        {meta.recipient ? ` → ${meta.recipient}` : ''} · id {String(meta.messageId).slice(0, 18)}
      </span>
    );
  }
  if (artifact.kind === 'POST') {
    chips.push(
      <span
        key="post"
        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/25"
      >
        live on X{meta.postId ? ` · ${String(meta.postId).slice(0, 16)}` : ''}
      </span>
    );
  }
  if (artifact.kind === 'RESEARCH' && Array.isArray(meta.sources)) {
    chips.push(
      <span
        key="research"
        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25"
      >
        {meta.sources.length} live source{meta.sources.length === 1 ? '' : 's'}
      </span>
    );
  }
  if (artifact.kind === 'TRADE') {
    chips.push(
      <span
        key="trade"
        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/25"
      >
        staged ticket{meta.live ? '' : ' · not filled'}
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>;
}

export function RunFeed({
  userTaskId,
  taskId,
  active,
}: {
  userTaskId: string | null;
  taskId?: string;
  active: boolean;
}) {
  const [data, setData] = useState<RunData | null>(null);
  const [brainstorm, setBrainstorm] = useState<BrainstormData | null>(null);
  const [brainstorming, setBrainstorming] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchRun = useCallback(async () => {
    if (!userTaskId) return;
    try {
      const res = await fetch(`/api/tasks/runs/${userTaskId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.success) {
        setData({ run: body.run, steps: body.steps, artifacts: body.artifacts });

        // Check if there's a saved brainstorm artifact
        const bsArtifact = body.artifacts?.find((a: any) => a.kind === 'BRAINSTORM');
        if (bsArtifact?.meta) {
          setBrainstorm(bsArtifact.meta);
        }
      }
    } catch {}
  }, [userTaskId]);

  const triggerSquadBrainstorm = async () => {
    const targetTaskId = taskId || data?.run?.task?.id;
    if (!targetTaskId) return;
    setBrainstorming(true);
    try {
      const res = await fetch('/api/tasks/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: targetTaskId, userTaskId }),
      });
      const resData = await res.json();
      if (resData.success && resData.brainstorm) {
        setBrainstorm(resData.brainstorm);
        toast.success('Autonomous squad brainstorm complete!');
      } else {
        toast.error(resData.error || 'Brainstorm failed');
      }
    } catch {
      toast.error('Failed to trigger squad brainstorm');
    } finally {
      setBrainstorming(false);
    }
  };

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
      brainstorm,
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

  if (!userTaskId || loading || !data || data.steps.length === 0) {
    return (
      <div className="glass-card border border-white/5 rounded-xl p-6 text-center my-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00F0FF]" /> Autonomous Squad War-Room
          </h3>
          <Button
            size="sm"
            onClick={triggerSquadBrainstorm}
            disabled={brainstorming}
            className="cyan-gradient text-black font-extrabold text-[10px] font-mono uppercase h-7 px-3"
          >
            {brainstorming ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Brainstorm Squad Strategy
          </Button>
        </div>
        {brainstorm && <BrainstormPanel brainstorm={brainstorm} />}
        {!brainstorm && !brainstorming && (
          <p className="text-xs text-[#8E9BB4] font-sans">
            Ready to execute. Click above to brainstorm tactics or choose an execution mode below.
          </p>
        )}
      </div>
    );
  }

  const sorted = [...data.steps].sort((a, b) => a.index - b.index);

  return (
    <div className="glass-card border border-white/5 rounded-xl p-6 space-y-5" data-tour="task-run-feed">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" /> Live Autonomous War-Room
          {active && <Loader2 className="w-3.5 h-3.5 text-[#00F0FF] animate-spin" />}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={triggerSquadBrainstorm}
            disabled={brainstorming}
            className="border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 h-7 text-[10px] font-mono uppercase"
          >
            {brainstorming ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {brainstorm ? 'Re-Brainstorm Squad' : 'Squad Brainstorm'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadReceipt}
            className="border-white/10 text-white h-7 text-[10px] font-mono uppercase"
          >
            <Download className="w-3 h-3 mr-1" /> Proof Receipt
          </Button>
        </div>
      </div>

      {/* Live Squad Brainstorm Strategy Panel */}
      {brainstorm && <BrainstormPanel brainstorm={brainstorm} />}

      {/* Live Step-By-Step Execution Log */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono font-bold text-[#8E9BB4] uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3 text-[#FFD700]" /> Autonomous Execution & Deliverables Stream:
        </div>
        {sorted.map((step) => {
          const meta = STATUS_META[step.status] ?? {
            icon: Clock,
            classes: 'text-muted-foreground bg-white/5 border-white/10',
            label: step.status,
          };
          const Icon = meta.icon;
          const duration = formatDuration(step.durationMs);
          const artifact = data.artifacts.find((a) => a.stepIndex === step.index);
          const isOpen = expanded.has(step.index);

          return (
            <div
              key={`${step.index}-${step.finishedAt ?? step.at ?? 'pending'}`}
              className={`rounded-lg border p-3.5 transition-all ${
                step.status === 'blocked'
                  ? 'border-yellow-500/20 bg-yellow-500/[0.04]'
                  : 'border-white/5 bg-black/40 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${meta.classes}`}
                >
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[55%]">
                  {step.title ?? `Step ${step.index + 1}`}
                </span>
                {step.action && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[#8E9BB4] border border-white/10">
                    {step.action}
                  </span>
                )}
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${meta.classes}`}>
                  {meta.label}
                </span>
                {step.status === 'done' && (
                  <span className="text-[8px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-green-400" /> Turnkey Verified
                  </span>
                )}
                {duration && <span className="text-[9px] font-mono text-[#8E9BB4] ml-auto">{duration}</span>}
              </div>

              <p
                className={`text-[11px] font-mono mt-2 whitespace-pre-wrap break-words text-[#B0B0C8] ${
                  isOpen ? '' : 'line-clamp-2'
                }`}
              >
                {step.output || '(no output recorded)'}
              </p>

              {step.output.length > 140 && (
                <button
                  onClick={() => toggle(step.index)}
                  className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-mono text-[#00F0FF] hover:text-white"
                >
                  {isOpen ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Show full <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}

              {artifact && <EvidenceChips artifact={artifact} />}

              {step.startedAt && (
                <p className="text-[9px] font-mono text-[#8E9BB4]/70 mt-1.5">
                  {new Date(step.startedAt).toLocaleTimeString()}
                  {step.finishedAt ? ` → ${new Date(step.finishedAt).toLocaleTimeString()}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrainstormPanel({ brainstorm }: { brainstorm: BrainstormData }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-[#00F0FF]/30 bg-gradient-to-br from-[#00F0FF]/10 via-black/60 to-[#FFD700]/10 p-4 text-left">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">
            Squad Brainstorm & Consensus Strategy
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-mono text-[#8E9BB4] hover:text-white inline-flex items-center gap-0.5"
        >
          {isOpen ? 'Collapse' : 'Expand'} {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <p className="text-xs font-sans text-[#E0E7FF] mb-3 leading-relaxed">
        🎯 <strong>Consensus:</strong> {brainstorm.consensusStrategy}
      </p>

      {isOpen && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          {/* Squad Dialogue Bubbles */}
          <div className="space-y-2">
            {brainstorm.dialogue.map((msg, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-[11px]">
                <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                  <span className="font-bold text-[#00F0FF] uppercase">
                    🤖 {msg.speaker} ({msg.roleTitle})
                  </span>
                  <span className="text-[#8E9BB4] italic">💭 {msg.thought}</span>
                </div>
                <p className="text-white font-sans leading-relaxed">"{msg.proposal}"</p>
              </div>
            ))}
          </div>

          {/* Key Tactics */}
          {brainstorm.keyTactics.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase block mb-1">
                ⚡ Tactical Plan:
              </span>
              <ul className="space-y-1">
                {brainstorm.keyTactics.map((tactic, i) => (
                  <li key={i} className="text-[10px] font-mono text-[#CCD6F6] flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {tactic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
