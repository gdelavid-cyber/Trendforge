'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Radio,
  Brain,
  Terminal,
  Sparkles,
  CheckCircle2,
  Play,
  Loader2,
  ShieldCheck,
  Layers,
  Wrench,
  Eye,
  Zap,
  Activity,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface StationModuleInfo {
  id: string;
  name: string;
  zone: string;
  description: string;
  enabled: boolean;
  grantCount: number;
}

interface StationBeliefInfo {
  id: string;
  kind: 'fact' | 'profile';
  content: string;
  confidence: number;
  createdAt: string;
}

interface StationStatusData {
  engine: string;
  version: string;
  modules: StationModuleInfo[];
  grantedTools: string[];
  maxBudgetUsdc: number;
  cortexBeliefsCount: number;
  recentBeliefs: StationBeliefInfo[];
}

interface StationRoomLayout {
  id: string;
  shortName: string;
  zone: string;
  icon: string;
  color: string;
  borderColor: string;
  glowColor: string;
  /** Percentage coordinates on the 2D station deck (0-100) */
  x: number;
  y: number;
}

const STATION_FLOOR_ROOMS: Record<string, StationRoomLayout> = {
  memory_notebook: {
    id: 'memory_notebook',
    shortName: 'Cortex Memory',
    zone: 'COMMAND',
    icon: '🧠',
    color: '#A855F7',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-[0_0_25px_rgba(168,85,247,0.35)]',
    x: 15,
    y: 22,
  },
  signal_dish: {
    id: 'signal_dish',
    shortName: 'Signal Dish',
    zone: 'INTEL',
    icon: '📡',
    color: '#00F0FF',
    borderColor: 'border-[#00F0FF]/60',
    glowColor: 'shadow-[0_0_25px_rgba(0,240,255,0.35)]',
    x: 42,
    y: 18,
  },
  market_radar: {
    id: 'market_radar',
    shortName: 'Quant Radar',
    zone: 'FINANCE',
    icon: '📈',
    color: '#10B981',
    borderColor: 'border-emerald-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    x: 70,
    y: 20,
  },
  crew_beacon: {
    id: 'crew_beacon',
    shortName: 'Crew Beacon',
    zone: 'COMMAND',
    icon: '🛸',
    color: '#F59E0B',
    borderColor: 'border-amber-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    x: 88,
    y: 44,
  },
  command_computer: {
    id: 'command_computer',
    shortName: 'Command Core',
    zone: 'BRIDGE',
    icon: '⚡',
    color: '#00F0FF',
    borderColor: 'border-[#00F0FF]',
    glowColor: 'shadow-[0_0_32px_rgba(0,240,255,0.5)]',
    x: 50,
    y: 48,
  },
  outreach_relay: {
    id: 'outreach_relay',
    shortName: 'Outreach Relay',
    zone: 'GROWTH',
    icon: '📨',
    color: '#EC4899',
    borderColor: 'border-pink-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(236,72,153,0.35)]',
    x: 18,
    y: 76,
  },
  media_studio: {
    id: 'media_studio',
    shortName: 'Media Studio',
    zone: 'GROWTH',
    icon: '🎬',
    color: '#F97316',
    borderColor: 'border-orange-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(249,115,22,0.35)]',
    x: 48,
    y: 80,
  },
  code_workbench: {
    id: 'code_workbench',
    shortName: 'Code Workbench',
    zone: 'ENGINEERING',
    icon: '🛠️',
    color: '#3B82F6',
    borderColor: 'border-blue-500/60',
    glowColor: 'shadow-[0_0_25px_rgba(59,130,246,0.35)]',
    x: 78,
    y: 76,
  },
};

interface VisualAgentState {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  homeModule: string;
  currentModule: string;
  status: 'WORKING' | 'MOVING' | 'SCANNING' | 'EXECUTING';
  bubbleText: string;
  activeTool: string;
  offsetX: number;
  offsetY: number;
}

