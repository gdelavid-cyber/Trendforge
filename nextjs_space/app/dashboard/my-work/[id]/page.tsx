'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { ExecutionTimeline } from '@/components/execution/execution-timeline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default function MyWorkDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  useEffect(() => {
    if (!id) return;
    fetch(`/api/execution/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <Header />
        <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-12 text-center">
          <p className="text-muted-foreground">Execution not found.</p>
          <Link href="/dashboard/my-work" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Back to My Work</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white pb-20">
      <Header />
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/my-work">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <h1 className="text-lg font-bold font-mono uppercase tracking-wider text-white">
                  Execution Run & Control
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: <span className="text-cyan-400">{id}</span>
              </p>
            </div>
          </div>
        </div>

        <ExecutionTimeline executionId={id} />
      </div>
    </div>
  );
}
