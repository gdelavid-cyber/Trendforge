'use client';

import { useEffect, useState } from 'react';
import { Download, Sparkles } from 'lucide-react';

interface CompanionData {
  [key: string]: any;
  name: string;
  level: number;
  rarity: string;
  totalEarnings: number;
  tasksCompleted: number;
}

interface ActivityEvent {
  at: string;
  text: string;
}

export function CompanionCard({ trendBalance, realIncomeUsdc = 0 }: { trendBalance?: number; realIncomeUsdc?: number }) {
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    fetch('/api/companion', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b?.companion && setCompanion(b.companion))
      .catch(() => {});
    fetch('/api/companion/activity', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b?.activity && setActivity(b.activity))
      .catch(() => {});
  }, []);

  if (!companion) return null;

  return (
    <div className="glass-card p-5 mb-8 border border-white/[0.08]" data-tour="dashboard-companion">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Identity */}
        <div className="lg:w-1/3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F0FF]">
              Your Companion
            </span>
          </div>
          <div className="font-orbitron font-black text-2xl text-white tracking-wider">{companion.name}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs font-mono" data-tour="dashboard-balance">
            <span className="text-[#8E9BB4]">Level</span>
            <span className="text-white text-right">{companion.level}</span>
            <span className="text-[#8E9BB4]">Rarity</span>
            <span className="text-gold text-right uppercase">{companion.rarity}</span>
            <span className="text-[#8E9BB4]">Tasks Completed</span>
            <span className="text-white text-right">{companion.tasksCompleted}</span>
            <span className="text-[#8E9BB4]">Real Income</span>
            <span className="text-green-400 text-right" title="Ledger-backed only: deposits, trade proceeds, battle pots">
              ${realIncomeUsdc.toFixed(2)}
            </span>
            {typeof trendBalance === 'number' && (
              <>
                <span className="text-[#8E9BB4]">TREND</span>
                <span className="text-[#00F0FF] text-right">{trendBalance.toLocaleString()}</span>
              </>
            )}
          </div>
          <a
            href="/api/companion/export"
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00F0FF]/30 bg-[#00F0FF]/[0.06] text-[11px] font-mono uppercase tracking-wider text-[#00F0FF] hover:bg-[#00F0FF]/15 transition-colors"
          >
            <Download className="w-3 h-3" /> Export .trendly
          </a>
        </div>

        {/* Activity feed */}
        <div className="lg:w-2/3 lg:border-l lg:border-white/[0.06] lg:pl-6">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-3">
            Recent Activity
          </div>
          {activity.length === 0 ? (
            <p className="text-xs font-mono text-[#8E9BB4] py-4">
              No runs yet. Launch a task with Co-pilot or Autopilot and your companion's work shows up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 5).map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]/70 mt-1.5 shrink-0" />
                  <span className="text-[#B0B0C8] leading-relaxed">
                    <span className="text-[#00F0FF] font-mono">{companion.name}</span> {e.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
