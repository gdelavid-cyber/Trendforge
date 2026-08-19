'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Trophy, HandHeart, Sparkles, Flame, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getWealthPoints, getLevelInfo, getStreak, getBadges } from '@/app/gamification';

interface Favor {
  id: string;
  description: string;
  fromUser: string;
  task: string | null;
  creditValue: number;
}

interface Props {
  favors: Favor[];
  leaderboard: any[];
}

export function CommunityClient({ favors: initialFavors, leaderboard }: Props) {
  const [favors, setFavors] = useState<Favor[]>(initialFavors);
  const [favorDesc, setFavorDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateFavor = async () => {
    if (!favorDesc.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/favors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: favorDesc }),
      });
      if (res.ok) {
        toast.success('Favor posted!');
        setFavorDesc('');
        const listRes = await fetch('/api/favors');
        if (listRes.ok) {
          const data = await listRes.json();
          setFavors(data.favors.map((f: any) => ({
            id: f.id,
            description: f.description,
            fromUser: f.fromUser?.name ?? 'Anonymous',
            task: f.task?.title ?? null,
            creditValue: f.creditValue
          })));
        }
      } else {
        toast.error('Failed to post favor');
      }
    } catch {
      toast.error('Error posting favor');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamically parse gamification stats for all users in the top 100 leaderboard
  const parsedLeaderboard = (leaderboard || []).map((u: any, index: number) => {
    const completedCount = u.userTasks?.filter((ut: any) => ut.status === 'COMPLETED').length ?? 0;
    const points = getWealthPoints(u.totalEarnings);
    const lvlInfo = getLevelInfo(u.totalEarnings);
    const streak = getStreak(u.userTasks || []);
    const badges = getBadges(u.totalEarnings, completedCount);

    return {
      rank: index + 1,
      id: u.id,
      name: u.name || 'Anonymous Forger',
      level: lvlInfo.level,
      levelName: lvlInfo.name,
      wealthPoints: points,
      streak,
      badgeCount: badges.length,
    };
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl text-white uppercase tracking-wider flex items-center gap-2 mb-2">
          <Users className="w-7 h-7 text-[#00F0FF]" /> Operative Network
        </h1>
        <p className="text-xs text-[#8892B0] font-mono uppercase tracking-wider">
          Establish links, assist peers, and claim top rank in the global terminal registry
        </p>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] mb-8 p-1 rounded-full">
          <TabsTrigger value="leaderboard" className="text-xs uppercase font-bold px-6 py-2 rounded-full data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">
            <Trophy className="w-3.5 h-3.5 mr-1.5" /> Global Leaderboard
          </TabsTrigger>
          <TabsTrigger value="favors" className="text-xs uppercase font-bold px-6 py-2 rounded-full data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">
            <HandHeart className="w-3.5 h-3.5 mr-1.5" /> Favor Board
          </TabsTrigger>
          <TabsTrigger value="mentorship" className="text-xs uppercase font-bold px-6 py-2 rounded-full data-[state=active]:bg-[#00F0FF] data-[state=active]:text-black">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Mentorship Sandbox
          </TabsTrigger>
        </TabsList>

        {/* Global Leaderboard with Glass Table Header and Alternating Rows */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="glass-card p-4 mb-4 flex items-center justify-between text-xs font-mono text-[#8892B0]">
            <span>TOP 100 OPERATIVES SORTED BY TOTAL EARNINGS</span>
            <span className="text-[#00F0FF]">LIVE REGISTRY TELEMETRY</span>
          </div>

          <div className="glass-card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] text-xs font-mono uppercase tracking-wider text-[#8892B0]">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Operative</div>
              <div className="col-span-3 text-center">Terminal Level</div>
              <div className="col-span-3 text-right">Total Earnings</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/[0.04]">
              {parsedLeaderboard.map((u, i) => {
                const isTop1 = i === 0;
                const isTop2 = i === 1;
                const isTop3 = i === 2;

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.4) }}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'
                    } hover:bg-[#00F0FF]/[0.03]`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        isTop1 ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]' :
                        isTop2 ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' :
                        isTop3 ? 'bg-[#FF6B9D] text-white shadow-[0_0_15px_rgba(255,107,157,0.5)]' :
                        'bg-white/[0.05] text-[#8892B0]'
                      }`}>
                        {u.rank}
                      </div>
                    </div>

                    {/* Operative Name & Streak */}
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="font-bold text-white text-sm">@{u.name}</span>
                      {u.streak > 0 && (
                        <span className="text-[9px] text-[#FFD700] font-mono bg-[#FFD700]/10 border border-[#FFD700]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-[#FFD700]" /> {u.streak}d
                        </span>
                      )}
                    </div>

                    {/* Terminal Level */}
                    <div className="col-span-3 text-center">
                      <span className="text-[10px] text-[#00F0FF] font-bold font-mono bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2.5 py-0.5 rounded-full uppercase">
                        Lvl {u.level}: {u.levelName}
                      </span>
                    </div>

                    {/* Wealth Points */}
                    <div className="col-span-3 text-right font-mono">
                      <span className="font-bold text-green-400 text-sm flex items-center justify-end gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> ${(u.wealthPoints / 100).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-[#8892B0] block mt-0.5">
                        {u.badgeCount} Badges Unlocked
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {parsedLeaderboard.length === 0 && (
            <div className="glass-card p-12 text-center text-[#8892B0] text-sm font-sans">
              No operative rankings logged yet. Be the first to execute a Power Move!
            </div>
          )}
        </TabsContent>

        {/* Favor Board */}
        <TabsContent value="favors" className="space-y-4">
          <div className="glass-card p-6 mb-6">
            <h3 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-3">Post a Favor Request</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="terminal-input flex-1 h-11"
                placeholder="Declare collaboration or assistance details..."
                value={favorDesc}
                onChange={(e: any) => setFavorDesc(e.target?.value ?? '')}
              />
              <Button className="h-11 px-8 text-xs" onClick={handleCreateFavor} disabled={submitting}>
                Broadcast Favor
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {favors.map((f: any, i: number) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex items-center gap-4 group"
              >
                <div className="p-2.5 rounded-full bg-[#FF6B9D]/10 border border-[#FF6B9D]/20 text-[#FF6B9D]">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{f.description}</p>
                  <div className="flex items-center gap-2 text-xs text-[#8892B0] mt-1.5 font-mono">
                    <span>by @{f.fromUser}</span>
                    {f.task && <span>· Move: {f.task}</span>}
                  </div>
                </div>
                <span className="text-xs text-[#FFD700] font-bold font-mono bg-[#FFD700]/10 border border-[#FFD700]/20 px-3 py-1 rounded-full">
                  {f.creditValue} Credit{f.creditValue !== 1 ? 's' : ''}
                </span>
              </motion.div>
            ))}
            {favors.length === 0 && (
              <div className="glass-card p-12 text-center text-[#8892B0] text-sm">
                No active favors in the registry.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Mentorship */}
        <TabsContent value="mentorship">
          <div className="glass-card p-10 text-center max-w-xl mx-auto space-y-4">
            <Sparkles className="w-8 h-8 text-[#FFD700] mx-auto mb-2 animate-pulse" />
            <h3 className="text-lg text-white uppercase tracking-wider">Mentorship Sandbox</h3>
            <p className="text-xs text-[#8892B0] max-w-sm mx-auto leading-relaxed">
              Connect with senior wealth architects to optimize operations. Mentors receive 10% commission on matches, verified by the blockchain sandbox.
            </p>
            <Button
              className="h-11 px-8 text-xs"
              onClick={() => {
                fetch('/api/mentorship/apply', { method: 'POST' })
                  .then(() => toast.success('Application loaded into peer review pool.'))
                  .catch(() => toast.error('Connection failed'));
              }}
            >
              Apply for Mentorship Match
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
