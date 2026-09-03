'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, CheckCircle2, Shield, ShieldCheck, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown, ExternalLink, Lightbulb, Rocket, Star, Trophy, Bot, Zap, Wrench, Loader2, FileText, Mail, Share2, Search, Mic, Video, Briefcase, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
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
import { SectionHelpBanner } from '@/components/guide/section-help-banner';
import { AutonomousMilestonesTimeline } from '@/components/execution/AutonomousMilestonesTimeline';
import { ArtifactsVault } from '@/components/execution/ArtifactsVault';
import { SalesPipelineCard } from '@/components/execution/SalesPipelineCard';
import { LiveLogTerminal } from '@/components/execution/LiveLogTerminal';
import { LogSaleModal } from '@/components/execution/LogSaleModal';
import { BrainstormModal } from '@/components/earn/brainstorm-modal';

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
  VOICE: { label: 'Voice Note', icon: Mic },
  VIDEO: { label: 'Video Package', icon: Video },
  SALES: { label: 'Sales Campaign', icon: Briefcase },
  BRAINSTORM: { label: 'Squad Strategy', icon: Sparkles },
};

function extractStepSiteInfo(step: any, task: any) {
  const text = `${step?.title ?? ''} ${step?.description ?? ''} ${task?.title ?? ''}`.toLowerCase();

  const toolLinks: { name: string; url: string }[] = (() => {
    try {
      return typeof task?.toolLinks === 'string' ? JSON.parse(task.toolLinks) : (task?.toolLinks ?? []);
    } catch {
      return [];
    }
  })();

  if (toolLinks.length > 0) {
    const matched = toolLinks.find((tl) => text.includes(tl.name.toLowerCase()) || text.includes(tl.url.toLowerCase()));
    if (matched) {
      return {
        siteName: matched.name,
        siteUrl: matched.url.startsWith('http') ? matched.url : `https://${matched.url}`,
        instruction: `Go to ${matched.name} and execute the setup or configuration required for this step.`,
      };
    }
  }

  if (text.includes('vapi')) {
    return {
      siteName: 'Vapi AI',
      siteUrl: 'https://vapi.ai',
      instruction: 'Go to Vapi AI (https://vapi.ai) to create an account, provision a virtual phone number, and configure your assistant prompt.',
    };
  }
  if (text.includes('retell')) {
    return {
      siteName: 'Retell AI',
      siteUrl: 'https://retellai.com',
      instruction: 'Go to Retell AI (https://retellai.com) to deploy a low-latency conversational voice agent.',
    };
  }
  if (text.includes('polymarket')) {
    return {
      siteName: 'Polymarket',
      siteUrl: 'https://polymarket.com',
      instruction: 'Go to Polymarket (https://polymarket.com) to inspect active prediction markets, verify orderbook liquidity, and stage your trade ticket.',
    };
  }
  if (text.includes('reddit')) {
    return {
      siteName: 'Reddit',
      siteUrl: 'https://reddit.com',
      instruction: 'Go to Reddit (https://reddit.com) and search target subreddits to mine organic complaints, tool requests, and customer pain points.',
    };
  }
  if (text.includes('twitter') || text.includes(' x ') || text.includes('x.com')) {
    return {
      siteName: 'X / Twitter',
      siteUrl: 'https://x.com',
      instruction: 'Go to X / Twitter (https://x.com) to engage with prospect threads, publish the launch post, and initiate direct messages.',
    };
  }
  if (text.includes('github')) {
    return {
      siteName: 'GitHub',
      siteUrl: 'https://github.com',
      instruction: 'Go to GitHub (https://github.com) to clone the starter template repository and configure environment secrets.',
    };
  }
  if (text.includes('stripe')) {
    return {
      siteName: 'Stripe Dashboard',
      siteUrl: 'https://dashboard.stripe.com',
      instruction: 'Go to Stripe Dashboard (https://dashboard.stripe.com) to create your payment link or recurring subscription product.',
    };
  }
  if (text.includes('tiktok')) {
    return {
      siteName: 'TikTok Studio',
      siteUrl: 'https://www.tiktok.com/creator-center',
      instruction: 'Go to TikTok Creator Center to upload your 9:16 short-form video with the generated script, sound, and hashtags.',
    };
  }
  if (text.includes('youtube') || text.includes('shorts')) {
    return {
      siteName: 'YouTube Studio',
      siteUrl: 'https://studio.youtube.com',
      instruction: 'Go to YouTube Studio (https://studio.youtube.com) to publish the video asset as a YouTube Short with title & description.',
    };
  }
  if (text.includes('resend') || text.includes('sendgrid')) {
    return {
      siteName: 'Resend / Email Provider',
      siteUrl: 'https://resend.com',
      instruction: 'Go to your email provider (https://resend.com) to verify your sending domain and monitor delivery rates.',
    };
  }
  if (text.includes('elevenlabs')) {
    return {
      siteName: 'ElevenLabs',
      siteUrl: 'https://elevenlabs.io',
      instruction: 'Go to ElevenLabs (https://elevenlabs.io) to generate customized voice cloning or hyper-realistic audio voiceovers.',
    };
  }
  if (text.includes('capcut')) {
    return {
      siteName: 'CapCut Web',
      siteUrl: 'https://www.capcut.com',
      instruction: 'Go to CapCut (https://www.capcut.com) to paste the generated script, apply auto-captions, and render the final 9:16 clip.',
    };
  }

  return null;
}

