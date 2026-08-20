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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export function AgentsClient({ user }: { user: any }) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [launching, setLaunching] = useState(false);

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

    let parameters: any = {};
    if (selectedAgent.type === 'reddit_scraper') {
      parameters = {
        subreddit: subreddit.trim() || 'SaaS',
        topic: topic.trim() || 'pain points',
        maxPosts: Number(maxPosts) || 25,
      };
    } else if (selectedAgent.type === 'prediction_arbitrage') {
      parameters = {
        budget: Number(budget) || 0,
        market,
      };
    } else if (selectedAgent.type === 'openclaw_deployer') {
      parameters = {
        serverIp: serverIp.trim() || '198.51.100.42',
        targetStack,
        concurrency: Number(concurrency) || 16,
      };
    } else if (selectedAgent.type === 'ai_video_maker') {
      parameters = {
        topic: videoTopic.trim(),
        voiceStyle,
        aspectRatio,
      };
    } else if (selectedAgent.type === 'micro_saas_builder') {
      parameters = {
        ideaPrompt: saasIdea.trim(),
        niche: saasNiche.trim(),
        authType,
      };
    }

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent.type,
          parameters,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Swarm Agent '${selectedAgent.name}' initiated!`);
        setSelectedAgent(null);
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
        <p className="text-sm text-[#8892B0] max-w-2xl mt-2 font-sans">
          Deploy specialized 1-click autonomous agents that continuously scrape recurring market pain points, calculate prediction spreads, deploy scraping nodes, and scaffold micro-SaaS applications.
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

                  {/* Name & Desc */}
                  <h3 className="text-lg font-bold text-white group-hover:text-[#00F0FF] transition-colors mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-[#8892B0] leading-relaxed mb-6 font-sans line-clamp-3">
                    {agent.description}
                  </p>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-lg border border-white/[0.05] text-xs font-mono mb-6">
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
                </div>

                {/* Footer Action */}
                <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-[#8892B0]">
                    Cost: <span className="text-green-400 font-bold">${(agent.costCents / 100).toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={() => setSelectedAgent(agent)}
                    disabled={isDegraded || !hasRemaining}
                    className="cyan-gradient text-black font-extrabold uppercase holographic-btn px-4 h-8 rounded text-xs"
                  >
                    <Play className="w-3 h-3 fill-black mr-1" />
                    {isDegraded ? 'Cooldown' : !hasRemaining ? 'Quota Reached' : 'Launch'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Launch Parameter Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0B14] border border-[#00F0FF]/30 rounded-xl max-w-lg w-full p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedAgent(null)}
                className="absolute top-4 right-4 text-[#8892B0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-[#00F0FF]" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{selectedAgent.name}</h3>
              </div>
              <p className="text-xs text-[#8892B0] mb-6 font-sans">
                Configure execution parameters for autonomous worker node.
              </p>

              {/* Reddit Scraper Inputs */}
              {selectedAgent.type === 'reddit_scraper' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Target Subreddit</label>
                    <Input
                      placeholder="e.g. SaaS, freelance, Shopify, marketing"
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Pain Point / Opportunity Focus</label>
                    <Input
                      placeholder="e.g. customer churn, lead generation, reporting bottlenecks"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10"
                    />
                  </div>
                </div>
              )}

              {/* Polymarket Arbitrage Inputs */}
              {selectedAgent.type === 'prediction_arbitrage' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Trading Capital ($ USD)</label>
                    <Input
                      type="number"
                      placeholder="0 for zero-risk paper trade simulation"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* OpenClaw Deployer Inputs */}
              {selectedAgent.type === 'openclaw_deployer' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Target Server / VPS IP</label>
                    <Input
                      placeholder="e.g. 198.51.100.42"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Browser Concurrency (Threads)</label>
                    <Input
                      type="number"
                      value={concurrency}
                      onChange={(e) => setConcurrency(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* AI Video Maker Inputs */}
              {selectedAgent.type === 'ai_video_maker' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Video Concept / Topic</label>
                    <Input
                      value={videoTopic}
                      onChange={(e) => setVideoTopic(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#8892B0] block mb-1 font-mono">Voice Engine</label>
                      <select
                        value={voiceStyle}
                        onChange={(e) => setVoiceStyle(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white text-xs h-10 rounded px-2"
                      >
                        <option value="energetic_creator">Energetic Creator</option>
                        <option value="cinematic_deep">Cinematic Deep</option>
                        <option value="professional_narrator">Professional Narrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#8892B0] block mb-1 font-mono">Aspect Ratio</label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white text-xs h-10 rounded px-2"
                      >
                        <option value="9:16">9:16 (TikTok/Shorts)</option>
                        <option value="16:9">16:9 (YouTube Widescreen)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Micro-SaaS Builder Inputs */}
              {selectedAgent.type === 'micro_saas_builder' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Micro-SaaS Problem / Idea</label>
                    <Input
                      value={saasIdea}
                      onChange={(e) => setSaasIdea(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Target Niche Audience</label>
                    <Input
                      value={saasNiche}
                      onChange={(e) => setSaasNiche(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10"
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAgent(null)}
                  className="flex-1 border-white/10 text-[#8892B0] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="flex-1 cyan-gradient text-black font-extrabold uppercase holographic-btn"
                >
                  {launching ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 fill-black mr-1" />}
                  Deploy Agent
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
