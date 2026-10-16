'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  DollarSign,
  Rocket,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Bot,
  Video,
  Layers,
  ChevronRight,
  Play,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskFilters, TaskFilterState } from '@/app/tasks/_components/task-filters';
import { InfiniteTaskList } from '@/app/tasks/_components/infinite-task-list';

interface EarnPageClientProps {
  initialTotalTasks: number;
  userRole: string;
}

const PLAYBOOKS = [
  {
    id: 'quick-cash',
    badge: 'FASTEST TO CASH',
    badgeColor: 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10',
    title: 'Quick Cash B2B Moves',
    earnings: '$200 - $1,500',
    timeframe: '24-48 Hours',
    risk: 'Low Risk',
    description:
      'High-urgency services local businesses desperately pay for today: after-hours call triage, automated invoice dunning, and rapid review filtering.',
    actionUrl: '#task-stream',
    steps: [
      'Pick a pre-configured B2B task from the live stream below.',
      'Deploy the instant AI outreach script or cold email template.',
      'Deliver automated prototype in under 2 hours and invoice on Stripe.',
    ],
  },
  {
    id: 'video-empire',
    badge: 'EXPONENTIAL SCALE',
    badgeColor: 'text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10',
    title: 'Faceless AI Content Engine',
    earnings: '$500 - $3,000',
    timeframe: '3-7 Days',
    risk: 'Medium Risk',
    description:
      'Launch algorithmic short-form TikTok/Reels accounts monetized via affiliate networks, digital products, and creator fund ad revenue.',
    actionUrl: '#task-stream',
    steps: [
      'Extract trending high-conversion hooks from the Trends Radar.',
      'Generate scripts and synthetic voiceovers with infer.dev.',
      'Schedule 3 daily automated uploads using scheduling pipelines.',
    ],
  },
  {
    id: 'automated-assets',
    badge: 'PASSIVE CASH FLOW',
    badgeColor: 'text-[#8b5cf6] border-[#8b5cf6]/30 bg-[#8b5cf6]/10',
    title: 'Micro-SaaS & Agent Fleets',
    earnings: '$1,000 - $10,000+',
    timeframe: '2-4 Weeks',
    risk: 'High Reward',
    description:
      'Autonomous micro-SaaS and deployed agent products generating recurring MRR, governed autonomously by the StarNet Swarm.',
    actionUrl: '/starnet',
    steps: [
      'Select a validated market signal from the autonomous venture pipeline.',
      'Let the StarNet Architect & Builder agents spin up the codebase.',
      'Collect subscription revenue directly into connected Stripe ledger.',
    ],
  },
];