function getStepExecutionDirections(step: any, task: any, index: number) {
  const action = (step?.action ?? 'execute').toLowerCase();
  const title = step?.title ?? `Step ${index + 1}`;
  const siteInfo = extractStepSiteInfo(step, task);

  if (/scrape|research|analyze|find|gather/i.test(action) || /scrape|research|identify|search/i.test(title)) {
    return {
      actionBadge: 'RESEARCH & DATA EXTRACTION',
      color: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
      objective: `Mine high-intent target data, verified sources, and client pain points for "${task?.title || 'this task'}".`,
      directions: [
        `Identify specific online communities, subreddits, or databases relevant to this niche.`,
        `Search for recurring complaints, friction points, or tool requests.`,
        `Extract contact signals (company names, URLs, decision maker profiles) into a structured list.`,
        `Verify demand before building or reaching out.`,
      ],
      aiCapability: 'The AI Companion will automatically search live sources, extract target data, and produce a structured research artifact.',
      siteInfo,
      recommendedTools: ['Google Search', 'Reddit / Twitter Scraper', 'Apollo / Clay / LinkedIn'],
    };
  }

  if (/voice|audio|record|call|speech/i.test(action) || /voice|audio|podcast|call/i.test(title)) {
    return {
      actionBadge: 'VOICE SYNTHESIS & AUDIO OUTREACH',
      color: 'border-[#00F0FF]/30 text-[#00F0FF] bg-[#00F0FF]/10',
      objective: `Synthesize a high-converting spoken voice note or audio demo for client outreach.`,
      directions: [
        `Draft a concise 30-45 second spoken script focusing on rapid value and proof.`,
        `Synthesize the audio note with natural pacing, clear pauses, and an urgent CTA.`,
        `Export the audio waveform or deliver it directly via voicemail / audio DM.`,
      ],
      aiCapability: 'The AI Companion will write the voice script, synthesize the audio with natural pacing, and embed a playable voice note.',
      siteInfo,
      recommendedTools: ['Web Speech TTS', 'ElevenLabs', 'Vapi AI / Retell AI'],
    };
  }

  if (/video|tiktok|youtube|shorts|reels|storyboard/i.test(action) || /video|tiktok|youtube|shorts/i.test(title)) {
    return {
      actionBadge: '9:16 SHORT-FORM VIDEO & VIRAL CONTENT',
      color: 'border-pink-500/30 text-pink-300 bg-pink-500/10',
      objective: `Construct a high-retention 9:16 video script, visual storyboard, and hashtag package.`,
      directions: [
        `Craft a 3-second pattern-interrupt hook (visual + bold text overlay).`,
        `Detail scene-by-scene visual descriptions, voiceover lines, and on-screen overlays.`,
        `Add curiosity-driven post caption and viral niche hashtags.`,
        `Publish to TikTok, YouTube Shorts, and Instagram Reels for organic reach.`,
      ],
      aiCapability: 'The AI Companion will generate the complete viral storyboard, scene breakdown, text overlays, and copyable script.',
      siteInfo,
      recommendedTools: ['CapCut', 'Remotion', 'Canva / OpusClip'],
    };
  }

  if (/sales|outreach|pitch|close|offer|email|dm/i.test(action) || /sales|outreach|pitch|email|message/i.test(title)) {
    return {
      actionBadge: 'SALES & CLIENT ACQUISITION',
      color: 'border-green-500/30 text-green-300 bg-green-500/10',
      objective: `Deploy multi-touch outreach sequences and close paying clients.`,
      directions: [
        `Segment qualified buyer personas into high-ticket decision makers.`,
        `Deploy a personalized initial touchpoint (Email or Twitter/LinkedIn DM) referencing real proof.`,
        `Follow up 48 hours later with a sample result or short video walkthrough.`,
        `Present the clear setup + monthly retainer offer and handle common objections.`,
      ],
      aiCapability: 'The AI Companion will craft tailored cold emails, DM sequences, pricing packages, and objection rebuttal scripts.',
      siteInfo,
      recommendedTools: ['SendGrid / Resend', 'Twitter / LinkedIn DMs', 'Stripe Invoicing'],
    };
  }

  return {
    actionBadge: 'TACTICAL EXECUTION & BUILD',
    color: 'border-[#FFD700]/30 text-[#FFD700] bg-[#FFD700]/10',
    objective: `Execute this step to produce a concrete deliverable and proof artifact.`,
    directions: [
      `Review previous step results and assets.`,
      `Implement the core workflow or scaffold the deliverable.`,
      `Save and verify the deliverable artifact before moving to the next phase.`,
    ],
    aiCapability: 'The AI Companion will run the pipeline step, generate code or deliverables, and stamp proof-of-work receipts.',
    siteInfo,
    recommendedTools: ['Next.js / TypeScript', 'Open APIs', 'Vercel / Cloudflare'],
  };
}