const INITIAL_AGENTS: VisualAgentState[] = [
  {
    id: 'overseer',
    name: 'Overseer Prime',
    role: 'Station Commander',
    avatar: '🤖',
    color: '#00F0FF',
    homeModule: 'command_computer',
    currentModule: 'command_computer',
    status: 'WORKING',
    bubbleText: 'Orchestrating station crew & verifying postconditions',
    activeTool: 'station.inspect',
    offsetX: 0,
    offsetY: -2,
  },
  {
    id: 'reddit_scraper',
    name: 'Lyra',
    role: 'Signal Scout',
    avatar: '🛰️',
    color: '#38BDF8',
    homeModule: 'signal_dish',
    currentModule: 'signal_dish',
    status: 'SCANNING',
    bubbleText: 'Mining r/SaaS & HackerNews for high-intent B2B pain points',
    activeTool: 'scrape_reddit_painpoints',
    offsetX: -3,
    offsetY: 2,
  },
  {
    id: 'market_analyst',
    name: 'Vega',
    role: 'Quant Analyst',
    avatar: '⚡',
    color: '#10B981',
    homeModule: 'market_radar',
    currentModule: 'market_radar',
    status: 'SCANNING',
    bubbleText: 'Scanning Polymarket & Solana DEX liquidity spreads',
    activeTool: 'polymarket_spread_scanner',
    offsetX: 3,
    offsetY: 1,
  },
  {
    id: 'micro_saas_builder',
    name: 'Orion',
    role: 'SaaS Architect',
    avatar: '🦾',
    color: '#60A5FA',
    homeModule: 'code_workbench',
    currentModule: 'code_workbench',
    status: 'WORKING',
    bubbleText: 'Synthesizing Next.js + Prisma Micro-SaaS blueprint',
    activeTool: 'nextjs_microsaas_builder',
    offsetX: -2,
    offsetY: 2,
  },
  {
    id: 'deal_finder',
    name: 'Kael',
    role: 'Deal Closer',
    avatar: '🎯',
    color: '#F472B6',
    homeModule: 'outreach_relay',
    currentModule: 'outreach_relay',
    status: 'WORKING',
    bubbleText: 'Extracting decision-maker leads & drafting outreach',
    activeTool: 'b2b_lead_extractor',
    offsetX: 2,
    offsetY: -2,
  },
];

const AUTONOMOUS_PATROL_STEPS: Array<{
  agentId: string;
  targetModule: string;
  tool: string;
  bubble: string;
}> = [
  {
    agentId: 'reddit_scraper',
    targetModule: 'signal_dish',
    tool: 'scrape_reddit_painpoints',
    bubble: 'Harvesting r/SaaS & r/Entrepreneur buyer complaints...',
  },
  {
    agentId: 'reddit_scraper',
    targetModule: 'memory_notebook',
    tool: 'notebook.write',
    bubble: 'Writing verified market pain point to Cortex Memory...',
  },
  {
    agentId: 'overseer',
    targetModule: 'crew_beacon',
    tool: 'crew.delegate',
    bubble: 'Delegating SaaS validation to Orion & Vega...',
  },
  {
    agentId: 'market_analyst',
    targetModule: 'market_radar',
    tool: 'polymarket_spread_scanner',
    bubble: 'Checking live Polymarket & perp funding spreads...',
  },
  {
    agentId: 'micro_saas_builder',
    targetModule: 'code_workbench',
    tool: 'nextjs_microsaas_builder',
    bubble: 'Compiling Next.js + Stripe + Prisma starter bundle...',
  },
  {
    agentId: 'deal_finder',
    targetModule: 'outreach_relay',
    tool: 'b2b_lead_extractor',
    bubble: 'Matching B2B decision-makers to new SaaS offer...',
  },
  {
    agentId: 'deal_finder',
    targetModule: 'media_studio',
    tool: 'viral_video_scriptwriter',
    bubble: 'Generating short-form demo script in Media Studio...',
  },
  {
    agentId: 'overseer',
    targetModule: 'command_computer',
    tool: 'verify.run',
    bubble: 'Verifying mechanical completion evidence across 8 modules...',
  },
];

