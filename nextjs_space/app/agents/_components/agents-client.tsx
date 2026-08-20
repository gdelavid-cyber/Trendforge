'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Play, Shield, Clock, TrendingUp, Sparkles, AlertTriangle, CheckCircle, Loader2, X, ExternalLink, Database } from 'lucide-react';
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
  const [budget, setBudget] = useState(0); // 0 = simulation
  const [market, setMarket] = useState('Polymarket');

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
      if (!subreddit.trim()) {
        toast.error('Subreddit name is required');
        setLaunching(false);
        return;
      }
      parameters = {
        subreddit: subreddit.trim(),
        topic: topic.trim() || 'general pain points',
        maxPosts: Number(maxPosts) || 25,
      };
    } else if (selectedAgent.type === 'prediction_arbitrage') {
      parameters = {
        budget: Number(budget) || 0,
        market,
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
          <Bot className="w-3.5 h-3.5 animate-pulse" />
          <span>PHASE 1 // AUTONOMOUS AGENT SWARM</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Autonomous <span className="cyan-gold-gradient-text">Agent Swarm</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-2xl mt-2 font-sans">
          Deploy specialized 1-click autonomous agents that continuously scrape recurring market pain points, calculate prediction market spreads, and execute money-making workflows with live telemetry.
        </p>
      </motion.div>

      {/* Grid of Agents */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8892B0] font-mono">CONNECTING TO SWARM ORCHESTRATOR...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {agents.map((agent, i) => {
            const hasRemaining = agent.quota.hasQuota;
            const isDegraded = !agent.isAvailable;

            return (
              <motion.div
                key={agent.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 flex flex-col justify-between relative overflow-hidden border border-white/[0.08] hover:border-[#00F0FF]/30 transition-all group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-2.5 py-0.5 rounded">
                      {agent.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1 ${
                        isDegraded
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
                      {isDegraded ? 'Cooldown Active' : 'Operational'}
                    </span>
                  </div>

                  {/* Name & Desc */}
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00F0FF] transition-colors mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-[#8892B0] leading-relaxed mb-6 font-sans">
                    {agent.description}
                  </p>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded-lg border border-white/[0.05] text-xs font-mono mb-6">
                    <div>
                      <span className="text-[#8892B0] text-[10px] block uppercase">Est. Runtime</span>
                      <span className="text-white flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#00F0FF]" /> {agent.estimatedDuration}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8892B0] text-[10px] block uppercase">Weekly Quota</span>
                      <span className="text-[#FFD700] font-bold mt-0.5 block">
                        {agent.quota.isPro ? 'Pro Unlimited' : `${agent.quota.runsUsed} / ${agent.quota.runsLimit} Used`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-[#8892B0]">
                    Execution Cost: <span className="text-green-400 font-bold">${(agent.costCents / 100).toFixed(2)}</span> (Covered)
                  </div>
                  <Button
                    onClick={() => setSelectedAgent(agent)}
                    disabled={isDegraded || !hasRemaining}
                    className="cyan-gradient text-black font-extrabold uppercase holographic-btn px-5 h-9 rounded text-xs"
                  >
                    <Play className="w-3 h-3 fill-black mr-1" />
                    {isDegraded ? 'Cooldown' : !hasRemaining ? 'Quota Reached' : 'Launch Agent'}
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
                Configure input parameters for autonomous worker execution.
              </p>

              {/* Reddit Scraper Inputs */}
              {selectedAgent.type === 'reddit_scraper' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Target Subreddit (without r/)</label>
                    <Input
                      placeholder="e.g. SaaS, freelance, Shopify, marketing"
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Focus Pain Points / Opportunity Topic</label>
                    <Input
                      placeholder="e.g. client reporting, cold outreach, pricing bottlenecks"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Max Discussions to Ingest</label>
                    <Input
                      type="number"
                      min={10}
                      max={50}
                      value={maxPosts}
                      onChange={(e) => setMaxPosts(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-white text-sm h-10 font-mono"
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
                    <p className="text-[10px] text-[#8892B0] mt-1 font-mono">
                      Set to <strong>0</strong> to execute paper trade simulation and analyze net spreads.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[#8892B0] block mb-1 font-mono">Target Prediction Exchange</label>
                    <select
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 text-white text-sm h-10 rounded px-3 font-mono focus:outline-none focus:border-[#00F0FF]"
                    >
                      <option value="Polymarket">Polymarket (Decentralized Orderbook)</option>
                      <option value="Kalshi">Kalshi (CFTC Regulated)</option>
                    </select>
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
                  Deploy to Swarm
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