export function TaskDetailClient({ task, userTask: initialUserTask, stories, artifacts = [] }: Props) {
  const [userTask, setUserTask] = useState(initialUserTask);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [optedIn, setOptedIn] = useState(initialUserTask?.hasOptedInRisk ?? false);
  const [voting, setVoting] = useState(false);
  const [voteState, setVoteState] = useState<{ up: number; down: number }>({
    up: task?.upvotes ?? 0,
    down: task?.downvotes ?? 0,
  });

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(initialUserTask?.status === 'COMPLETED');
  const [isSwarmModalOpen, setIsSwarmModalOpen] = useState(false);

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

  const startCompanion = async (mode: 'DIY' | 'CO_PILOT' | 'AUTOPILOT', stepIndex?: number) => {
    setStartingMode(mode);
    try {
      const res = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task?.id, mode, stepIndex }),
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
      if (mode === 'CO_PILOT') toast.success(`Co-pilot executed step ${(stepIndex ?? 0) + 1}.`);
      await refreshStatus();
    } catch {
      toast.error('Failed to reach the engine');
    } finally {
      setStartingMode(null);
    }
  };

  const companionActive = ['STEP_EXECUTING', 'PENDING_APPROVAL'].includes(companionState?.status ?? '');

  // ---- Autonomous End-to-End Engine State ----
  const [autonomousPlan, setAutonomousPlan] = useState<any>(null);
  const [artifactsList, setArtifactsList] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [isLogSaleOpen, setIsLogSaleOpen] = useState(false);

  const fetchAutonomousData = useCallback(async () => {
    if (!task?.id) return;
    try {
      const [planRes, artRes, leadsRes] = await Promise.all([
        fetch(`/api/tasks/${task.id}/execution-plan`),
        fetch(`/api/tasks/${task.id}/artifacts`),
        fetch(`/api/tasks/${task.id}/leads`),
      ]);

      const [planData, artData, leadsData] = await Promise.all([
        planRes.json(),
        artRes.json(),
        leadsRes.json(),
      ]);

      if (planData.success) setAutonomousPlan(planData.plan);
      if (artData.success) setArtifactsList(artData.artifacts);
      if (leadsData.success) setLeadsList(leadsData.leads);
    } catch (e) {}
  }, [task?.id]);

  useEffect(() => {
    fetchAutonomousData();
  }, [fetchAutonomousData]);

  const handleAutonomousExecute = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Autonomous swarm running milestones!');
        await fetchAutonomousData();
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch (e) {
      toast.error('Network error starting autonomous execution');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAutonomousPause = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/pause`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.info('Autonomous execution paused.');
        await fetchAutonomousData();
      }
    } catch (e) {
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAutonomousResume = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/resume`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Autonomous swarm resumed.');
        await fetchAutonomousData();
      }
    } catch (e) {
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSelectSalesOption = async (option: 'BOT_SELLS' | 'YOU_SELL' | 'HYBRID') => {
    setPlanLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/sales-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sales execution mode set to ${option.replace('_', ' ')}!`);
        await fetchAutonomousData();
      }
    } catch (e) {
      toast.error('Failed to set sales option');
    } finally {
      setPlanLoading(false);
    }
  };

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
          <p className="text-[#B0B0C8] text-sm mb-4">{task?.description ?? ''}</p>

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsSwarmModalOpen(true)}
                className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 font-mono shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" /> Deploy AI Swarm
              </Button>
              <Link href="/earn">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-[#8E9BB4] hover:text-white font-mono text-xs h-9 px-3"
                >
                  Explore 9 Earn Methods &rarr;
                </Button>
              </Link>
            </div>
            <span className="text-[11px] font-mono text-[#00F0FF]">
              Autonomously dispatches parallel builders + sales scout
            </span>
          </div>
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

        {/* Section Guide & Tactical Help */}
        <SectionHelpBanner />

        {/* 100% Autonomous Turnkey Execution Guarantee */}
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-950/30 via-black/60 to-[#00F0FF]/10 p-5 shadow-[0_0_25px_rgba(34,197,94,0.12)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <h4 className="font-orbitron font-bold text-xs uppercase text-white tracking-wider">
                  100% Autonomous Turnkey Completion Guarantee
                </h4>
                <span className="text-[9px] font-mono font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                  ENFORCED
                </span>
              </div>
              <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed">
                Your AI bot is strictly bound to execute every single step to full completion — with <strong>ZERO placeholders, full working code, complete outreach copy, and actionable production deliverables</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-[#8E9BB4]">
              <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 text-green-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Multi-Pass QA
              </span>
              <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 text-[#00F0FF]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" /> Self-Correcting
              </span>
            </div>
          </div>
        </div>

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

        {/* Autonomous 7-Milestone Execution Engine */}
        {autonomousPlan && (
          <AutonomousMilestonesTimeline
            milestones={autonomousPlan.milestones || []}
            currentMilestone={autonomousPlan.currentMilestone || 1}
            progress={autonomousPlan.progress || 0}
            planStatus={autonomousPlan.status || 'IN_PROGRESS'}
            onExecute={handleAutonomousExecute}
            onPause={handleAutonomousPause}
            onResume={handleAutonomousResume}
            onSelectOption={handleSelectSalesOption}
            loading={planLoading}
          />
        )}

        {/* Buyer Leads & Sales Pipeline Option Selector */}
        <SalesPipelineCard
          taskId={task.id}
          leads={leadsList}
          currentOption={autonomousPlan?.salesOption}
          onSelectOption={handleSelectSalesOption}
          onOpenLogSale={() => setIsLogSaleOpen(true)}
          loading={planLoading}
        />

        {/* Generated Assets & Deliverable Vault */}
        <ArtifactsVault artifacts={artifactsList} />

        {/* Live Swarm Terminal & Immutable Audit Logs */}
        <LiveLogTerminal taskId={task.id} />

        {/* Quick Log Sale Modal */}
        <LogSaleModal
          taskId={task.id}
          isOpen={isLogSaleOpen}
          onClose={() => setIsLogSaleOpen(false)}
          onSuccess={fetchAutonomousData}
        />

        {/* Step-by-Step Action Plan with Interactive Directions */}
        <div className="glass-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gold" /> Step-by-Step Action Plan
            </h3>
            <span className="text-[11px] font-mono text-[#8E9BB4]">
              💡 Click any step to expand execution directions & AI automation
            </span>
          </div>

          <div className="space-y-3">
            {(parsedSteps.length > 0 ? parsedSteps : (steps ?? []).map((s: string, idx: number) => ({ title: s, action: 'execute', description: '', index: idx }))).map((stepItem: any, i: number) => {
              const stepTitle = stepItem.title || (typeof stepItem === 'string' ? stepItem : `Step ${i + 1}`);
              const isDone = i < stepsCompleted;
              const isExpanded = expandedStep === i;
              const directions = getStepExecutionDirections(stepItem, task, i);

              return (
                <div
                  key={i}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isDone
                      ? 'bg-green-500/[0.04] border-green-500/20'
                      : isExpanded
                      ? 'bg-black/60 border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                      : 'bg-[#11111E]/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Step Header Row (Clickable) */}
                  <div
                    onClick={() => setExpandedStep(isExpanded ? null : i)}
                    className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (userTask) handleStepComplete(i);
                        }}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-white/20 hover:border-gold text-muted-foreground'
                        }`}
                        disabled={!userTask || i !== stepsCompleted}
                        title={isDone ? 'Step Completed' : 'Click to complete manually'}
                      >
                        {isDone ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs font-bold font-mono">{i + 1}</span>}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-sm font-bold truncate ${isDone ? 'text-green-400 line-through' : 'text-[#F3F3F5]'}`}>
                            {stepTitle}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${directions.color}`}>
                            {directions.actionBadge}
                          </span>
                        </div>
                        {stepItem.description && (
                          <p className="text-xs text-[#8E9BB4] line-clamp-1 font-sans">
                            {stepItem.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDone && (
                        <span className="text-[10px] font-mono text-green-400 uppercase font-bold hidden sm:inline-block">
                          Completed
                        </span>
                      )}
                      <span className="text-[#8E9BB4]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Step Directions & Execution Blueprint */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3.5 bg-black/40 text-left">
                      {/* Step Objective */}
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase block mb-1">
                          🎯 Step Objective:
                        </span>
                        <p className="text-xs text-[#E0E7FF] font-sans leading-relaxed">
                          {directions.objective}
                        </p>
                      </div>

                      {/* Website / Platform Action Card (if step requires visiting external site) */}
                      {directions.siteInfo && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-[#00F0FF]/10 via-black/50 to-purple-500/10 border border-[#00F0FF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#00F0FF] mb-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Direct Platform Link: {directions.siteInfo.siteName}</span>
                            </div>
                            <p className="text-[11px] text-[#CCD6F6] font-sans">
                              {directions.siteInfo.instruction}
                            </p>
                          </div>
                          <a
                            href={directions.siteInfo.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/40 text-[#00F0FF] hover:text-white text-xs font-mono font-bold transition-all shrink-0"
                          >
                            Open {directions.siteInfo.siteName} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* AI Companion Assistance Card */}
                      <div className="p-3 rounded-lg bg-gradient-to-r from-[#FFD700]/10 via-black/50 to-green-500/10 border border-[#FFD700]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#FFD700] mb-1">
                            <Bot className="w-3.5 h-3.5 text-[#FFD700]" />
                            <span>Let AI Assistant Assist & Execute</span>
                          </div>
                          <p className="text-[11px] text-[#CCD6F6] font-sans">
                            {directions.aiCapability}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => startCompanion('CO_PILOT', i)}
                          disabled={startingMode !== null}
                          className="cyan-gradient text-black font-extrabold uppercase text-[11px] h-8 px-3.5 font-mono shadow-[0_0_15px_rgba(0,240,255,0.25)] shrink-0"
                        >
                          {startingMode === 'CO_PILOT' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 mr-1" />
                          )}
                          Have AI Execute Step {i + 1}
                        </Button>
                      </div>

                      {/* Step-by-Step Directions */}
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase block mb-1.5">
                          📋 Step-by-Step Directions:
                        </span>
                        <ul className="space-y-1.5">
                          {directions.directions.map((dir: string, dIdx: number) => (
                            <li key={dIdx} className="text-xs text-[#CCD6F6] font-sans flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-white/5 text-[#00F0FF] font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                {dIdx + 1}
                              </span>
                              <span>{dir}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Tools & Manual Mark Complete */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">Tools & Stack:</span>
                          {directions.recommendedTools.map((tool: string, tIdx: number) => (
                            <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white border border-white/10">
                              {tool}
                            </span>
                          ))}
                        </div>

                        {/* Manual Checkoff Button */}
                        {userTask && !isDone && i === stepsCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStepComplete(i)}
                            className="border-white/10 hover:border-green-400 text-white h-8 text-[11px] font-mono uppercase"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-400" />
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

        {/* Live Work Log & Squad War Room */}
        <RunFeed userTaskId={userTask?.id ?? null} taskId={task?.id} active={companionActive} />

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

        {/* AI Brainstorm Chamber Modal */}
        <BrainstormModal
          isOpen={isSwarmModalOpen}
          onClose={() => setIsSwarmModalOpen(false)}
          taskId={task?.id}
          trendTitle={task?.title}
        />
      </motion.div>
    </div>
  );
}
