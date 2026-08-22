'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Wallet,
  Shield,
  Zap,
  Flame,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Skull,
  Dna,
  ArrowRight,
  Loader2,
  DollarSign,
  Palette,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';

export function Web4AgentsClient({ user }: { user: any }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingAgentId, setExecutingAgentId] = useState<string | null>(null);
  const [refuelingAgentId, setRefuelingAgentId] = useState<string | null>(null);
  const [talkAgent, setTalkAgent] = useState<any | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/web4/agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch {
      toast.error('Failed to load Web4 agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleExecute = async (agentId: string) => {
    setExecutingAgentId(agentId);
    try {
      const res = await fetch(`/api/web4/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Mission Success! Net Yield Generated: +$${data.netProfit} USDC`);
        fetchAgents();
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch {
      toast.error('Execution error');
    } finally {
      setExecutingAgentId(null);
    }
  };

  const handleRefuel = async (agentId: string) => {
    setRefuelingAgentId(agentId);
    try {
      const res = await fetch(`/api/web4/agents/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFUEL', refuelAmount: 50 }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Agent refueled with +$50.00 USDC liquidity!');
        fetchAgents();
      } else {
        toast.error(data.error || 'Refuel failed');
      }
    } catch {
      toast.error('Refuel network error');
    } finally {
      setRefuelingAgentId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            ACTIVE
          </span>
        );
      case 'DYING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            DYING (SOS)
          </span>
        );
      case 'REPRODUCING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Dna className="w-3 h-3 animate-spin" />
            REPRODUCING
          </span>
        );
      case 'DEAD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-500/10 text-gray-400 border border-gray-500/30 flex items-center gap-1">
            <Skull className="w-3 h-3" />
            SELF-DESTRUCTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
            {status}
          </span>
        );
    }
  };

  const getAvatarImageSrc = (cfg: any) => {
    if (!cfg || !cfg.baseModel) return '/avatars/cyber_humanoid_animated.webp';
    switch (cfg.baseModel) {
      case 'QUANTUM_ANDROID': return '/avatars/quantum_android_animated.webp';
      case 'WALL_STREET_TITAN': return '/avatars/wall_street_titan_animated.webp';
      case 'COSMIC_ENTITY': return '/avatars/cosmic_entity_animated.webp';
      case 'CYBER_HUMANOID':
      default: return '/avatars/cyber_humanoid_animated.webp';
    }
  };

  const getAvatarEmoji = (cfg: any) => {
    if (!cfg) return '🥷';
    switch (cfg.baseModel) {
      case 'QUANTUM_ANDROID': return '🤖';
      case 'WALL_STREET_TITAN': return '👑';
      case 'COSMIC_ENTITY': return '🌌';
      default: return '🥷';
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>ECONOMIC CITIZENS // CONWAY WALLETS // EIP-8004 IDENTITIES</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Web4 <span className="cyan-gold-gradient-text">Sovereign Agents</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Autonomous economic citizens with sovereign crypto wallets, visual avatars, and Darwinian survival instincts ("Make money or die").
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/avatar-studio">
            <Button variant="outline" size="sm" className="border-white/10 text-xs font-mono uppercase text-white bg-white/[0.03]">
              <Palette className="w-3.5 h-3.5 mr-1.5 text-[#00F0FF]" /> Avatar Studio
            </Button>
          </Link>
          <Link href="/builder">
            <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono">
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Mint New Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of Web4 Sovereign Agents */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8E9BB4] font-mono">CONNECTING TO WEB4 AGENT LAYER...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <Bot className="w-12 h-12 text-[#00F0FF] mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-white font-orbitron uppercase">No Sovereign Agents Deployed Yet</h3>
          <p className="text-xs text-[#8E9BB4] font-sans">
            Use the No-Code Agent Studio to connect skill blocks and deploy your first autonomous economic citizen with a Conway crypto wallet.
          </p>
          <Link href="/builder">
            <Button className="cyan-gradient text-black font-bold uppercase text-xs font-mono">
              Open No-Code Agent Studio &rarr;
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const isExecuting = executingAgentId === agent.id;
            const isRefueling = refuelingAgentId === agent.id;
            const isDead = agent.status === 'DEAD';

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-6 flex flex-col justify-between relative border ${
                  agent.status === 'DYING'
                    ? 'border-[#FF007A]/50 bg-[#FF007A]/5'
                    : isDead
                    ? 'border-gray-700 opacity-60'
                    : 'border-white/10 hover:border-[#00F0FF]/40'
                }`}
              >
                <div>
                  {/* Status & Archetype */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                      {agent.archetype}
                    </span>
                    {getStatusBadge(agent.status)}
                  </div>

                  {/* Visual Avatar & Name Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)] flex-shrink-0">
                      <img
                        src={getAvatarImageSrc(agent.avatarConfig)}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                        {agent.name}
                        {agent.generation > 1 && (
                          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            Gen-{agent.generation}
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] text-[#8E9BB4] font-mono block mt-0.5 truncate max-w-[200px]">
                        ID: {agent.walletAddress}
                      </span>
                    </div>
                  </div>

                  {/* Financial Telemetry & Conway Wallet */}
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8E9BB4] flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-[#00F0FF]" /> Conway Wallet:
                      </span>
                      <span className="text-green-400 font-bold text-sm">
                        ${agent.walletBalance.toFixed(2)} USDC
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8E9BB4]">Total Net Profit:</span>
                      <span className="text-[#FFD700] font-bold">
                        +${agent.profit.toFixed(2)} USDC
                      </span>
                    </div>

                    {/* Survival Score Meter */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-[#8E9BB4]">Darwinian Survival Score</span>
                        <span className={`font-bold ${agent.survivalScore > 50 ? 'text-[#00F0FF]' : 'text-[#FF007A]'}`}>
                          {agent.survivalScore}/100
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            agent.survivalScore > 50 ? 'bg-[#00F0FF]' : 'bg-[#FF007A]'
                          }`}
                          style={{ width: `${Math.max(agent.survivalScore, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* EIP-8004 Protocol Tag */}
                  {agent.eip8004Hash && (
                    <div className="text-[9px] font-mono text-[#8E9BB4] mb-4 truncate bg-black/30 p-1.5 rounded border border-white/5">
                      <span className="text-[#00F0FF] font-bold">EIP-8004:</span> {agent.eip8004Hash}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => handleExecute(agent.id)}
                    disabled={isExecuting || isDead}
                    className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-9 holographic-btn font-mono"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Executing Mission...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1.5 fill-current" /> Execute Mission Workflow
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setTalkAgent(agent)}
                      className="border-[#00F0FF]/30 text-xs font-mono uppercase text-[#00F0FF] hover:bg-[#00F0FF]/10 bg-black/40 h-8"
                    >
                      <Bot className="w-3 h-3 mr-1 text-[#00F0FF]" /> Talk & Voice
                    </Button>
                    <Link href="/avatar-studio">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-xs font-mono uppercase text-[#8E9BB4] hover:text-white bg-black/30 h-8"
                      >
                        <Palette className="w-3 h-3 mr-1 text-[#00F0FF]" /> 3D Studio
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Global AI Companion Modal */}
      <AgentCompanionModal
        isOpen={!!talkAgent}
        onClose={() => setTalkAgent(null)}
        agent={talkAgent}
        user={user}
      />
    </div>
  );
}
