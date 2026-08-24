'use client';

import { useEffect, useState } from 'react';
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
  BrainCircuit,
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

  // Personal brain (BYOK) state
  const [brainConnected, setBrainConnected] = useState(false);
  const [brainProvider, setBrainProvider] = useState('openrouter');
  const [brainModel, setBrainModel] = useState('');
  const [brainBaseUrl, setBrainBaseUrl] = useState('');
  const [brainApiKey, setBrainApiKey] = useState('');
  const [brainMaskedKey, setBrainMaskedKey] = useState('');
  const [savingBrain, setSavingBrain] = useState(false);
  const [loadingBrain, setLoadingBrain] = useState(true);

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

  const loadBrain = async () => {
    setLoadingBrain(true);
    try {
      const res = await fetch('/api/settings/llm');
      const data = await res.json();
      if (res.ok && data.connected) {
        setBrainConnected(true);
        setBrainProvider(data.config.provider);
        setBrainModel(data.config.model);
        setBrainBaseUrl(data.config.baseUrl ?? '');
        setBrainMaskedKey(data.config.maskedKey);
      } else {
        setBrainConnected(false);
        setBrainMaskedKey('');
      }
    } catch {
      // Non-fatal — section just shows defaults.
    } finally {
      setLoadingBrain(false);
    }
  };

  useEffect(() => {
    loadBrain();
  }, []);

  const handleSaveBrain = async () => {
    if (!brainModel.trim()) {
      toast.error('Model is required');
      return;
    }
    if (!brainApiKey.trim() && !brainConnected) {
      toast.error('API key is required');
      return;
    }
    if (brainProvider === 'custom' && !brainBaseUrl.trim()) {
      toast.error('Base URL is required for custom providers');
      return;
    }
    setSavingBrain(true);
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: brainProvider,
          model: brainModel,
          baseUrl: brainProvider === 'custom' ? brainBaseUrl : undefined,
          apiKey: brainApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Personal brain connected! Your companion now uses it for every task.');
        setBrainApiKey('');
        setBrainMaskedKey(data.config.maskedKey);
        setBrainConnected(true);
      } else {
        toast.error(data.error ?? 'Failed to connect brain');
      }
    } catch {
      toast.error('Error connecting brain');
    } finally {
      setSavingBrain(false);
    }
  };

  const handleDisconnectBrain = async () => {
    setSavingBrain(true);
    try {
      const res = await fetch('/api/settings/llm', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Personal brain disconnected — platform default restored.');
        setBrainConnected(false);
        setBrainMaskedKey('');
        setBrainApiKey('');
      } else {
        toast.error('Failed to disconnect');
      }
    } catch {
      toast.error('Error disconnecting brain');
    } finally {
      setSavingBrain(false);
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

      {/* Personal Brain (BYOK) */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-8 border border-[#FFD700]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#FFD700]" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Personal Brain (BYOK)</h3>
            {loadingBrain ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8892B0]" />
            ) : brainConnected ? (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Connected {brainMaskedKey && `· ${brainMaskedKey}`}
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 text-[#8892B0] border border-white/10">
                Platform Default
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-[#8892B0] font-sans max-w-xl mb-4">
          Plug in your own OpenAI-compatible key and your companion uses it as its brain for every task and chat — encrypted at rest, never shown again. Falls back to the platform default when disconnected.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
          <div>
            <label className="text-[10px] font-mono uppercase text-[#8892B0] block mb-1">Provider</label>
            <select
              value={brainProvider}
              onChange={(e) => setBrainProvider(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md text-white text-xs h-9 px-2"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="custom">Custom (OpenAI-compatible URL)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-[#8892B0] block mb-1">Model</label>
            <Input
              placeholder={brainProvider === 'openrouter' ? 'e.g. anthropic/claude-sonnet-4' : 'e.g. qwen3-coder'}
              value={brainModel}
              onChange={(e) => setBrainModel(e.target.value)}
              className="bg-black/50 border-white/10 text-white text-xs h-9"
            />
          </div>
          {brainProvider === 'custom' && (
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase text-[#8892B0] block mb-1">Base URL</label>
              <Input
                placeholder="https://your-gateway.com/v1"
                value={brainBaseUrl}
                onChange={(e) => setBrainBaseUrl(e.target.value)}
                className="bg-black/50 border-white/10 text-white text-xs h-9"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="text-[10px] font-mono uppercase text-[#8892B0] block mb-1">
              API Key {brainConnected && <span className="normal-case">(leave blank to keep current)</span>}
            </label>
            <Input
              type="password"
              placeholder={brainConnected ? '••••••••••••' : 'sk-or-v1-…'}
              value={brainApiKey}
              onChange={(e) => setBrainApiKey(e.target.value)}
              className="bg-black/50 border-white/10 text-white text-xs h-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button
            onClick={handleSaveBrain}
            disabled={savingBrain || loadingBrain}
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4"
          >
            {savingBrain ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : brainConnected ? 'Update Brain' : 'Connect Brain'}
          </Button>
          {brainConnected && (
            <Button
              onClick={handleDisconnectBrain}
              disabled={savingBrain}
              variant="outline"
              className="border-red-500/40 text-red-400 hover:text-red-300 text-xs font-mono uppercase h-8 px-4"
            >
              Disconnect
            </Button>
          )}
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
