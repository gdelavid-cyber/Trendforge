'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Wallet,
  Shield,
  Plus,
  AlertTriangle,
  Skull,
  Dna,
  Loader2,
  Palette,
  Moon,
  Copy,
  Landmark,
  ArrowUpFromLine,
  BookOpen,
  Info,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';
import { SectionHelpBanner } from '@/components/guide/section-help-banner';

export function Web4AgentsClient({ user }: { user: any }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingAgentId, setExecutingAgentId] = useState<string | null>(null);
  const [talkAgent, setTalkAgent] = useState<any | null>(null);
  const [fundAgent, setFundAgent] = useState<any | null>(null);
  const [fundInfo, setFundInfo] = useState<any | null>(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [withdrawAgent, setWithdrawAgent] = useState<any | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

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

  const openFundPanel = async (agent: any) => {
    setFundAgent(agent);
    setFundInfo(null);
    setFundLoading(true);
    try {
      const res = await fetch(`/api/web4/agents/${agent.id}/deposits`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFundInfo(data);
        if (!data.configured) toast.error('Deposit vault is not configured yet — contact support.');
      } else {
        toast.error(data.error || 'Failed to load deposit details');
      }
    } catch {
      toast.error('Failed to load deposit details');
    } finally {
      setFundLoading(false);
    }
  };

  const copyText = async (text: string | null | undefined, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed — select the text manually');
    }
  };

  const handleWithdrawRequest = async () => {
    if (!withdrawAgent) return;
    const amount = parseFloat(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid USDC amount');
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: withdrawAgent.id, amountUsdc: amount, destination: withdrawDest }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Withdrawal queued for admin review.');
        setWithdrawAgent(null);
        setWithdrawAmount('');
        setWithdrawDest('');
      } else {
        toast.error(data.error || 'Withdrawal request failed');
      }
    } catch {
      toast.error('Withdrawal network error');
    } finally {
      setWithdrawing(false);
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
      case 'DORMANT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Moon className="w-3 h-3" />
            DORMANT — FUND TO ACTIVATE
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

  const getAvatarArch = (cfg: any) => {
    if (!cfg || !cfg.baseModel) return 'cyber_humanoid';
    switch (cfg.baseModel) {
      case 'QUANTUM_ANDROID': return 'quantum_android';
      case 'WALL_STREET_TITAN': return 'wall_street_titan';
      case 'COSMIC_ENTITY': return 'cosmic_entity';
      case 'CYBER_HUMANOID':
      default: return 'cyber_humanoid';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>ECONOMIC CITIZENS // AUTONOMOUS WALLETS // EIP-8004 IDENTITIES</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
            Web4 <span className="cyan-gold-gradient-text">Sovereign Agents</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            Autonomous economic citizens with non-custodial crypto wallets, visual avatars, and self-sustaining intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/manifesto">
            <Button variant="outline" size="sm" className="border-[#FFD700]/40 text-xs font-mono uppercase text-[#FFD700] bg-[#FFD700]/10 hover:bg-[#FFD700]/20 font-bold shadow-[0_0_12px_rgba(255,215,0,0.15)]">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#FFD700]" /> Web4 White Paper
            </Button>
          </Link>
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

      {/* Web4 & Autonomous Wallets Quick Guide Banner */}
      <div className="mb-8 rounded-2xl border border-[#00F0FF]/25 bg-gradient-to-r from-[#00F0FF]/[0.07] via-black/50 to-purple-500/[0.05] p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="font-mono font-bold text-xs uppercase text-white tracking-wider">
                What is Web4 & How Do Autonomous Wallets Work?
              </h3>
            </div>
            <p className="text-xs text-[#CCD6F6] leading-relaxed">
              <strong>Web4 represents the Autonomous Execution Layer of the Internet:</strong> AI agents hold non-custodial <strong>Autonomous Wallets</strong> capable of deploying capital, purchasing API compute, and settling real-world value directly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[#00F0FF] block font-bold mb-0.5">🔒 Zero-Default Risk</span>
                <span className="text-[#8E9BB4]">All agent wallets start with $0.00 available. Zero funds at risk by default.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-green-400 block font-bold mb-0.5">📥 Optional Deposits</span>
                <span className="text-[#8E9BB4]">Deposit USDC via Solana or Base only when you want an agent to execute live tasks.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[#FFD700] block font-bold mb-0.5">💸 100% Withdrawable</span>
                <span className="text-[#8E9BB4]">Withdraw unspent funds back to your external crypto wallet at any time.</span>
              </div>
            </div>
          </div>

          <Link href="/manifesto" className="shrink-0">
            <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              Read Manifesto &rarr;
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
            Use the No-Code Agent Studio to connect skill blocks and deploy your first autonomous economic citizen with an Autonomous Crypto Wallet.
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
            const isDead = agent.status === 'DEAD';
            const hasFunds = agent.walletBalance > 0;

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
                    {hasFunds ? (
                      getStatusBadge(agent.status)
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-[#8E9BB4] border border-white/10">
                        Dormant ($0.00)
                      </span>
                    )}
                  </div>

                  {/* Visual Avatar & Name Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)] flex-shrink-0">
                      <CompanionPortrait
                        archetype={getAvatarArch(agent.avatarConfig)}
                        className="w-full h-full"
                        seed={agent.name.length}
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
                      <span className="text-[10px] text-[#00F0FF] font-mono block mt-0.5">
                        {agent.avatarConfig?.nftTokenId || '#0001-NFT'} // {agent.archetype}
                      </span>
                    </div>
                  </div>

                  {/* Financial Telemetry & Autonomous Wallet - Display ONLY if funded */}
                  {hasFunds ? (
                    <div className="p-3.5 bg-black/50 rounded-xl border border-green-500/20 space-y-2.5 mb-4 shadow-[0_0_15px_rgba(34,197,94,0.08)]">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#8E9BB4] flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-green-400" /> Active Autonomous Funds:
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

                      {/* Autonomous Sustainability Score Meter */}
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-[#8E9BB4]">Autonomous Sustainability Health</span>
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

                      <div className="text-[9px] font-mono text-[#8E9BB4] pt-1 truncate border-t border-white/5">
                        <span className="text-[#00F0FF]">Wallet:</span> {agent.walletAddress}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1.5 mb-4 text-center">
                      <span className="text-[11px] font-mono font-bold text-[#8E9BB4] uppercase block">
                        Dormant // Unfunded NFT Bot
                      </span>
                      <p className="text-[10px] font-mono text-[#8E9BB4]/80">
                        Deposit capital to activate autonomous execution and unlock wallet telemetry.
                      </p>
                    </div>
                  )}

                  {/* EIP-8004 Protocol Tag */}
                  {agent.eip8004Hash && (
                    <div className="text-[9px] font-mono text-[#8E9BB4] mb-4 truncate bg-black/30 p-1.5 rounded border border-white/5">
                      <span className="text-[#00F0FF] font-bold">EIP-8004:</span> {agent.eip8004Hash}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="space-y-2 pt-2">
                  {!hasFunds ? (
                    <Button
                      onClick={() => openFundPanel(agent)}
                      className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-9 holographic-btn font-mono"
                    >
                      <Coins className="w-3.5 h-3.5 mr-1.5" /> Deposit To Fund Wallet
                    </Button>
                  ) : (
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
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openFundPanel(agent)}
                      data-tour="agent-fund"
                      className="border-green-500/30 text-xs font-mono uppercase text-green-400 hover:bg-green-500/10 bg-black/40 h-8"
                    >
                      <Landmark className="w-3 h-3 mr-1 text-green-400" /> Fund
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setWithdrawAgent(agent)}
                      data-tour="agent-withdraw"
                      disabled={agent.walletBalance <= 0 || isDead}
                      className="border-white/10 text-xs font-mono uppercase text-[#8E9BB4] hover:text-white bg-black/30 h-8 disabled:opacity-40"
                    >
                      <ArrowUpFromLine className="w-3 h-3 mr-1" /> Withdraw
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTalkAgent(agent)}
                      className="border-[#00F0FF]/30 text-xs font-mono uppercase text-[#00F0FF] hover:bg-[#00F0FF]/10 bg-black/40 h-8"
                    >
                      <Bot className="w-3 h-3 mr-1 text-[#00F0FF]" /> Talk &amp; Voice
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

      {/* Fund Panel — real on-chain USDC deposit instructions */}
      <AnimatePresence>
        {fundAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFundAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass-card border border-green-500/30 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-orbitron font-black uppercase text-sm text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-green-400" /> Fund {fundAgent.name}
                </h3>
                <button onClick={() => setFundAgent(null)} className="text-[#8E9BB4] hover:text-white text-xs font-mono">ESC ✕</button>
              </div>

              {fundLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="w-6 h-6 text-green-400 animate-spin mx-auto" />
                  <p className="text-[10px] text-[#8E9BB4] font-mono mt-2">ALLOCATING DEPOSIT CODE...</p>
                </div>
              ) : fundInfo && !fundInfo.configured ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-300">
                  The platform deposit vault is not configured yet. Deposits cannot be verified right now — nothing will be credited.
                </div>
              ) : fundInfo ? (
                <>
                  <div className="space-y-3">
                    <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#8E9BB4]">Step 1 — Send USDC (Solana) to</span>
                        <button onClick={() => copyText(fundInfo.treasury, 'Treasury address')} className="text-[#00F0FF] hover:text-white">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-white break-all">{fundInfo.treasury}</div>
                    </div>

                    <div className="p-3 bg-black/50 rounded-xl border border-green-500/20">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#8E9BB4]">Step 2 — Include memo (this agent's code)</span>
                        <button onClick={() => copyText(fundInfo.referenceCode, 'Memo code')} className="text-green-400 hover:text-white">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xl font-mono font-black tracking-[0.3em] text-green-400">{fundInfo.referenceCode}</div>
                    </div>

                    <ul className="text-[10px] text-[#8E9BB4] font-mono space-y-1 list-disc pl-4">
                      <li>USDC SPL transfers only, on Solana mainnet.</li>
                      <li>The memo MUST be exactly the code above or the deposit is rejected.</li>
                      <li>Credits appear after ≥1 network confirmation (verifier runs periodically).</li>
                      <li>Send from an exchange? Use the "memo / reference" field when available.</li>
                    </ul>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <div className="text-[10px] font-mono uppercase text-[#8E9BB4] mb-2">Deposit History</div>
                    {fundInfo.deposits.length === 0 ? (
                      <p className="text-[10px] text-[#8E9BB4] font-mono">No deposits yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {fundInfo.deposits.map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between gap-2 text-[11px] font-mono bg-black/40 rounded-lg px-3 py-2 border border-white/5">
                            <span className="truncate text-[#8E9BB4] max-w-[45%]">{d.txSignature.slice(0, 12)}…</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.status === 'CREDITED' ? 'bg-green-500/10 text-green-400' : d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-300'}`}>
                              {d.status}
                            </span>
                            <span className="text-white font-bold">${d.amountUsdc.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Request Modal */}
      <AnimatePresence>
        {withdrawAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setWithdrawAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass-card border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-orbitron font-black uppercase text-sm text-white flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4 text-gold" /> Withdraw — {withdrawAgent.name}
                </h3>
                <button onClick={() => setWithdrawAgent(null)} className="text-[#8E9BB4] hover:text-white text-xs font-mono">ESC ✕</button>
              </div>

              <p className="text-[10px] text-[#8E9BB4] font-mono">
                Available balance: <span className="text-green-400 font-bold">${withdrawAgent.walletBalance.toFixed(2)} USDC</span>.
                Requests go to admin review; the debit settles only on approval.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8E9BB4] block mb-1">Amount (USDC)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="25.00"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8E9BB4] block mb-1">Destination Solana address</label>
                  <input
                    type="text"
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    placeholder="Your wallet address"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <Button
                  onClick={handleWithdrawRequest}
                  disabled={withdrawing}
                  className="w-full gold-gradient text-black font-extrabold uppercase text-xs h-9 holographic-btn font-mono"
                >
                  {withdrawing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3 mr-1.5" />}
                  Request Withdrawal
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
