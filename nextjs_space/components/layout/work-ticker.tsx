'use client';

import { useMyWork } from '@/lib/hooks/use-my-work';
import { Loader2, CheckCircle2, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AgeBadge } from '@/components/ui/age-badge';

export function WorkTicker() {
  const { executions } = useMyWork();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = executions
    .filter((e) => !dismissed.has(e.id))
    .filter((e) => ['QUEUED', 'RUNNING', 'AWAITING_APPROVAL'].includes(e.status))
    .slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="border-b border-white/[0.08] bg-[#06060E]/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-[1260px] mx-auto px-4 py-2 space-y-1.5">
        {visible.map((e) => {
          const running = ['QUEUED', 'RUNNING'].includes(e.status);
          const needsApproval = e.status === 'AWAITING_APPROVAL';

          return (
            <div
              key={e.id}
              className="flex items-center gap-3 text-xs font-mono py-0.5 border-b border-white/[0.03] last:border-none"
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              )}
              <Link
                href={`/dashboard/my-work/${e.id}`}
                className="flex-1 truncate hover:text-cyan-400 flex items-center gap-2"
              >
                <span className="font-semibold text-white truncate">{e.trendName}</span>
                <span className="text-muted-foreground/80 hidden sm:inline text-[11px]">
                  • {e.lastCheckpoint ?? (running ? `Stage ${e.stagesDone + 1}/${e.stagesTotal || 6}` : 'Ready')}
                </span>
              </Link>
              <span className="text-muted-foreground text-[11px] font-mono shrink-0">
                {e.stagesDone}/{e.stagesTotal || 6}
              </span>
              <AgeBadge date={e.lastActivityAt} className="hidden md:inline-flex" />
              {needsApproval && (
                <Link
                  href={`/dashboard/my-work/${e.id}`}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[10px] shrink-0"
                >
                  Approve <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(e.id))}
                className="text-muted-foreground hover:text-white p-0.5"
                title="Dismiss ticker item"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
