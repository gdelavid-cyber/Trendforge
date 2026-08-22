'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Trophy,
  Zap,
  Flame,
  Crown,
  Shield,
  Coins,
  Loader2,
  CheckCircle,
  Play,
  TrendingUp,
  Bot,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BATTLE_TIERS } from '@/lib/battles/rewards';
import Link from 'next/link';

export function BattlesClient({ user }: { user: any }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengerId, setChallengerId] = useState<string>('');
  const [defenderId, setDefenderId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('BRONZE');
  const [fighting, setFighting] = useState(false);
  const [lastBattleResult, setLastBattleResult] = useState<any | null>(null);

  const fetchInitialData = async () => {
    try {
      const [agentsRes, battlesRes] = await Promise.all([
        fetch('/api/web4/agents'),
        fetch('/api/web4/battles'),
      ]);

      const agentsData = await agentsRes.json();
      const battlesData = await battlesRes.json();

      if (agentsData.success && agentsData.agents) {
        setAgents(agentsData.agents);
        if (agentsData.agents.length >= 2) {
          setChallengerId(agentsData.agents[0].id);
          setDefenderId(agentsData.agents[1].id);
        } else if (agentsData.agents.length === 1) {
          setChallengerId(agentsData.agents[0].id);
        }
      }

      if (battlesData.success && battlesData.battles) {
        setBattles(battlesData.battles);
      }
    } catch {
      toast.error('Failed to load battle arena');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleStartBattle = async () => {
    if (!challengerId || !defenderId) {
      toast.error('Select both a Challenger and a Defender agent.');
      return;
    }

    if (challengerId === defenderId) {
      toast.error('An agent cannot battle itself.');
      return;
    }

    setFighting(true);
    setLastBattleResult(null);

    // Spoken Trash-talk at match start
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const challenger = agents.find((a) => a.id === challengerId);
      const trashTalk = `${challenger?.name || 'Challenger'}: Initiating combat sequence! Prepare for total liquidity extraction.`;
      const u = new SpeechSynthesisUtterance(trashTalk);
      u.rate = 1.1;
      window.speechSynthesis.speak(u);
    }

    try {
      const res = await fetch('/api/battles/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengerId, defenderId, tier: selectedTier }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastBattleResult(data);
        toast.success(`Match Concluded! Winner: ${data.winner.name} (+$${data.winner.payout} USDC Bounty)`);
        
        // Spoken Winner Celebration
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const victorySpeech = `Victory confirmed! ${data.winner.name} takes the bounty pool of ${data.winner.payout} dollars!`;
          const uVictory = new SpeechSynthesisUtterance(victorySpeech);
          uVictory.rate = 1.05;
          setTimeout(() => window.speechSynthesis.speak(uVictory), 600);
        }

        fetchInitialData();
      } else {
        toast.error(data.error || 'Battle match failed');
      }
    } catch {
      toast.error('Network error during battle');
    } finally {
      setFighting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/20 text-[#FF007A] text-xs font-mono mb-2">
          <Swords className="w-3.5 h-3.5" />
          <span>GAMIFIED ECONOMIC DUELS // TIERED USDC BOUNTY POOLS</span>
        </div>
        <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Agent <span className="cyan-gold-gradient-text">Battle Arena & Bounty Pools</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
          PVP economic speedruns where agents compete for USDC liquidity pools (70% Winner, 20% Runner-Up, 10% Platform).
        </p>
      </div>

      {/* 4 Tiered Bounty Pools Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(BATTLE_TIERS).map(([key, config]) => (
          <div
            key={key}
            onClick={() => setSelectedTier(key)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedTier === key
                ? `${config.color} border-current shadow-[0_0_20px_rgba(0,240,255,0.2)] scale-[1.02]`
                : 'bg-black/40 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-xs font-mono font-bold uppercase mb-1">{config.badge}</div>
            <div className="text-2xl font-black text-white font-mono mb-2">${config.prizePoolUsdc} USDC Pool</div>
            <div className="text-[10px] text-[#8E9BB4] font-mono space-y-0.5 border-t border-white/5 pt-2">
              <div>Entry Fee: ${config.entryFeeUsdc} USDC</div>
              <div>1st Place: <span className="text-green-400 font-bold">${config.winnerPayoutUsdc} USDC (70%)</span></div>
              <div>2nd Place: <span className="text-yellow-400 font-bold">${config.runnerUpPayoutUsdc} USDC (20%)</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Arena Match Maker Setup */}
      <div className="glass-card p-6 mb-10 border border-white/10">
        <h3 className="text-xs font-mono uppercase font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#00F0FF]" /> Match Setup: {BATTLE_TIERS[selectedTier].name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-mono text-[#8E9BB4] uppercase block mb-1">Challenger Agent</label>
            <select
              value={challengerId}
              onChange={(e) => setChallengerId(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${a.walletBalance.toFixed(2)} USDC | Score: {a.survivalScore}/100)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#8E9BB4] uppercase block mb-1">Defender Agent</label>
            <select
              value={defenderId}
              onChange={(e) => setDefenderId(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${a.walletBalance.toFixed(2)} USDC | Score: {a.survivalScore}/100)
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleStartBattle}
          disabled={fighting || agents.length < 2}
          className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
        >
          {fighting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulating 3-Round Tournament & Distributing USDC...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4 mr-2 fill-current" /> Enter {BATTLE_TIERS[selectedTier].name} (${BATTLE_TIERS[selectedTier].entryFeeUsdc} Entry)
            </>
          )}
        </Button>
      </div>

      {/* Match Results Card */}
      {lastBattleResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-10 border border-[#00F0FF]/40 bg-[#00F0FF]/5"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#00F0FF]">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span>MATCH RESULT // WINNER: {lastBattleResult.winner.name}</span>
            </div>
            <span className="text-sm font-mono font-bold text-green-400">
              Bounty Paid: +${lastBattleResult.winner.payout} USDC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lastBattleResult.rounds.map((r: any) => (
              <div key={r.round} className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs font-mono">
                <div className="text-[#8E9BB4] text-[10px] uppercase">Round {r.round}: {r.name}</div>
                <div className="flex justify-between text-white font-bold my-1">
                  <span>Challenger: {r.challengerScore}</span>
                  <span>Defender: {r.defenderScore}</span>
                </div>
                <div className="text-green-400 text-[10px] font-bold">
                  Round Winner: {r.challengerScore > r.defenderScore ? 'Challenger' : 'Defender'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Battles List */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-[#FFD700]" /> Recent Tournament Matches
        </h3>

        {battles.length === 0 ? (
          <div className="glass-card p-8 text-center text-[#8E9BB4] text-xs font-mono">
            No battles recorded yet. Launch a match above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {battles.map((b) => (
              <div key={b.id} className="glass-card p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-[#00F0FF]">
                    {b.arenaType}
                  </span>
                  <div className="text-xs font-bold text-white font-mono mt-1">
                    {b.challenger.name} <span className="text-[#FF007A]">vs</span> {b.defender.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-green-400 font-mono">+${b.yieldGenerated} USDC</div>
                  <span className="text-[9px] font-mono text-[#8E9BB4]">Status: {b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
