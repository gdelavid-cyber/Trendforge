'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Key,
  Settings,
  CheckCircle,
  Loader2,
  DollarSign,
  Award,
  Zap,
  Bot,
  Sparkles,
  HeartHandshake,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

const ALL_SKILLS = [
  'copywriting',
  'ai-tools',
  'social-media',
  'development',
  'ai-agents',
  'automation',
  'design',
  'video-editing',
  'marketing',
  'sales',
  'data-analysis',
  'writing',
];

const BADGE_MAP: Record<string, { label: string; desc: string; icon: any }> = {
  first_move: { label: 'First Move', desc: 'Executed first task', icon: Zap },
  first_agent_run: { label: 'Swarm Commander', desc: 'Deployed first autonomous agent', icon: Bot },
  hundred_club: { label: '$100 Club', desc: 'Earned first $100', icon: DollarSign },
  thousand_club: { label: '$1,000 Club', desc: 'Earned first $1,000', icon: Award },
  top_earner: { label: 'Top Earner Partner', desc: 'Success-Fee Opted In & Verified Earner', icon: Sparkles },
  referral_champion: { label: 'Growth Champion', desc: 'Invited peers to platform', icon: Share2 },
};

interface Props {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    skills: string[];
    riskTolerance: string;
    totalEarnings: number;
    favorCredits: number;
    isVIP: boolean;
    isMentor: boolean;
    referralCode?: string | null;
    successFeeOptIn?: boolean;
    communityPoints?: number;
    bonusAgentRuns?: number;
    createdAt: string | null;
  } | null;
  completedTasks: number;
  agentRunsCount: number;
  badges: Array<{ badgeId: string; earnedAt: string | null }>;
}

export function ProfileClient({ user, completedTasks, agentRunsCount, badges }: Props) {
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [riskTolerance, setRiskTolerance] = useState(user?.riskTolerance ?? 'MEDIUM');
  const [successFeeOptIn, setSuccessFeeOptIn] = useState<boolean>(user?.successFeeOptIn ?? false);
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, riskTolerance, successFeeOptIn }),
      });
      if (res.ok) toast.success('Profile preferences updated!');
      else toast.error('Failed to update');
    } catch {
      toast.error('Error saving profile');
    }
    setSaving(false);
  };

  const handleToggleSuccessFee = async () => {
    const nextVal = !successFeeOptIn;
    setSuccessFeeOptIn(nextVal);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successFeeOptIn: nextVal }),
      });
      if (res.ok) {
        toast.success(
          nextVal
            ? 'Success-Fee enabled! +2 Bonus Weekly Agent Runs unlocked.'
            : 'Success-Fee disabled.'
        );
      }
    } catch (_) {
      toast.error('Failed to update success-fee toggle');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error ?? 'Failed to update password');
      }
    } catch {
      toast.error('Error changing password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">
            Operative <span className="cyan-gold-gradient-text">Profile</span>
          </h1>
          <p className="text-xs text-[#8892B0] font-mono mt-1">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
            {user?.role ?? 'FREE'} TIER
          </span>
          <Link href="/referrals">
            <Button size="sm" variant="outline" className="border-white/10 text-xs font-mono text-[#8892B0] hover:text-white">
              <Share2 className="w-3.5 h-3.5 mr-1" /> Referral Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* "My Impact" Telemetry Grid */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-8">
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#FFD700] mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#FFD700]" /> My Impact & Verified Earnings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs font-mono">
            <span className="text-[#8892B0] block text-[10px] uppercase">Total Earnings</span>
            <span className="text-2xl font-bold text-green-400 mt-1 block">
              ${(user?.totalEarnings ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs font-mono">
            <span className="text-[#8892B0] block text-[10px] uppercase">Completed Moves</span>
            <span className="text-2xl font-bold text-white mt-1 block">{completedTasks}</span>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs font-mono">
            <span className="text-[#8892B0] block text-[10px] uppercase">Agent Swarm Runs</span>
            <span className="text-2xl font-bold text-[#00F0FF] mt-1 block">{agentRunsCount}</span>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-xs font-mono">
            <span className="text-[#8892B0] block text-[10px] uppercase">Community Points</span>
            <span className="text-2xl font-bold text-purple-400 mt-1 block">{user?.communityPoints ?? 0}</span>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8892B0] block mb-3">
            Earned Operative Badges:
          </span>
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => {
              const info = BADGE_MAP[b.badgeId] || { label: b.badgeId, desc: 'Earned badge', icon: Award };
              const Icon = info.icon;
              return (
                <div
                  key={b.badgeId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-[#FFD700]/30 text-[#FFD700] text-xs font-mono"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-bold">{info.label}</span>
                </div>
              );
            })}
            {badges.length === 0 && (
              <span className="text-xs text-[#8892B0] font-mono">
                Complete your first task or agent run to unlock milestone badges.
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Success-Fee Model Opt-In Box */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-8 border border-[#00F0FF]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Success-Fee Partnership Model
              </h3>
            </div>
            <p className="text-xs text-[#8892B0] font-sans max-w-xl">
              Align platform incentives with your earnings: we take a 5% fee on verified agent income above $1,000. In exchange, you unlock <strong>+2 extra free Swarm runs every week</strong>, priority worker queuing, and a Top Earner badge.
            </p>
          </div>

          <Button
            onClick={handleToggleSuccessFee}
            className={`font-mono text-xs uppercase px-5 h-9 font-bold ${
              successFeeOptIn
                ? 'bg-green-500 hover:bg-green-600 text-black'
                : 'bg-black/60 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/10'
            }`}
          >
            {successFeeOptIn ? '✓ Active (+2 Runs)' : 'Enable 5% Success-Fee'}
          </Button>
        </div>
      </motion.div>

      {/* Preferences & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#00F0FF]" /> Skills & Domain Expertise
          </h3>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((skill) => {
              const active = skills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                    active
                      ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/40'
                      : 'bg-black/40 text-[#8892B0] border-white/5 hover:border-white/20'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          <Button onClick={handleSave} disabled={saving} className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : 'Save Skills'}
          </Button>
        </div>

        {/* Change Password */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-[#00F0FF]" /> Security & Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3 font-sans">
            <Input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-black/50 border-white/10 text-white text-xs h-9"
            />
            <Input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-black/50 border-white/10 text-white text-xs h-9"
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black/50 border-white/10 text-white text-xs h-9"
            />
            <Button
              type="submit"
              disabled={updatingPassword}
              className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4 w-full"
            >
              {updatingPassword ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