export function EarnPageClient({ initialTotalTasks, userRole }: EarnPageClientProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'playbooks' | 'fleet'>('stream');
  const [filters, setFilters] = useState<TaskFilterState>({
    search: '',
    difficulty: 'ALL',
    category: 'ALL',
    riskLevel: 'ALL',
    sort: 'newest',
  });
  const [customTasks, setCustomTasks] = useState<any[]>([]);

  const handleTaskGenerated = (newTask: any) => {
    setCustomTasks((prev) => [newTask, ...prev]);
  };

  return (
    <main className="max-w-[1260px] mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0A0D17] to-[#04060A] border border-white/10 p-6 md:p-10 mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#FF6B9D]/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] font-mono text-xs mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
              <span>{initialTotalTasks} LIVE MONETIZATION OPPORTUNITIES</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase font-display mb-3">
              Task &amp; Earn <span className="text-[#00F0FF]">Command Center</span>
            </h1>
            <p className="text-sm md:text-base text-[#8892B0] max-w-2xl font-mono leading-relaxed">
              Real-time actionable money-making tasks, verified earning pathways, and autonomous StarNet Swarm agents turning market signals into cash.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/starnet">
              <Button
                variant="outline"
                className="h-12 px-6 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] font-mono text-xs tracking-wider uppercase rounded-xl flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-[#00F0FF]" /> StarNet Swarm
              </Button>
            </Link>
            <Link href="/ventures">
              <Button className="h-12 px-6 bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 font-mono font-bold text-xs tracking-wider uppercase rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <Rocket className="w-4 h-4" /> Venture OS
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/[0.08]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] font-mono text-[#8892B0] uppercase">Available Moves</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{initialTotalTasks}</div>
            <div className="text-[10px] text-[#00FF66] font-mono mt-0.5">● Ready to execute</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] font-mono text-[#8892B0] uppercase">High Yield Range</div>
            <div className="text-2xl font-black text-[#00F0FF] font-mono mt-1">$200 - $10K+</div>
            <div className="text-[10px] text-[#8892B0] font-mono mt-0.5">Verified economics</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] font-mono text-[#8892B0] uppercase">Avg First Dollar</div>
            <div className="text-2xl font-black text-white font-mono mt-1">24 - 48h</div>
            <div className="text-[10px] text-[#00FF66] font-mono mt-0.5">Sprint validated</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] font-mono text-[#8892B0] uppercase">Autonomous Agents</div>
            <div className="text-2xl font-black text-[#FF6B9D] font-mono mt-1">6 Active</div>
            <div className="text-[10px] text-[#8892B0] font-mono mt-0.5">Continuous execution</div>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-white/[0.08] mb-8 gap-2">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-5 py-3.5 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 rounded-t-xl border-b-2 ${
            activeTab === 'stream'
              ? 'text-[#00F0FF] border-[#00F0FF] bg-white/[0.03]'
              : 'text-[#8892B0] border-transparent hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-[#00F0FF]" /> Live Power Stream ({initialTotalTasks})
        </button>
        <button
          onClick={() => setActiveTab('playbooks')}
          className={`px-5 py-3.5 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 rounded-t-xl border-b-2 ${
            activeTab === 'playbooks'
              ? 'text-[#00F0FF] border-[#00F0FF] bg-white/[0.03]'
              : 'text-[#8892B0] border-transparent hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#FF6B9D]" /> 3 Earning Playbooks
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-5 py-3.5 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 rounded-t-xl border-b-2 ${
            activeTab === 'fleet'
              ? 'text-[#00F0FF] border-[#00F0FF] bg-white/[0.03]'
              : 'text-[#8892B0] border-transparent hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-[#00FF66]" /> Swarm Automation Fleet
        </button>
      </div>

      {/* Tab 1: Live Task Stream */}
      {activeTab === 'stream' && (
        <section id="task-stream" className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00F0FF]" /> Instant Execution Opportunities
              </h2>
              <p className="text-xs text-[#8892B0] font-mono mt-0.5">
                Filter by risk, category, or potential earnings. Select any task to view blueprints, scripts, and 1-click execution.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#00FF66]">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span>Real-Time Stream</span>
            </div>
          </div>

          <TaskFilters
            filters={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({
                search: '',
                difficulty: 'ALL',
                category: 'ALL',
                riskLevel: 'ALL',
                sort: 'newest',
              })
            }
            userRole={userRole}
            onTaskGenerated={handleTaskGenerated}
          />
          <InfiniteTaskList filters={filters} customTasks={customTasks} />
        </section>
      )}

      {/* Tab 2: 3 Earning Playbooks */}
      {activeTab === 'playbooks' && (
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider mb-1">
              Engineered Earning Pathways
            </h2>
            <p className="text-xs text-[#8892B0] font-mono">
              Three battle-tested playbooks matching different commitment windows and risk profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAYBOOKS.map((pb) => (
              <div
                key={pb.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-[#06060E]/90 border border-white/10 hover:border-[#00F0FF]/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${pb.badgeColor}`}
                    >
                      {pb.badge}
                    </span>
                    <span className="text-[10px] font-mono text-[#8892B0]">{pb.risk}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide mb-2">
                    {pb.title}
                  </h3>

                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8892B0]">Earnings Range:</span>
                      <span className="font-bold text-[#00FF66]">{pb.earnings}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono mt-1">
                      <span className="text-[#8892B0]">Time to First Dollar:</span>
                      <span className="font-bold text-white">{pb.timeframe}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#8892B0] font-mono leading-relaxed mb-6">
                    {pb.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="text-[11px] font-bold text-white font-mono uppercase tracking-wider mb-2">
                      Execution Sequence:
                    </div>
                    {pb.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-mono text-[#8892B0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF] shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={pb.actionUrl}
                  onClick={() => {
                    if (pb.actionUrl === '#task-stream') {
                      setActiveTab('stream');
                    }
                  }}
                >
                  <Button className="w-full h-11 bg-white/[0.04] hover:bg-[#00F0FF] hover:text-black text-white border border-white/10 font-mono text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition-all">
                    <span>Activate Pathway</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Swarm Fleet */}
      {activeTab === 'fleet' && (
        <section className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#00F0FF]/10 via-[#06060E] to-[#FF6B9D]/10 border border-white/15">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase tracking-wider px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                  AUTONOMOUS EXECUTION
                </span>
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide mt-3 mb-2">
                  StarNet Swarm Is Actively Working For You
                </h3>
                <p className="text-xs md:text-sm text-[#8892B0] font-mono max-w-xl leading-relaxed">
                  The continuous swarm daemon operates 6 specialist AI agents in parallel: scanning trends, generating blueprints, synthesizing codebases, and driving client acquisitions 24/7.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link href="/starnet">
                  <Button className="h-12 px-6 bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2">
                    <Bot className="w-4 h-4" /> Open Command Center
                  </Button>
                </Link>
                <Link href="/ventures">
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] font-mono text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4 text-[#FF6B9D]" /> View Fleet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
