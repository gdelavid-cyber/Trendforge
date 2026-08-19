'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Key, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ALL_SKILLS = ['copywriting', 'ai-tools', 'social-media', 'development', 'ai-agents', 'automation', 'design', 'video-editing', 'marketing', 'sales', 'data-analysis', 'writing'];

interface Props {
  user: {
    name: string | null; email: string; role: string; skills: string[];
    riskTolerance: string; totalEarnings: number; favorCredits: number;
    isVIP: boolean; isMentor: boolean; createdAt: string | null;
  } | null;
  completedTasks: number;
}

export function ProfileClient({ user, completedTasks }: Props) {
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [riskTolerance, setRiskTolerance] = useState(user?.riskTolerance ?? 'MEDIUM');
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, riskTolerance }),
      });
      if (res.ok) toast.success('Profile preferences updated!');
      else toast.error('Failed to update');
    } catch { toast.error('Error saving profile'); }
    setSaving(false);
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

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data?.url) window.open(data.url, '_blank');
      else toast.error('Failed to open billing portal');
    } catch { toast.error('Error opening portal'); }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-8">
          <User className="w-7 h-7 text-gold" /> Profile Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats & Identity */}
          <div className="bg-card-bg border border-border-subtle rounded-lg p-6 h-fit">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-gold">{(user?.name ?? 'U')?.[0]}</span>
            </div>
            <h2 className="text-center font-semibold text-lg">{user?.name ?? 'User'}</h2>
            <p className="text-center text-sm text-muted-foreground mb-4">{user?.email ?? ''}</p>
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-xs bg-gold/20 text-gold px-2.5 py-1 rounded-full font-mono font-bold uppercase">{user?.role ?? 'FREE'}</span>
              {user?.isVIP && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">VIP</span>}
              {user?.isMentor && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Mentor</span>}
            </div>
            <div className="space-y-2 text-sm border-t border-border-subtle pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Earnings</span><span className="text-green-400 font-bold font-mono">${(user?.totalEarnings ?? 0).toLocaleString('en-US')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Power Moves Done</span><span className="font-mono">{completedTasks}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Favor Credits</span><span className="text-pink-400 font-mono">{user?.favorCredits ?? 0}</span></div>
            </div>
            <Button variant="outline" className="w-full mt-6 border-gold/30 text-gold" onClick={handleManageSubscription}>
              <Settings className="w-4 h-4 mr-1" /> Manage Subscription
            </Button>
          </div>

          {/* Settings & Password Change */}
          <div className="md:col-span-2 space-y-6">
            {/* Password Change Card */}
            <div className="bg-card-bg border border-border-subtle rounded-lg p-6">
              <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-gold" /> Change Password
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Update your administrative credentials securely</p>
              
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-dark-navy border-border-subtle text-sm h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-dark-navy border-border-subtle text-sm h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-dark-navy border-border-subtle text-sm h-10"
                  />
                </div>
                <Button type="submit" className="gold-gradient text-black font-bold text-xs h-9 px-4 mt-2" disabled={updatingPassword}>
                  {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Update Password
                </Button>
              </form>
            </div>

            {/* Skills */}
            <div className="bg-card-bg border border-border-subtle rounded-lg p-6">
              <h3 className="font-display font-semibold mb-1">Skills & Focus</h3>
              <p className="text-xs text-muted-foreground mb-3">Select your skills to personalize task feeds</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map((skill) => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      skills.includes(skill) ? 'bg-gold text-black' : 'bg-dark-navy text-muted-foreground hover:border-gold/30 border border-border-subtle'
                    }`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            <div className="bg-card-bg border border-border-subtle rounded-lg p-6">
              <h3 className="font-display font-semibold mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-gold" /> Risk Tolerance</h3>
              <p className="text-xs text-muted-foreground mb-3">Filter tasks suited for your profile</p>
              <div className="flex gap-3">
                {['LOW', 'MEDIUM', 'HIGH'].map((r) => (
                  <button key={r} onClick={() => setRiskTolerance(r)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      riskTolerance === r ? 'bg-gold text-black' : 'bg-dark-navy text-muted-foreground border border-border-subtle'
                    }`}>
                    {r === 'LOW' ? '🛡️ Low' : r === 'MEDIUM' ? '⚖️ Medium' : '🚀 High'}
                  </button>
                ))}
              </div>
            </div>

            <Button className="gold-gradient text-black font-bold" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Preferences
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
