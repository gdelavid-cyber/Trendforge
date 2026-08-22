'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Clock,
  Sparkles,
  Server,
  Video,
  Code,
  TrendingUp,
  Loader2,
  X,
  Zap,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';

interface AgentItem {
  type: string;
  name: string;
  description: string;
  category: string;
  costCents: number;
  estimatedDuration: string;
  circuitState: string;
  isAvailable: boolean;
  isFeaturedWeekly?: boolean;
  quota: {
    runsUsed: number;
    runsLimit: number;
    remaining: number;
    hasQuota: boolean;
    isPro: boolean;
  };
}

export const getAgentAvatar = (type: string) => {
  switch (type) {
    case 'prediction_arbitrage': return '/avatars/quantum_android_animated.webp';
    case 'ai_video_maker': return '/avatars/cosmic_entity_animated.webp';
    case 'micro_saas_builder': return '/avatars/wall_street_titan_animated.webp';
    case 'openclaw_deployer': return '/avatars/cyber_humanoid_animated.webp';
    case 'reddit_scraper':
    default: return '/avatars/cyber_humanoid_animated.webp';
  }
};

const getAgentArchetype = (type: string) => {
  switch (type) {
    case 'prediction_arbitrage': return 'QUANTUM_ANDROID';
    case 'ai_video_maker': return 'COSMIC_ENTITY';
    case 'micro_saas_builder': return 'WALL_STREET_TITAN';
    case 'openclaw_deployer': return 'CYBER_HUMANOID';
    case 'reddit_scraper':
    default: return 'CYBER_HUMANOID';
  }
};

export const AGENT_MANUALS: Record<string, {
  tagline: string;
  howItWorks: string[];
  deliverables: string[];
  monetization: string;
  bestFor: string;
}> = {
  reddit_scraper: {
    tagline: 'Mines recurring customer pain points and builds monetization guides.',
    howItWorks: [
      'Connects to Reddit public JSON API across active SaaS & business subreddits',
      'Filters complaints, workarounds, and unmet needs by comment volume and sentiment',
      'Synthesizes 3 concrete software/service solutions with estimated market values',
      'Dispatches an executive intelligence briefing to your email inbox via SendGrid',
    ],
    deliverables: [
      '3 Validated Problem Vectors & Frequency Ratings',
      'Proposed Product / Service Solutions',
      'Step-by-Step Client Outreach Roadmap',
      'Direct Email Briefing Report',
    ],
    monetization: 'Yield: $150 – $1,500 per client (by selling the identified solution or service).',
    bestFor: 'Founders, solopreneurs, and agency owners seeking validated product ideas.',
  },
  prediction_arbitrage: {
    tagline: 'Scans live Polymarket books for delta-neutral spread profits.',
    howItWorks: [
      'Polls real-time orderbooks from the Polymarket Gamma API',
      'Calculates fee-adjusted probability spreads between YES and NO outcome shares',
      'Identifies mispriced events where combined price is below guaranteed $1.00 settlement',
      'Outputs an optimized capital allocation model in paper or live trading mode',
    ],
    deliverables: [
      'Net Projected Spread (% ROI)',
      'Dollar Profit Breakdown',
      'Trade Payload (Market ID, Contract Addresses, Entry Pricing)',
      'Risk & Fee-Adjusted Analysis',
    ],
    monetization: 'Yield: +4.5% to +18.2% delta-neutral return on allocated trading capital.',
    bestFor: 'DeFi traders, yield farmers, and crypto market participants.',
  },
  openclaw_deployer: {
    tagline: 'Provisions dedicated headless scraping VPS nodes with proxy pools.',
    howItWorks: [
      'Validates target Linux VPS IP and SSH credentials with encrypted transit',
      'Deploys containerized Puppeteer / Playwright scraping clusters with anti-bot evasion',
      'Connects residential IP rotation proxies to prevent rate limits and IP bans',
      'Executes end-to-end network latency tests and returns a verified health check',
    ],
    deliverables: [
      'Dedicated Deployment ID & Worker Cluster Status',
      '16+ Active Concurrent Browser Threads',
      'Proxy Ping Latency (ms) & Bandwidth Health Metrics',
      'Ready-to-Use Webhook Scraping Gateway',
    ],
    monetization: 'Yield: Powers high-volume lead scraping and data harvesting agencies ($500–$3,000/mo).',
    bestFor: 'Growth hackers, scraping engineers, and lead generation agencies.',
  },
  ai_video_maker: {
    tagline: 'Generates viral 9:16 short-form video scripts, voiceovers, and scene plans.',
    howItWorks: [
      'Takes your topic or product concept and formats it for algorithmic retention',
      'Constructs a 3-second visual hook, high-pacing body, and high-converting CTA',
      'Calculates optimal narration pace (under 145 WPM) and generates ElevenLabs voice settings',
      'Outputs second-by-second scene transition directions for CapCut or Premiere',
    ],
    deliverables: [
      '3-Part Viral Script (Hook, Body, CTA)',
      'Scene-by-Scene Visual & Transition Plan',
      'Target Audio Duration (30-60s) & Voice Preset',
      'Platform-Specific Optimization Notes (TikTok, Reels, Shorts)',
    ],
    monetization: 'Yield: $300 – $2,400/mo via Creator Rewards, affiliate sales, and UGC ad creation packages.',
    bestFor: 'Content creators, TikTok Shop affiliates, and e-commerce brand owners.',
  },
  micro_saas_builder: {
    tagline: 'Scaffolds full-stack Next.js web applications with Stripe billing.',
    howItWorks: [
      'Takes a software problem prompt and formulates brand identity & punchy tagline',
      'Synthesizes Next.js 14 App Router landing page, dashboard, and PostgreSQL Prisma schema',
      'Configures Stripe Checkout subscription billing sessions and webhook listeners',
      'Renders an interactive Source Code Explorer with 1-click Vercel cloud deployment',
    ],
    deliverables: [
      'Brand Identity & Commercial Economics ($29/mo tier → $2,900/mo Target MRR)',
      '4 Production TypeScript Source Files (Landing, Dashboard, Stripe, Prisma)',
      'Interactive Code Explorer with Syntax Highlighting',
      '1-Click "Deploy to Vercel" & GitHub Repository Link',
    ],
    monetization: 'Yield: Launch recurring software products capable of generating $2,000 – $10,000+ MRR.',
    bestFor: 'Developers, entrepreneurs, and indie hackers launching digital software products.',
  },
};

