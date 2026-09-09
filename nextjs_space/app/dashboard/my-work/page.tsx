'use client';

import { useState } from 'react';
import { useMyWork } from '@/lib/hooks/use-my-work';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AgeBadge } from '@/components/ui/age-badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layouts/header';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import Link from 'next/link';
import { CheckCircle2, Clock, Loader2, AlertTriangle, Rocket, Pin, Briefcase } from 'lucide-react';

export default function MyWorkPage() {
  const { executions, activeCount } = useMyWork();
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active');
  const [items, setItems] = useState(executions);

  const load = async (f: string) => {
    setFilter(f as any);
    try {
      const res = await fetch(`/api/my-work?filter=${f}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.executions ?? []);
    } catch {}
  };

  const list = filter === 'active' ? executions : items;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-orbitron uppercase text-white flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-cyan-400" />
              My Work Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Everything the autonomous pipeline is executing, has delivered, or is awaiting your approval on.
            </p>
          </div>
          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-mono text-xs px-3 py-1 self-start sm:self-center font-bold">
            {activeCount} Active Executions
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={filter} onValueChange={load}>
              <TabsList className="bg-black/40 border border-white/[0.08]">
                <TabsTrigger value="active" className="text-xs font-mono">
                  Active ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="done" className="text-xs font-mono">
                  Completed
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs font-mono">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {list.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01]">
                <Rocket className="h-12 w-12 mx-auto mb-3 text-cyan-400/40 animate-pulse" />
                <h3 className="text-base font-bold text-white font-mono">No active executions found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Select any opportunity on the Tasks or Trends board and run the 6-stage revenue kit.
                </p>
                <Link href="/earn" className="inline-block mt-4">
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs">
                    Browse Ready Tasks &rarr;
                  </Button>
                </Link>
              </div>
            ) : (
              list.map((e) => (
                <Link key={e.id} href={`/dashboard/my-work/${e.id}`}>
                  <Card className="border border-white/[0.08] bg-black/40 hover:border-cyan-500/40 transition-all cursor-pointer backdrop-blur-md group rounded-xl shadow-lg">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {e.pinned && <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                            <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors truncate font-mono">
                              {e.trendName}
                            </h3>
                            {e.unread && (
                              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.category}</p>
                        </div>
                        <StatusBadge status={e.status} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-muted-foreground">
                            {e.lastCheckpoint ?? `Stage ${e.stagesDone}/${e.stagesTotal || 6}`}
                          </span>
                          <span className="text-foreground font-bold">
                            {e.stagesDone}/{e.stagesTotal || 6}
                          </span>
                        </div>
                        <Progress value={e.progressPct} className="h-1.5 bg-muted/40" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-white/[0.04]">
                        <AgeBadge date={e.lastActivityAt} />
                        {e.status === 'AWAITING_APPROVAL' && (
                          <span className="text-amber-400 font-bold font-mono text-[11px] flex items-center gap-1">
                            Review & approve &rarr;
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>

          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: any }> = {
    QUEUED: { label: 'Queued', className: 'text-muted-foreground border-border/40', icon: Clock },
    RUNNING: { label: 'Running', className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: Loader2 },
    AWAITING_APPROVAL: { label: 'Needs You', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: AlertTriangle },
    COMPLETED: { label: 'Done', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
    DEGRADED: { label: 'Done (degraded)', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: CheckCircle2 },
    FAILED: { label: 'Failed', className: 'text-red-400 bg-red-500/10 border-red-500/30', icon: AlertTriangle },
  };
  const c = map[status] ?? map.QUEUED;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 font-mono font-bold ${c.className}`}>
      <Icon className={`h-2.5 w-2.5 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  );
}
