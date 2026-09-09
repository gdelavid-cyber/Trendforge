'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AgeBadge } from '@/components/ui/age-badge';
import { Activity, CheckCircle2, AlertTriangle, Rocket, DollarSign } from 'lucide-react';

const iconFor: Record<string, any> = {
  execution_started: Rocket,
  stage_completed: CheckCircle2,
  stage_fallback: AlertTriangle,
  awaiting_approval: AlertTriangle,
  approved: CheckCircle2,
  kit_ready: CheckCircle2,
  money_received: DollarSign,
  execution_failed: AlertTriangle,
};

export function ActivityFeed() {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.activities ?? []);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/activity', { method: 'POST' });
      load();
    } catch {}
  };

  return (
    <Card className="border border-white/[0.08] bg-[#06060E]/80 backdrop-blur-xl shadow-xl">
      <CardHeader className="pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white font-orbitron uppercase tracking-wide">
            <Activity className="h-4 w-4 text-emerald-400" />
            Live Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-mono text-muted-foreground hover:text-white h-7 px-2"
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 max-h-[600px] overflow-y-auto scrollbar-thin">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 font-mono">
            No activities yet. Actions and pipeline stages will stream here in real time.
          </p>
        )}
        {items.map((a) => {
          const Icon = iconFor[a.kind] ?? Activity;
          const Wrapper = a.executionId
            ? ({ children }: any) => (
                <Link href={`/dashboard/my-work/${a.executionId}`} className="block group">
                  {children}
                </Link>
              )
            : ({ children }: any) => <div>{children}</div>;

          return (
            <Wrapper key={a.id}>
              <div
                className={`flex gap-3 rounded-lg p-2.5 hover:bg-white/[0.04] transition-colors border ${
                  !a.read
                    ? 'bg-amber-500/[0.04] border-l-2 border-l-amber-400 border-white/[0.05]'
                    : 'bg-transparent border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0 text-cyan-400 group-hover:text-emerald-400 transition-colors" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-white truncate font-mono">{a.title}</p>
                  {a.detail && (
                    <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                      {a.detail}
                    </p>
                  )}
                  <div className="pt-0.5">
                    <AgeBadge date={a.createdAt} />
                  </div>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </CardContent>
    </Card>
  );
}