export function AgentsClient({ user }: { user: any }) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [launching, setLaunching] = useState(false);
  const [expandedManual, setExpandedManual] = useState<string | null>(null);

  // Form states
  // Reddit
  const [subreddit, setSubreddit] = useState('SaaS');
  const [topic, setTopic] = useState('customer churn & automation tools');
  const [maxPosts, setMaxPosts] = useState(25);

  // Polymarket Arbitrage
  const [budget, setBudget] = useState(0);
  const [market, setMarket] = useState('Polymarket');

  // OpenClaw Deployer
  const [serverIp, setServerIp] = useState('198.51.100.42');
  const [targetStack, setTargetStack] = useState('crawler_node');
  const [concurrency, setConcurrency] = useState(16);

  // AI Video Maker
  const [videoTopic, setVideoTopic] = useState('Top 3 AI Side Hustles Making $1k/Week');
  const [voiceStyle, setVoiceStyle] = useState('energetic_creator');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Micro-SaaS Builder
  const [saasIdea, setSaasIdea] = useState('Automated AI Client Feedback & Review Aggregator for Shopify');
  const [saasNiche, setSaasNiche] = useState('E-Commerce Brands');
  const [authType, setAuthType] = useState('NextAuth');
  const [talkAgent, setTalkAgent] = useState<any | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (e) {
      toast.error('Failed to load agent swarm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleLaunch = async () => {
    if (!selectedAgent) return;
    if (!user) {
      toast.error('Please sign in to deploy swarm agents');
      router.push('/auth/signin');
      return;
    }

    setLaunching(true);
    let params: any = {};

    if (selectedAgent.type === 'reddit_scraper') {
      params = { subreddit, topic, maxPosts };
    } else if (selectedAgent.type === 'prediction_arbitrage') {
      params = { budget: Number(budget), market };
    } else if (selectedAgent.type === 'openclaw_deployer') {
      params = { serverIp, targetStack, concurrency: Number(concurrency) };
    } else if (selectedAgent.type === 'ai_video_maker') {
      params = { topic: videoTopic, voiceStyle, aspectRatio };
    } else if (selectedAgent.type === 'micro_saas_builder') {
      params = { ideaPrompt: saasIdea, niche: saasNiche, authType };
    }

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent.type,
          parameters: params,
        }),
      });

      const data = await res.json();
      if (res.ok && data.runId) {
        toast.success(`Launched ${selectedAgent.name}!`);
        router.push(`/agents/${data.runId}/status`);
      } else {
        toast.error(data.error || 'Failed to start agent');
      }
    } catch (err: any) {
      toast.error('Error contacting Swarm orchestrator');
    } finally {
      setLaunching(false);
    }
  };

  const firstAgent = agents[0];
  const isPro = firstAgent?.quota?.isPro;

  const toggleManual = (type: string) => {
    setExpandedManual(expandedManual === type ? null : type);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
          <Bot className="w-3.5 h-3.5 animate-pulse" />
          <span>PRODUCTION AGENT SWARM // 5 ACTIVE WORKER ENGINES</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Autonomous <span className="cyan-gold-gradient-text">Agent Swarm</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-3xl mt-2 font-sans leading-relaxed">
          Deploy specialized 1-click autonomous worker agents that continuously scrape recurring market pain points, calculate prediction arbitrage spreads, deploy scraping nodes, create viral video scripts, and scaffold full-stack micro-SaaS codebases.
        </p>

        {/* Weekly Quota Alert & Progress Bar */}
        {!isPro && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-white/[0.04] to-black/40 border border-white/10 max-w-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Weekly Free Tier Allowance: 3 Runs / Week
                </span>
              </div>
              <p className="text-[11px] text-[#8892B0] font-sans mt-0.5">
                Resets every Monday. Upgrade to Pro or opt into Success-Fee for extra runs.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4">
                Upgrade Pro
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Grid of Agents */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8892B0] font-mono">CONNECTING TO SWARM ORCHESTRATOR...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => {
            const hasRemaining = agent.quota.hasQuota;
            const isDegraded = !agent.isAvailable;
            const manual = AGENT_MANUALS[agent.type];
            const isExpanded = expandedManual === agent.type;

            return (
              <motion.div
                key={agent.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 flex flex-col justify-between relative overflow-hidden border border-white/[0.08] hover:border-[#00F0FF]/30 transition-all group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                      {agent.category}
                    </span>
                    {agent.type === 'reddit_scraper' && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Featured Free
                      </span>
                    )}
                  </div>

                  {/* Name & Desc with Animated Avatar */}
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-13 h-13 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] flex-shrink-0 bg-black/60 p-0.5">
                      <img src={getAgentAvatar(agent.type)} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#8892B0] block">
                        {agent.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#8892B0] leading-relaxed mb-4 font-sans line-clamp-2">
                    {agent.description}
                  </p>

                  {/* Commercial Yield Highlight Box */}
                  {manual && (
                    <div className="bg-green-500/10 border border-green-500/20 p-2.5 rounded-lg mb-4 text-[11px] font-mono text-green-400">
                      <strong>💰 {manual.monetization}</strong>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-lg border border-white/[0.05] text-xs font-mono mb-4">
                    <div>
                      <span className="text-[#8892B0] text-[10px] block uppercase">Runtime</span>
                      <span className="text-white flex items-center gap-1 mt-0.5 text-[11px]">
                        <Clock className="w-3 h-3 text-[#00F0FF]" /> {agent.estimatedDuration}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8892B0] text-[10px] block uppercase">Allowance</span>
                      <span className="text-[#FFD700] font-bold mt-0.5 block text-[11px]">
                        {agent.quota.isPro ? 'Pro Unlimited' : `${agent.quota.runsUsed} / ${agent.quota.runsLimit} Used`}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Manual / How It Works Button */}
                  {manual && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleManual(agent.type)}
                        className="w-full py-1.5 px-3 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-[11px] font-mono text-[#8892B0] hover:text-[#00F0FF] flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-[#00F0FF]" />
                          {isExpanded ? 'Hide Bot Field Manual' : 'How This Bot Works & Deliverables'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-2 p-3 bg-black/60 rounded-lg border border-[#00F0FF]/20 text-xs space-y-2.5 font-sans"
                          >
                            <div>
                              <span className="text-[10px] font-mono text-[#00F0FF] uppercase block font-bold">
                                How It Works:
                              </span>
                              <ul className="list-disc list-inside text-[11px] text-[#CCD6F6] space-y-1 mt-1">
                                {manual.howItWorks.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <span className="text-[10px] font-mono text-[#FFD700] uppercase block font-bold">
                                Exact Deliverables:
                              </span>
                              <ul className="list-disc list-inside text-[11px] text-[#CCD6F6] space-y-1 mt-1">
                                {manual.deliverables.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="pt-1 text-[10px] font-mono text-[#8892B0]">
                              <strong>Best For:</strong> {manual.bestFor}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTalkAgent({
                        name: agent.name,
                        archetype: getAgentArchetype(agent.type),
                        walletBalance: 100,
                        survivalScore: 88,
                      })
                    }
                    className="col-span-2 border-[#00F0FF]/30 text-xs font-mono uppercase text-[#00F0FF] hover:bg-[#00F0FF]/10 bg-black/40 h-10 px-2"
                  >
                    <Bot className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Talk & Voice
                  </Button>
                  <Button
                    onClick={() => setSelectedAgent(agent)}
                    disabled={!hasRemaining || isDegraded}
                    className={`col-span-3 font-bold uppercase tracking-wider text-xs h-10 ${
                      hasRemaining && !isDegraded
                        ? 'cyan-gradient text-black holographic-btn'
                        : 'bg-white/5 text-[#8892B0] border border-white/10'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                    {!hasRemaining ? 'No Quota' : isDegraded ? 'Maint' : 'Configure'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Launch Configuration Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0B0B14] border border-[#00F0FF]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedAgent(null)}
                className="absolute top-4 right-4 text-[#8892B0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.2)] flex-shrink-0 bg-black/60 p-0.5">
                  <img src={getAgentAvatar(selectedAgent.type)} alt={selectedAgent.name} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Deploy {selectedAgent.name}
                  </h2>
                  <span className="text-[10px] font-mono text-[#00F0FF]">
                    {selectedAgent.category} • Runtime: {selectedAgent.estimatedDuration}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#8892B0] mb-6 font-sans">
                {selectedAgent.description}
              </p>

              {/* Bot Details & Deliverables Box in Modal */}
              {AGENT_MANUALS[selectedAgent.type] && (
                <div className="mb-6 p-3 bg-black/50 border border-white/10 rounded-xl text-xs space-y-2">
                  <div className="text-green-400 font-mono font-bold text-[11px]">
                    💰 {AGENT_MANUALS[selectedAgent.type].monetization}
                  </div>
                  <div className="text-[11px] text-[#8892B0]">
                    <strong>Target Output:</strong> {AGENT_MANUALS[selectedAgent.type].deliverables.join(' • ')}
                  </div>
                </div>
              )}

              {/* Dynamic Parameter Forms */}
              <div className="space-y-4 mb-6 text-left">
                {/* Agent 1: Reddit Scraper */}
                {selectedAgent.type === 'reddit_scraper' && (
                  <>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Target Subreddit</label>
                      <Input
                        value={subreddit}
                        onChange={(e) => setSubreddit(e.target.value)}
                        placeholder="e.g. SaaS, Entrepreneur, smallbusiness"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Problem Search Focus</label>
                      <Input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. customer churn, lead generation, invoice tools"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Agent 2: Prediction Arbitrage */}
                {selectedAgent.type === 'prediction_arbitrage' && (
                  <>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">
                        Execution Mode & Trade Budget ($ USD)
                      </label>
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        placeholder="0 for Paper Trade Simulation, or enter $ amount"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                      <span className="text-[10px] text-[#8892B0] font-mono block mt-1">
                        * Enter 0 to run risk-free Paper Simulation without real funds.
                      </span>
                    </div>
                  </>
                )}

                {/* Agent 3: OpenClaw Deployer */}
                {selectedAgent.type === 'openclaw_deployer' && (
                  <>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Target Server IP</label>
                      <Input
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        placeholder="e.g. 198.51.100.42"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Concurrent Browser Threads</label>
                      <Input
                        type="number"
                        value={concurrency}
                        onChange={(e) => setConcurrency(Number(e.target.value))}
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Agent 4: AI Video Maker */}
                {selectedAgent.type === 'ai_video_maker' && (
                  <>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Video Topic & Hook Concept</label>
                      <Input
                        value={videoTopic}
                        onChange={(e) => setVideoTopic(e.target.value)}
                        placeholder="e.g. Top 3 AI Side Hustles Making $1k/Week"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Voice Style Engine</label>
                      <select
                        value={voiceStyle}
                        onChange={(e) => setVoiceStyle(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs"
                      >
                        <option value="energetic_creator">ElevenLabs // Energetic Creator</option>
                        <option value="deep_documentary">ElevenLabs // Deep Documentary</option>
                        <option value="cyber_tech">ElevenLabs // Tech Authority</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Agent 5: Micro-SaaS Builder */}
                {selectedAgent.type === 'micro_saas_builder' && (
                  <>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Software Problem / App Idea</label>
                      <Input
                        value={saasIdea}
                        onChange={(e) => setSaasIdea(e.target.value)}
                        placeholder="e.g. Automated AI Client Feedback & Review Aggregator for Shopify"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8892B0] uppercase block mb-1">Target Niche / Audience</label>
                      <Input
                        value={saasNiche}
                        onChange={(e) => setSaasNiche(e.target.value)}
                        placeholder="e.g. E-Commerce Brands, Med Spas, Roofers"
                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAgent(null)}
                  className="w-1/3 border-white/10 text-xs font-mono uppercase text-[#8892B0]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="w-2/3 cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn"
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing Node...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" /> Deploy Agent
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global AI Companion Consultation Modal */}
      <AgentCompanionModal
        isOpen={!!talkAgent}
        onClose={() => setTalkAgent(null)}
        agent={talkAgent}
        user={user}
      />
    </div>
  );
}
