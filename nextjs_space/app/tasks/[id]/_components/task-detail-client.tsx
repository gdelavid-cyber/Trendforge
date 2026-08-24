'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Shield, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown, ExternalLink, Lightbulb, Rocket, Star, Trophy, Bot, Zap, Wrench, Loader2, FileText, Mail, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RISK_CONFIG } from '@/lib/constants';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { completePowerMoveAction } from '@/app/actions';
import { parseSteps } from '@/lib/tasks/steps';
import { RunFeed } from './run-feed';

interface Props {
  task: any;
  userTask: any;
  stories: { id: string; earningsAmount: number; description: string; userName: string }[];
  artifacts?: { id: string; stepIndex: number; kind: string; name: string; url: string | null; createdAt: string | null }[];
}

const ARTIFACT_META: Record<string, { label: string; icon: typeof FileText }> = {
  FILE: { label: 'File', icon: FileText },
  EMAIL: { label: 'Email', icon: Mail },
  POST: { label: 'Post', icon: Share2 },
  TRADE: { label: 'Trade', icon: TrendingUp },
  RESEARCH: { label: 'Research', icon: Search },
};

export function TaskDetailClient({ task, userTask: initialUserTask, stories, artifacts = [] }: Props) {
  const [userTask, setUserTask] = useState(initialUserTask);
  const [optedIn, setOptedIn] = useState(initialUserTask?.hasOptedInRisk ?? false);
  const [voting, setVoting] = useState(false);
  const [voteState, setVoteState] = useState<{ up: number; down: number }>({
    up: task?.upvotes ?? 0,
    down: task?.downvotes ?? 0,
  });

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(initialUserTask?.status === 'COMPLETED');

  const risk = RISK_CONFIG[(task?.riskLevel ?? 'LOW') as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.LOW;
  const parsedSteps = (() => { try { return parseSteps(task?.steps); } catch { return []; } })();
  const steps: string[] = parsedSteps.map((s) => s.title);
  const toolLinks: { name: string; url: string }[] = (() => { try { return typeof task?.toolLinks === 'string' ? JSON.parse(task.toolLinks) : (task?.toolLinks ?? []); } catch { return []; } })();
  const isHighRisk = task?.riskLevel === 'HIGH';
  const canLaunch = !isHighRisk || optedIn;

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'ZERO': return '⭐';
      case 'LOW': return '⭐⭐';
      case 'MEDIUM': return '⭐⭐⭐';
      case 'HIGH': return '⭐⭐⭐⭐';
      default: return '⭐⭐';
    }
  };

  const handleLaunch = async () => {
    try {
      const res = await fetch(`/api/tasks/${task?.id}/launch`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUserTask(data?.userTask ?? { status: 'IN_PROGRESS', stepsCompleted: 0 });
        toast.success('Power Move initiated! Execute the action steps below.');
      } else {
        toast.error(data?.error ?? 'Failed to initiate');
      }
    } catch {
      toast.error('Failed to initiate Power Move');
    }
  };

  const handleStepComplete = async (stepIdx: number) => {
    try {
      const res = await fetch(`/api/tasks/${task?.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepsCompleted: stepIdx + 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserTask(data?.userTask ?? userTask);
        toast.success(`Action step ${stepIdx + 1} completed!`);
      }
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const handleCompleteMove = async () => {
    setClaiming(true);
    try {
      const res = await completePowerMoveAction(task.id);
      if (res.success) {
        setClaimed(true);
        toast.success('Power Move marked complete. Nice work.');
        setUserTask({ ...userTask, status: 'COMPLETED', stepsCompleted: totalSteps });
      } else {
        toast.error(res.error ?? 'Failed to mark complete');
      }
    } catch {
      toast.error('Failed to update task');
    } finally {
      setClaiming(false);
    }
  };

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/tasks/${task?.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: type }),
      });
      const data = await res.json();
      if (res.ok) setVoteState({ up: data?.upvotes ?? voteState.up, down: data?.downvotes ?? voteState.down });
    } catch {} finally { setVoting(false); }
  };

  const handleOptIn = async () => {
    try {
      const res = await fetch(`/api/tasks/${task?.id}/opt-in`, { method: 'POST' });
      if (res.ok) {
        setOptedIn(true);
        toast.success('Risk guidelines acknowledged.');
      }
    } catch {}
  };

  const stepsCompleted = userTask?.stepsCompleted ?? 0;
  const totalSteps = steps?.length ?? 0;
  const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

  // ---- Companion execution (S2) ----
  const [companionState, setCompanionState] = useState<{
    status?: string; currentStep?: number; pendingApproval?: { id: string; action: { title?: string } } | null;
  } | null>(null);
  const [startingMode, setStartingMode] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/status?taskId=${task?.id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.userTask) {
        setCompanionState({ status: body.userTask.status, currentStep: body.userTask.currentStep, pendingApproval: body.pendingApproval });
        setUserTask((prev: any) => prev ?? body.userTask);
      }
    } catch {}
  }, [task?.id]);

  useEffect(() => {
    if (!userTask) return;
    refreshStatus();
  }, [userTask?.id, refreshStatus]);

  useEffect(() => {
    const live = companionState?.status === 'STEP_EXECUTING' || companionState?.status === 'PENDING_APPROVAL';
    if (live && !pollRef.current) {
      pollRef.current = setInterval(refreshStatus, 4000);
    } else if (!live && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [companionState?.status, refreshStatus]);

  const startCompanion = async (mode: 'DIY' | 'CO_PILOT' | 'AUTOPILOT') => {
    setStartingMode(mode);
    try {
      const res = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task?.id, mode }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        toast.error(data?.error ?? `Failed to start ${mode}`);
        return;
      }
      if (res.status === 409 && mode !== 'AUTOPILOT') {
        toast.info('Already running');
      }
      if (mode === 'AUTOPILOT') toast.success('Autopilot engaged — your companion is on it.');
      if (mode === 'CO_PILOT') toast.success('Co-pilot executed the next step.');
      await refreshStatus();
    } catch {
      toast.error('Failed to reach the engine');
    } finally {
      setStartingMode(null);
    }
  };

  const companionActive = ['STEP_EXECUTING', 'PENDING_APPROVAL'].includes(companionState?.status ?? '');

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="glass-card border border-white/5 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <TrendCategoryBadge category={task?.category ?? 'OTHER'} />
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-gold/10 text-gold border border-gold/10">
              Difficulty: {getDifficultyStars(task?.difficulty)}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${risk?.bg} ${risk?.text}`}>
              <Shield className="w-3 h-3 mr-1" />{risk?.label}
            </span>
            {task?.isVerified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-green-500/20 text-green-400">
                ✓ VERIFIED WIN PIPELINE
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white uppercase tracking-wider mb-2">
            {task?.title ?? 'Power Move'}
          </h1>
          <p className="text-[#B0B0C8] text-sm">{task?.description ?? ''}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card border border-white/5 rounded-xl p-4 font-mono-stats">
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-widest block mb-1">Setup Cost</span>
            <div className="text-xl font-bold text-white">${task?.startupCost ?? 0}</div>
          </div>
          <div className="glass-card border border-white/5 rounded-xl p-4 font-mono-stats">
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-widest block mb-1">Target Earnings (estimate)</span>
            <div className="text-xl font-bold text-green-400">+${task?.estimatedEarningsLow}-${task?.estimatedEarningsHigh}</div>
          </div>
          <div className="glass-card border border-white/5 rounded-xl p-4 font-mono-stats">
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-widest block mb-1">Bandwidth Duration</span>
            <div className="text-xl font-bold text-blue-400">{task?.timeToFirstDollar ?? '1-7 days'}</div>
          </div>
          <div className="glass-card border border-white/5 rounded-xl p-4 font-mono-stats">
            <div className="flex gap-4 mb-1">
              <button onClick={() => handleVote('UP')} className="flex items-center gap-1 text-sm hover:text-green-400 transition-colors">
                <ThumbsUp className="w-4 h-4" /> {voteState.up}
              </button>
              <button onClick={() => handleVote('DOWN')} className="flex items-center gap-1 text-sm hover:text-red-400 transition-colors">
                <ThumbsDown className="w-4 h-4" /> {voteState.down}
              </button>
            </div>
            <span className="text-xs text-muted-foreground uppercase font-mono tracking-widest block">Operator Rating</span>
          </div>
        </div>

        {/* Risk Warning */}
        {isHighRisk && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-black text-red-400 mb-1 uppercase">RISK MITIGATION DIRECTIVE</h3>
                <p className="text-sm text-red-300 mb-2">{task?.riskExplanation ?? ''}</p>
                <p className="text-sm text-muted-foreground mb-3"><strong>Protocol:</strong> {task?.mitigationStrategy ?? ''}</p>
                {!optedIn && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="risk-optin" onCheckedChange={() => handleOptIn()} />
                    <label htmlFor="risk-optin" className="text-xs font-bold text-red-300 cursor-pointer uppercase font-mono tracking-wide">
                      Acknowledge guidelines and unlock move
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Panel: Companion modes + Launch & Step tracker */}
        <div className="glass-card border border-[#00F0FF]/20 rounded-xl p-6" data-tour="task-modes">
          <h3 className="font-display font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#00F0FF]" /> Run With Your Companion
          </h3>

          {companionActive && (
            <div className="mb-5 rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/[0.06] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Loader2 className="w-4 h-4 text-[#00F0FF] animate-spin shrink-0" />
                <span className="text-xs font-mono text-white truncate">
                  {companionState?.status === 'PENDING_APPROVAL'
                    ? 'Paused — waiting for your one-click approval.'
                    : `Working… step ${(companionState?.currentStep ?? 0) + 1} of ${totalSteps}`}
                </span>
              </div>
              {companionState?.pendingApproval && (
                <Link href="/approvals">
                  <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-3 holographic-btn">
                    Review & Approve
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!userTask ? (
            <div className="text-center space-y-4">
              <Rocket className="w-8 h-8 text-gold mx-auto animate-bounce" />
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">Initialize Power Move</h3>
                <p className="text-xs text-muted-foreground mt-1">Pick how hands-on you want to be.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
                <button
                  disabled={!canLaunch || startingMode !== null}
                  onClick={() => startCompanion('DIY')}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-gold/40 transition-colors disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4 text-gold mb-2" />
                  <div className="text-xs font-mono font-bold uppercase text-white">DIY</div>
                  <div className="text-[10px] text-muted-foreground mt-1">You execute; companion advises.</div>
                </button>
                <button
                  disabled={!canLaunch || startingMode !== null}
                  onClick={() => startCompanion('CO_PILOT')}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-[#00F0FF]/40 transition-colors disabled:opacity-50"
                >
                  {startingMode === 'CO_PILOT' ? <Loader2 className="w-4 h-4 text-[#00F0FF] mb-2 animate-spin" /> : <Zap className="w-4 h-4 text-[#00F0FF] mb-2" />}
                  <div className="text-xs font-mono font-bold uppercase text-white">Co-pilot</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Companion runs each step on demand.</div>
                </button>
                <button
                  disabled={!canLaunch || startingMode !== null}
                  onClick={() => startCompanion('AUTOPILOT')}
                  className="relative rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/[0.05] p-4 text-left hover:border-[#00F0FF] transition-colors disabled:opacity-50"
                >
                  {startingMode === 'AUTOPILOT' ? <Loader2 className="w-4 h-4 text-[#00F0FF] mb-2 animate-spin" /> : <Bot className="w-4 h-4 text-[#00F0FF] mb-2" />}
                  <div className="text-xs font-mono font-bold uppercase text-[#00F0FF]">Autopilot</div>
                  <div className="text-[10px] text-muted-foreground mt-1">One click. It does the rest.</div>
                </button>
              </div>
              <div className="flex justify-center gap-3">
                <Button className="gold-gradient text-black font-extrabold holographic-btn rounded h-10" disabled={!canLaunch} onClick={handleLaunch}>
                  <Rocket className="w-4 h-4 mr-2" /> Initiate Manual Move
                </Button>
                <Link href={`/launch/${task?.id}`}>
                  <Button variant="outline" className="border-white/10 text-white rounded h-10">Open Sandbox Console</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase">
                <span className="text-gold font-bold">Execution Progress</span>
                <span className="text-muted-foreground">{stepsCompleted}/{totalSteps} steps completed</span>
              </div>
              <Progress value={progress} className="h-3 mb-4 bg-dark-navy" />
              <Link href={`/launch/${task?.id}`}>
                <Button variant="outline" size="sm" className="border-white/10 text-white rounded h-9 flex items-center gap-1.5">
                  Open Sandbox Console <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 5-Step Plan */}
        <div className="glass-card border border-white/5 rounded-xl p-6">
          <h3 className="font-display font-black text-lg text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gold" /> Step-by-Step Action Plan
          </h3>
          <div className="space-y-3">
            {(steps ?? []).map((step: string, i: number) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                i < stepsCompleted ? 'bg-green-500/5 border-green-500/10' : 'bg-[#11111E]/30 border-white/5'
              }`}>
                <button
                  onClick={() => userTask && handleStepComplete(i)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    i < stepsCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 hover:border-gold text-muted-foreground'
                  }`}
                  disabled={!userTask || i !== stepsCompleted} // Only allow complete sequentially
                >
                  {i < stepsCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  {i >= stepsCompleted && <span className="text-[10px] font-bold font-mono">{i + 1}</span>}
                </button>
                <span className={`text-sm ${i < stepsCompleted ? 'text-green-400 line-through' : 'text-[#F3F3F5]'}`}>{step}</span>
              </div>
            ))}
          </div>

          {/* Honest Completion Section */}
          {userTask && !claimed && stepsCompleted === totalSteps && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 border-t border-white/5 pt-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-gold" /> Mark This Move Complete
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Records that you finished the work. Trendly does not track task income — if this
                  move earns you money, that payment happens outside the platform and only real
                  ledger activity (deposits, trade proceeds, battle pots) is ever shown as income.
                </p>
              </div>
              <Button onClick={handleCompleteMove} disabled={claiming} className="cyan-gradient text-black font-extrabold uppercase holographic-btn w-full md:w-auto px-6 h-10 rounded">
                {claiming ? 'Processing...' : 'Mark Complete'}
              </Button>
            </motion.div>
          )}

          {claimed && (
            <div className="mt-6 border-t border-[#00F0FF]/20 pt-6 text-center bg-[#00F0FF]/5 border rounded-lg p-5">
              <CheckCircle className="w-8 h-8 text-[#00F0FF] mx-auto mb-2 animate-pulse" />
              <h4 className="font-display font-black text-[#00F0FF] uppercase tracking-wider text-base">Power Move Complete</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Work recorded. Any money you made on this happens outside Trendly — fund an agent
                wallet to track real platform-side money on the ledger.
              </p>
            </div>
          )}
        </div>

        {/* Live Work Log — real-time proof of what the companion actually did */}
        {userTask?.id && (
          <RunFeed userTaskId={userTask.id} active={companionActive} />
        )}

        {/* Actual Outputs — real artifacts the companion produced */}
        {artifacts.length > 0 && (
          <div className="glass-card border border-green-500/20 rounded-xl p-6" data-tour="task-outputs">
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-400" /> Actual Outputs
              <span className="text-[10px] font-mono font-normal text-muted-foreground normal-case tracking-normal">— real deliverables from this run, nothing simulated</span>
            </h3>
            <div className="space-y-2">
              {artifacts.map((a) => {
                const meta = ARTIFACT_META[a.kind] ?? { label: a.kind, icon: FileText };
                const Icon = meta.icon;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#11111E]/30">
                    <span className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-green-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-white truncate">{a.name || meta.label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">
                        {meta.label} · Step {a.stepIndex + 1}
                      </div>
                    </div>
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="border-white/10 text-white h-8 text-xs">
                          Open <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Tool Links */}
        {(toolLinks?.length ?? 0) > 0 && (
          <div className="glass-card border border-white/5 rounded-xl p-6">
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider mb-3">Recommended Tools</h3>
            <div className="flex flex-wrap gap-3">
              {(toolLinks ?? []).map((tool: any) => (
                <a key={tool?.url} href={tool?.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="border-white/5 hover:border-gold text-xs text-muted-foreground hover:text-white">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> {tool?.name ?? 'Tool'}
                  </Button>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pro Tip */}
        {task?.proTip && (
          <div className="bg-gold/5 border border-gold/15 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-gold flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-sm text-gold uppercase tracking-wider">Tactical Intelligence</h3>
                <p className="text-sm text-[#B0B0C8] mt-1">{task.proTip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Win Stories */}
        {(stories?.length ?? 0) > 0 && (
          <div className="space-y-4">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" /> Verified Win Stories
            </h3>
            <div className="space-y-3">
              {(stories ?? []).map((s: any) => (
                <div key={s.id} className="glass-card border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-bold text-sm text-white">{s.userName}</span>
                    <span className="text-green-400 font-bold ml-auto font-mono">+${(s.earningsAmount ?? 0).toLocaleString('en-US')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center font-mono mt-8 uppercase">
          {task?.disclaimer ?? 'FOR EDUCATIONAL PURPOSES ONLY. FORGE IS NOT LIABLE FOR OPERATIONAL LOSSES.'}
        </p>
      </motion.div>
    </div>
  );
}
