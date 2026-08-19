'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, Users, Zap, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
  logs: { id: string; source: string; status: string; recordsIngested: number; errorMessage: string | null; executedAt: string | null; durationMs: number }[];
  pendingStories: { id: string; earningsAmount: number; description: string; userName: string; userEmail: string; taskTitle: string }[];
  userCount: number;
  taskCount: number;
}

export function AdminClient({ logs, pendingStories, userCount, taskCount }: Props) {
  const [stories, setStories] = useState(pendingStories ?? []);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleVerify = async (id: string, action: 'VERIFIED' | 'REJECTED') => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: action }),
      });
      if (res.ok) {
        setStories((prev) => (prev ?? []).filter((s: any) => s.id !== id));
        toast.success(`Story ${action.toLowerCase()}`);
      } else toast.error('Failed');
    } catch { toast.error('Error'); }
    setProcessing(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-8">
        <ShieldCheck className="w-7 h-7 text-red-400" /> Admin Panel
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-bg border border-border-subtle rounded-lg p-4">
          <Users className="w-5 h-5 text-blue-400 mb-1" />
          <div className="text-2xl font-bold">{userCount}</div>
          <div className="text-xs text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-card-bg border border-border-subtle rounded-lg p-4">
          <Zap className="w-5 h-5 text-gold mb-1" />
          <div className="text-2xl font-bold">{taskCount}</div>
          <div className="text-xs text-muted-foreground">Total Tasks</div>
        </div>
        <div className="bg-card-bg border border-border-subtle rounded-lg p-4">
          <Clock className="w-5 h-5 text-green-400 mb-1" />
          <div className="text-2xl font-bold">{logs?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground">Pipeline Runs</div>
        </div>
        <div className="bg-card-bg border border-border-subtle rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 mb-1" />
          <div className="text-2xl font-bold">{stories?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground">Pending Stories</div>
        </div>
      </div>

      <Tabs defaultValue="stories">
        <TabsList className="bg-card-bg border border-border-subtle mb-6">
          <TabsTrigger value="stories">Verification Queue</TabsTrigger>
          <TabsTrigger value="logs">Ingestion Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="stories">
          <div className="space-y-3">
            {(stories ?? []).map((s: any) => (
              <div key={s.id} className="bg-card-bg border border-border-subtle rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium">{s.userName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.userEmail}</span>
                  </div>
                  <span className="text-green-400 font-bold">${(s.earningsAmount ?? 0).toLocaleString('en-US')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Task: {s.taskTitle}</p>
                <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(s.id, 'VERIFIED')} disabled={processing === s.id}>
                    {processing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />} Verify
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerify(s.id, 'REJECTED')} disabled={processing === s.id}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {(stories?.length ?? 0) === 0 && <p className="text-muted-foreground text-center py-8">No pending stories</p>}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 text-muted-foreground font-medium">Source</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Records</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Duration</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log: any) => (
                  <tr key={log.id} className="border-b border-border-subtle/50">
                    <td className="py-2">{log.source}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{log.status}</span>
                    </td>
                    <td className="py-2">{log.recordsIngested}</td>
                    <td className="py-2 font-mono text-xs">{log.durationMs}ms</td>
                    <td className="py-2 text-xs text-muted-foreground">{log.executedAt ? new Date(log.executedAt).toLocaleString('en-US') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(logs?.length ?? 0) === 0 && <p className="text-muted-foreground text-center py-8">No ingestion logs yet</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