const QUICK_MISSIONS = [
  {
    label: '🔍 Watch Lyra Scrape Reddit & HN',
    agent: 'reddit_scraper',
    targetModule: 'signal_dish',
    prompt:
      'Use scrape_reddit_painpoints on r/SaaS for "manual workflow" and summarize the top 3 high-margin software opportunities.',
  },
  {
    label: '📊 Watch Vega Scan Polymarket & DEX',
    agent: 'market_analyst',
    targetModule: 'market_radar',
    prompt:
      'Use polymarket_spread_scanner and crypto_funding_rate_arbitrage to identify live pricing spreads and yield opportunities.',
  },
  {
    label: '🛠️ Watch Orion Architect a Micro-SaaS',
    agent: 'micro_saas_builder',
    targetModule: 'code_workbench',
    prompt:
      'Use nextjs_microsaas_builder to architect an AI Invoice & Follow-Up Micro-SaaS for agencies and report the generated bundle.',
  },
  {
    label: '🛰️ Watch Overseer Inspect & Verify Station',
    agent: 'overseer',
    targetModule: 'command_computer',
    prompt:
      'Run station.inspect and verify.run to confirm all 8 Station Modules and 27 tools are operational.',
  },
];

function mapToolToModule(toolName: string): string {
  const t = toolName.toLowerCase();
  if (t.includes('reddit') || t.includes('hackernews') || t.includes('producthunt') || t.includes('twitter_sentiment') || t.includes('maps')) {
    return 'signal_dish';
  }
  if (t.includes('polymarket') || t.includes('solana') || t.includes('funding') || t.includes('arbitrage')) {
    return 'market_radar';
  }
  if (t.includes('lead') || t.includes('email') || t.includes('sendgrid') || t.includes('linkedin') || t.includes('thread') || t.includes('discord')) {
    return 'outreach_relay';
  }
  if (t.includes('video') || t.includes('elevenlabs') || t.includes('seo_blog')) {
    return 'media_studio';
  }
  if (t.includes('microsaas') || t.includes('openclaw') || t.includes('solidity')) {
    return 'code_workbench';
  }
  if (t.includes('notebook')) {
    return 'memory_notebook';
  }
  if (t.includes('delegate')) {
    return 'crew_beacon';
  }
  return 'command_computer';
}

