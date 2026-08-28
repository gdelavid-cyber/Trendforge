'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bot, 
  TrendingUp, 
  Users, 
  BrainCircuit, 
  Compass, 
  Layers, 
  FileCheck2, 
  LineChart,
  ShieldAlert,
  Play
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/web4/swarm', label: 'Command HUD', icon: Bot },
  { href: '/web4/swarm/revenue', label: 'Revenue Analytics', icon: TrendingUp },
  { href: '/web4/swarm/agents', label: 'Colony & Agents', icon: Users },
  { href: '/web4/swarm/brain', label: 'Brain Decisions', icon: BrainCircuit },
  { href: '/web4/swarm/strategy', label: 'Strategy History', icon: Compass },
  { href: '/web4/swarm/tasks', label: 'Task Pipeline', icon: Layers },
  { href: '/web4/swarm/evidence', label: 'Attestation & Proof', icon: FileCheck2 },
  { href: '/web4/swarm/investor', label: 'Investor Reports', icon: LineChart },
];

export function SwarmNav({ isSurvival = false, isDryRun = false }: { isSurvival?: boolean; isDryRun?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#0d121f]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-16 z-30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mode Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
              Swarm v2.0 Production
            </span>
          </div>

          {isSurvival && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              SURVIVAL MODE ACTIVE
            </span>
          )}

          {isDryRun && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              DRY-RUN MODE
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