export function StationCommandDeck() {
  const [status, setStatus] = useState<StationStatusData | null>(null);
  const [agents, setAgents] = useState<VisualAgentState[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState('overseer');
  const [missionPrompt, setMissionPrompt] = useState('');
  const [runningMission, setRunningMission] = useState(false);
  const [activeBeam, setActiveBeam] = useState<{ fromModule: string; toModule: string; color: string } | null>({
    fromModule: 'command_computer',
    toModule: 'signal_dish',
    color: '#00F0FF',
  });
  const [liveFeedLogs, setLiveFeedLogs] = useState<Array<{ time: string; agent: string; text: string; color: string }>>([
    {
      time: 'LIVE',
      agent: 'Overseer Prime',
      text: 'All 8 Station Modules online. Crew patrolling INTEL, QUANT, GROWTH, and ENGINEERING bays.',
      color: '#00F0FF',
    },
  ]);
  const [lastRun, setLastRun] = useState<{
    reply: string;
    turnsUsed: number;
    spentBudgetUsdc: number;
    toolTraces: Array<{
      turn: number;
      tool: string;
      module?: string;
      ok: boolean;
      summary: string;
    }>;
    newBeliefs: StationBeliefInfo[];
  } | null>(null);

  const patrolIndexRef = useRef(0);

  const fetchStationStatus = async () => {
    try {
      const res = await fetch('/api/station/v1', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchStationStatus();
  }, []);

  // Autonomous Station Floor movement loop so the user always sees their crew moving & working
  useEffect(() => {
    if (runningMission) return;
    const timer = setInterval(() => {
      const step = AUTONOMOUS_PATROL_STEPS[patrolIndexRef.current % AUTONOMOUS_PATROL_STEPS.length];
      patrolIndexRef.current += 1;

      setAgents((prev) =>
        prev.map((ag) =>
          ag.id === step.agentId
            ? {
                ...ag,
                currentModule: step.targetModule,
                status: 'WORKING',
                activeTool: step.tool,
                bubbleText: step.bubble,
              }
            : ag
        )
      );

      setActiveBeam({
        fromModule: 'command_computer',
        toModule: step.targetModule,
        color: STATION_FLOOR_ROOMS[step.targetModule]?.color || '#00F0FF',
      });

      const matchedAgent = INITIAL_AGENTS.find((a) => a.id === step.agentId);
      const nowStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLiveFeedLogs((prev) => [
        {
          time: nowStr,
          agent: matchedAgent?.name || step.agentId,
          text: `[${step.tool}] ${step.bubble}`,
          color: matchedAgent?.color || '#00F0FF',
        },
        ...prev.slice(0, 7),
      ]);
    }, 3400);

    return () => clearInterval(timer);
  }, [runningMission]);

  // Subscribe to real-time SSE `/api/activity/stream` if backend emits live events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/activity/stream');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.text) {
            const nowStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLiveFeedLogs((prev) => [
              {
                time: nowStr,
                agent: payload.companionName || 'Station Crew',
                text: payload.text,
                color: '#00F0FF',
              },
              ...prev.slice(0, 7),
            ]);
          }
        } catch {
          // ignore non-json heartbeat
        }
      };
    } catch {
      // ignore if SSE unavailable
    }
    return () => {
      es?.close();
    };
  }, []);

  const handleRunMission = async (overridePrompt?: string, overrideAgent?: string, overrideModule?: string) => {
    const promptToRun = (overridePrompt ?? missionPrompt).trim();
    const agentToRun = overrideAgent ?? selectedAgent;
    if (!promptToRun) {
      toast.error('Enter a station mission or click a quick preset first.');
      return;
    }

    setRunningMission(true);
    const targetMod = overrideModule || INITIAL_AGENTS.find((a) => a.id === agentToRun)?.homeModule || 'command_computer';

    // Immediately walk the selected agent to the target workstation on the visual floor!
    setAgents((prev) =>
      prev.map((ag) =>
        ag.id === agentToRun
          ? {
              ...ag,
              currentModule: targetMod,
              status: 'EXECUTING',
              bubbleText: `Executing live mission: "${promptToRun.slice(0, 52)}..."`,
            }
          : ag
      )
    );
    setActiveBeam({
      fromModule: 'command_computer',
      toModule: targetMod,
      color: '#00F0FF',
    });

    try {
      const res = await fetch('/api/station/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: agentToRun,
          prompt: promptToRun,
          maxTurns: 3,
          enableReflection: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Station mission failed');
        return;
      }

      const reply = data?.choices?.[0]?.message?.content || 'Mission completed.';
      const st = data?.station || {};
      const traces: Array<{ turn: number; tool: string; module?: string; ok: boolean; summary: string }> =
        Array.isArray(st.toolTraces) ? st.toolTraces : [];

      // Replay each real tool trace visibly across the station floor!
      traces.forEach((tr, idx) => {
        setTimeout(() => {
          const modId = tr.module || mapToolToModule(tr.tool);
          setAgents((prev) =>
            prev.map((ag) =>
              ag.id === agentToRun
                ? {
                    ...ag,
                    currentModule: modId,
                    status: 'EXECUTING',
                    activeTool: tr.tool,
                    bubbleText: `${tr.tool}: ${tr.summary}`,
                  }
                : ag
            )
          );
          setActiveBeam({
            fromModule: 'command_computer',
            toModule: modId,
            color: tr.ok ? '#10B981' : '#EF4444',
          });
        }, idx * 700);
      });

      setLastRun({
        reply,
        turnsUsed: st.turnsUsed ?? 1,
        spentBudgetUsdc: st.spentBudgetUsdc ?? 0,
        toolTraces: traces,
        newBeliefs: Array.isArray(st.newBeliefs) ? st.newBeliefs : [],
      });

      const nowStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const agentObj = INITIAL_AGENTS.find((a) => a.id === agentToRun);
      setLiveFeedLogs((prev) => [
        {
          time: nowStr,
          agent: agentObj?.name || agentToRun,
          text: `Mission complete (${st.turnsUsed ?? 1} turns, ${traces.length} tool calls).`,
          color: '#10B981',
        },
        ...prev.slice(0, 7),
      ]);

      toast.success(`Station mission complete (${st.turnsUsed ?? 1} turns)!`);
      fetchStationStatus();
    } catch {
      toast.error('Failed to contact TrendForge Station engine');
    } finally {
      setRunningMission(false);
    }
  };

  const selectedAgentState = agents.find((a) => a.id === selectedAgent) || agents[0];

  return (
    <div className="glass-card p-5 sm:p-6 border border-[#00F0FF]/40 bg-gradient-to-br from-[#060B19] via-[#05070F] to-[#0D061A] rounded-2xl space-y-5 shadow-[0_0_50px_rgba(0,240,255,0.12)]">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
              <Cpu className="w-3 h-3" /> TRENDFORGE STATION LIVE DECK v{status?.version || '1.0.0'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              5 AI CREW OPERATIVES ACTIVE ON FLOOR
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
              8 Modules · {status?.grantedTools?.length ?? 27} Live Tools
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#00F0FF]" /> Live Autonomous Station Floor
          </h2>
          <p className="text-xs text-slate-300 font-sans">
            Watch your AI crew walk between station modules, execute live web scraping &amp; quant tools, and store verified beliefs in Cortex Memory. Click any operative or module to command them.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/profile">
            <Button
              size="sm"
              variant="outline"
              className="border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/10 text-xs font-mono uppercase h-8 px-3 hover:bg-[#00F0FF]/20"
            >
              <Brain className="w-3.5 h-3.5 mr-1.5" /> Brain Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VISUAL 2D CYBER-STATION FLOOR + LIVE CREW TELEMETRY SIDEBAR          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 8 Cols: Interactive 2D Visual Station Floor */}
        <div className="lg:col-span-8 relative min-h-[430px] sm:min-h-[460px] rounded-2xl bg-[#030611] border border-[#00F0FF]/30 overflow-hidden select-none shadow-inner">
          {/* Blueprint Cyber Grid Background */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(0, 240, 255, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.14) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Radial Bridge Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(0, 240, 255, 0.14) 0%, rgba(16, 185, 129, 0.05) 40%, transparent 75%)',
            }}
          />

          {/* SVG Corridor Lines & Animated Energy Beams between Command Core and Modules */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Object.values(STATION_FLOOR_ROOMS).map((room) => {
              if (room.id === 'command_computer') return null;
              const hub = STATION_FLOOR_ROOMS.command_computer;
              const isBeamActive =
                activeBeam &&
                ((activeBeam.fromModule === 'command_computer' && activeBeam.toModule === room.id) ||
                  (activeBeam.toModule === 'command_computer' && activeBeam.fromModule === room.id));
              return (
                <g key={`corridor-${room.id}`}>
                  <line
                    x1={hub.x}
                    y1={hub.y}
                    x2={room.x}
                    y2={room.y}
                    stroke={isBeamActive ? room.color : 'rgba(0, 240, 255, 0.16)'}
                    strokeWidth={isBeamActive ? '0.65' : '0.28'}
                    strokeDasharray={isBeamActive ? '1.5 1' : '0.8 0.8'}
                  />
                  {isBeamActive && (
                    <circle r="0.9" fill={room.color}>
                      <animateMotion
                        dur="1.1s"
                        repeatCount="indefinite"
                        path={`M ${hub.x} ${hub.y} L ${room.x} ${room.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Top-Left HUD Overlay */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/75 border border-white/10 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-[#00F0FF] animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
              SECTOR: <strong className="text-white">ORBITAL STATION ALPHA</strong> · {runningMission ? 'EXECUTING MISSION' : 'AUTONOMOUS PATROL'}
            </span>
          </div>

          {/* 8 Physical Station Modules (Workstations) */}
          {Object.values(STATION_FLOOR_ROOMS).map((room) => {
            const occupants = agents.filter((a) => a.currentModule === room.id);
            const isOccupied = occupants.length > 0;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  // Move selected agent to inspect/work at this module
                  setAgents((prev) =>
                    prev.map((ag) =>
                      ag.id === selectedAgent
                        ? {
                            ...ag,
                            currentModule: room.id,
                            status: 'WORKING',
                            bubbleText: `Stationed at ${room.shortName} (${room.zone})`,
                          }
                        : ag
                    )
                  );
                  setActiveBeam({
                    fromModule: 'command_computer',
                    toModule: room.id,
                    color: room.color,
                  });
                }}
                style={{ left: `${room.x}%`, top: `${room.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 w-[118px] sm:w-[134px] p-2 rounded-xl bg-[#070D1F]/90 backdrop-blur-md border transition-all duration-300 text-left group hover:scale-105 ${
                  isOccupied ? `${room.borderColor} ${room.glowColor}` : 'border-white/15 hover:border-white/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${room.color}22`,
                      color: room.color,
                    }}
                  >
                    {room.zone}
                  </span>
                  <span className="text-xs">{room.icon}</span>
                </div>
                <div className="text-[11px] font-bold font-mono text-white mt-1 truncate">
                  {room.shortName}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] font-mono text-slate-400">
                    {isOccupied ? `${occupants.length} active` : 'Standby'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOccupied ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {/* 5 Animated Walking AI Crew Agents */}
          {agents.map((ag, idx) => {
            const room = STATION_FLOOR_ROOMS[ag.currentModule] || STATION_FLOOR_ROOMS.command_computer;
            const isSelected = ag.id === selectedAgent;
            // Offset multiple agents in the same room so they never overlap
            const targetX = Math.min(Math.max(room.x + ag.offsetX + (idx % 2 === 0 ? -2 : 2), 8), 92);
            const targetY = Math.min(Math.max(room.y + ag.offsetY + 6, 12), 92);

            return (
              <motion.div
                key={ag.id}
                animate={{
                  left: `${targetX}%`,
                  top: `${targetY}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 55,
                  damping: 14,
                  mass: 0.9,
                }}
                onClick={() => setSelectedAgent(ag.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
              >
                {/* Floating Speech / Tool Bubble above Agent */}
                <AnimatePresence mode="wait">
                  {(isSelected || ag.status === 'EXECUTING' || idx === patrolIndexRef.current % agents.length) && (
                    <motion.div
                      key={ag.bubbleText}
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.9 }}
                      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[175px] sm:w-[205px] px-2.5 py-1.5 rounded-lg bg-black/90 border border-[#00F0FF]/50 shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-30"
                    >
                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold uppercase mb-0.5">
                        <span style={{ color: ag.color }}>{ag.name}</span>
                        <span className="text-emerald-400">● {ag.activeTool}</span>
                      </div>
                      <div className="text-[10px] font-sans text-slate-200 leading-tight line-clamp-2">
                        {ag.bubbleText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Agent Avatar Body + Pulsing Aura Ring */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg bg-[#081026] border-2 transition-transform ${
                      isSelected ? 'scale-125 ring-4 ring-[#00F0FF]/30' : 'hover:scale-110'
                    }`}
                    style={{
                      borderColor: ag.color,
                      boxShadow: `0 0 18px ${ag.color}80`,
                    }}
                  >
                    <motion.span
                      animate={{ y: [0, -2.5, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {ag.avatar}
                    </motion.span>
                  </div>
                  <span
                    className="mt-1 px-1.5 py-0.5 rounded bg-black/85 border border-white/15 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow"
                    style={{ color: isSelected ? ag.color : '#FFFFFF' }}
                  >
                    {ag.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right 4 Cols: Selected Operative Dossier + Real-Time Station Activity Feed */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 rounded-2xl bg-black/65 border border-white/10 p-4">
          {/* Selected Crew Operative Dossier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl bg-black/80 border flex items-center justify-center text-xl"
                  style={{ borderColor: selectedAgentState.color }}
                >
                  {selectedAgentState.avatar}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    {selectedAgentState.name}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {selectedAgentState.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">{selectedAgentState.role}</div>
                </div>
              </div>
            </div>

            {/* Crew Roster Selector Pills */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-[#00F0FF]" /> Select Station Operative
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agents.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => setSelectedAgent(ag.id)}
                    className={`text-[10px] font-mono px-2 py-1 rounded-md border transition flex items-center gap-1 ${
                      selectedAgent === ag.id
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-white font-bold'
                        : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{ag.avatar}</span> {ag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Workstation & Tool readout */}
            <div className="p-2.5 rounded-xl bg-[#050B1A] border border-white/10 space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-[#00F0FF] font-bold">
                  {STATION_FLOOR_ROOMS[selectedAgentState.currentModule]?.shortName || 'Command Core'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Tool:</span>
                <span className="text-emerald-400">{selectedAgentState.activeTool}</span>
              </div>
              <div className="text-[10px] font-sans text-slate-300 pt-1 border-t border-white/[0.06]">
                “{selectedAgentState.bubbleText}”
              </div>
            </div>
          </div>

          {/* Live Telemetry Ticker */}
          <div className="flex-1 flex flex-col justify-end space-y-1.5 pt-2 border-t border-white/10">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#00F0FF] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Station Floor Telemetry
            </div>
            <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
              {liveFeedLogs.map((log, i) => (
                <div
                  key={i}
                  className="text-[10px] font-mono p-2 rounded-lg bg-black/70 border border-white/[0.06] leading-relaxed"
                >
                  <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                  <strong style={{ color: log.color }} className="mr-1.5">
                    {log.agent}:
                  </strong>
                  <span className="text-slate-300">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE MISSION DISPATCH BAR + 1-CLICK VISUAL PRESETS             */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-xl bg-black/70 border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" /> Command Your Station Crew (Real Multi-Turn Execution)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_MISSIONS.map((qm, i) => (
              <button
                key={i}
                type="button"
                disabled={runningMission}
                onClick={() => {
                  setSelectedAgent(qm.agent);
                  setMissionPrompt(qm.prompt);
                  handleRunMission(qm.prompt, qm.agent, qm.targetModule);
                }}
                className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#00F0FF]/10 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/30 transition disabled:opacity-50"
              >
                {qm.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-3">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full h-9 px-2.5 rounded-md bg-black/80 border border-white/15 text-xs font-mono text-white"
            >
              {agents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatar} {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-7">
            <input
              type="text"
              value={missionPrompt}
              onChange={(e) => setMissionPrompt(e.target.value)}
              placeholder="Give your station operative a live task (or click a preset button above to watch them move & execute)..."
              className="w-full h-9 px-3 rounded-md bg-black/80 border border-white/15 text-xs font-sans text-white placeholder:text-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => handleRunMission()}
              disabled={runningMission}
              className="w-full h-9 cyan-gradient text-black font-extrabold uppercase text-xs font-mono"
            >
              {runningMission ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Working...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1 fill-black" /> Dispatch
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Mission Output & Tool Trace */}
        {lastRun && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Mission Completed in {lastRun.turnsUsed} Turn(s)
              </span>
              <span className="text-slate-400">
                Compute Spend: <strong className="text-white">${lastRun.spentBudgetUsdc.toFixed(4)} USDC</strong> · Tool Calls:{' '}
                <strong className="text-[#00F0FF]">{lastRun.toolTraces.length}</strong>
              </span>
            </div>

            {lastRun.toolTraces.length > 0 && (
              <div className="space-y-1">
                {lastRun.toolTraces.map((tr, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono px-2.5 py-1.5 rounded bg-black/70 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="text-[#00F0FF] flex items-center gap-1.5">
                      <Wrench className="w-3 h-3" /> Turn {tr.turn}: <strong>{tr.tool}</strong>
                      {tr.module && <span className="text-slate-400">[{tr.module}]</span>}
                    </span>
                    <span className={tr.ok ? 'text-emerald-400' : 'text-red-400'}>
                      {tr.summary}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950/90 border border-[#00F0FF]/20 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {lastRun.reply}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
